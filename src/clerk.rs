//! Sign-in with [Clerk](https://clerk.com): verifies the session tokens Clerk
//! issues, so this app needs no password, mail or token code of its own.
//!
//! The browser signs in through Clerk's components and sends the session token
//! as `Authorization: Bearer <jwt>` (RFC 6750). [`ClerkVerifier`] checks it
//! against Clerk's public keys (JWKS), following RFC 8725:
//!
//! * the algorithm is pinned to `RS256`, never read from the token;
//! * `iss` must equal the configured issuer, `exp` and `nbf` are enforced;
//! * `azp` (the origin that asked Clerk for the token) is checked when
//!   `authorized_parties` is configured.
//!
//! The [`ClerkAuth`] extractor turns a valid token into a [`users::Model`],
//! creating the row on the first request (just-in-time provisioning). Clerk
//! does not put an e-mail address into the default session token; add `email`
//! and `name` to the session token in the Clerk dashboard to have them stored
//! (Sessions → Customize session token).

use std::{
    sync::RwLock,
    time::{Duration, Instant},
};

use axum::{
    extract::{FromRef, FromRequestParts},
    http::request::Parts,
};
use base64::{engine::general_purpose::STANDARD, Engine};
use jsonwebtoken::{
    decode, decode_header,
    jwk::{Jwk, JwkSet},
    Algorithm, DecodingKey, Validation,
};
use loco_rs::{app::AppContext, Error};
use serde::Deserialize;

use crate::models::users;

/// The only algorithm Clerk signs session tokens with.
const ALGORITHM: Algorithm = Algorithm::RS256;

/// Clock skew tolerated when checking `exp` and `nbf`.
const LEEWAY_SECS: u64 = 5;

/// An unknown `kid` re-reads the JWKS at most this often, so a stream of
/// forged tokens cannot turn into a stream of requests to Clerk.
const MIN_REFRESH_INTERVAL: Duration = Duration::from_secs(30);

/// Limit on how long fetching the JWKS may take.
const FETCH_TIMEOUT: Duration = Duration::from_secs(5);

/// `settings.clerk` in `config/*.yaml`.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default)]
pub struct ClerkSettings {
    /// Clerk's publishable key (`pk_test_...` / `pk_live_...`), the same one
    /// the frontend uses. It encodes the Frontend API domain, so the issuer
    /// follows from it.
    pub publishable_key: String,
    /// Clerk's Frontend API URL, e.g. `https://example-12.clerk.accounts.dev`:
    /// the `iss` of every token. Empty means the one derived from the
    /// publishable key; set it only for a custom Clerk domain.
    pub issuer: String,
    /// Where the public keys are. Empty means `<issuer>/.well-known/jwks.json`.
    pub jwks_url: String,
    /// Comma-separated origins allowed in the `azp` claim. Empty skips the check.
    pub authorized_parties: String,
}

impl ClerkSettings {
    /// Reads `settings.clerk` from the app config.
    ///
    /// # Errors
    ///
    /// When `settings.clerk` is present but is not the shape above.
    pub fn from_context(ctx: &AppContext) -> loco_rs::Result<Self> {
        let Some(clerk) = ctx
            .config
            .settings
            .as_ref()
            .and_then(|settings| settings.get("clerk"))
        else {
            return Ok(Self::default());
        };
        serde_json::from_value(clerk.clone())
            .map_err(|err| Error::string(&format!("settings.clerk is invalid: {err}")))
    }

    /// The issuer: the configured one, else the Frontend API URL inside the
    /// publishable key. Empty when neither is available.
    #[must_use]
    pub fn resolved_issuer(&self) -> String {
        let issuer = self.issuer.trim();
        if !issuer.is_empty() {
            return issuer.trim_end_matches('/').to_owned();
        }
        issuer_from_publishable_key(&self.publishable_key).unwrap_or_default()
    }

    /// The JWKS URL, derived from the issuer unless set explicitly.
    #[must_use]
    pub fn resolved_jwks_url(&self) -> String {
        if self.jwks_url.trim().is_empty() {
            format!("{}/.well-known/jwks.json", self.resolved_issuer())
        } else {
            self.jwks_url.trim().to_owned()
        }
    }

    fn parties(&self) -> Vec<String> {
        self.authorized_parties
            .split(',')
            .map(str::trim)
            .filter(|party| !party.is_empty())
            .map(str::to_owned)
            .collect()
    }
}

/// The Frontend API URL inside a publishable key.
///
/// The key is `pk_<test|live>_` followed by the base64 of `<domain>$`.
#[must_use]
pub fn issuer_from_publishable_key(key: &str) -> Option<String> {
    let encoded = key.trim().strip_prefix("pk_")?.split_once('_')?.1;
    let decoded = STANDARD.decode(encoded).ok()?;
    let domain = String::from_utf8(decoded).ok()?;
    let domain = domain.strip_suffix('$')?;
    let valid = !domain.is_empty()
        && domain
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'.' || b == b'-');
    valid.then(|| format!("https://{domain}"))
}

/// The claims of a Clerk session token that this app reads.
#[derive(Debug, Clone, Deserialize)]
pub struct Claims {
    /// Clerk's user id (`user_...`).
    pub sub: String,
    pub iss: String,
    /// The origin that requested the token.
    #[serde(default)]
    pub azp: Option<String>,
    /// Present only when added to the session token in the Clerk dashboard.
    #[serde(default)]
    pub email: Option<String>,
    #[serde(default)]
    pub name: Option<String>,
}

/// Why a token was not accepted.
#[derive(Debug)]
pub enum VerifyError {
    /// The caller's token is bad: a 401.
    Rejected(&'static str),
    /// Clerk's keys could not be fetched or sign-in is not configured: not the
    /// caller's fault.
    Unavailable(String),
}

impl std::fmt::Display for VerifyError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Rejected(reason) => f.write_str(reason),
            Self::Unavailable(reason) => f.write_str(reason),
        }
    }
}

impl std::error::Error for VerifyError {}

impl From<VerifyError> for Error {
    fn from(err: VerifyError) -> Self {
        match err {
            VerifyError::Rejected(reason) => Self::Unauthorized(reason.to_owned()),
            VerifyError::Unavailable(reason) => {
                // The reason names a host or a config key; keep it in the log,
                // not in the response (RFC 9457 §5).
                tracing::error!(reason, "Clerk sign-in is unavailable");
                Self::InternalServerError
            }
        }
    }
}

enum KeySource {
    /// Fetched from Clerk on demand.
    Remote {
        url: String,
        client: reqwest::Client,
    },
    /// Fixed keys; used by tests.
    Static,
}

struct Keys {
    set: JwkSet,
    fetched_at: Option<Instant>,
}

/// Verifies Clerk session tokens. Built once at boot and kept in
/// `ctx.shared_store`.
pub struct ClerkVerifier {
    issuer: String,
    authorized_parties: Vec<String>,
    source: KeySource,
    keys: RwLock<Keys>,
}

impl ClerkVerifier {
    /// A verifier that fetches keys from Clerk.
    ///
    /// # Errors
    ///
    /// When the HTTP client cannot be built.
    pub fn new(settings: &ClerkSettings) -> loco_rs::Result<Self> {
        let client = reqwest::Client::builder()
            .timeout(FETCH_TIMEOUT)
            .build()
            .map_err(|err| Error::string(&format!("cannot build the JWKS client: {err}")))?;
        Ok(Self {
            issuer: settings.resolved_issuer(),
            authorized_parties: settings.parties(),
            source: KeySource::Remote {
                url: settings.resolved_jwks_url(),
                client,
            },
            keys: RwLock::new(Keys {
                set: JwkSet { keys: Vec::new() },
                fetched_at: None,
            }),
        })
    }

    /// A verifier with fixed keys and no network access, for tests.
    #[must_use]
    pub fn with_static_keys(issuer: &str, authorized_parties: &[&str], set: JwkSet) -> Self {
        Self {
            issuer: issuer.to_owned(),
            authorized_parties: authorized_parties.iter().map(|p| (*p).to_owned()).collect(),
            source: KeySource::Static,
            keys: RwLock::new(Keys {
                set,
                fetched_at: None,
            }),
        }
    }

    /// Checks `token` and returns its claims.
    ///
    /// # Errors
    ///
    /// [`VerifyError::Rejected`] when the token is malformed, signed with
    /// another key or algorithm, expired, from another issuer or origin;
    /// [`VerifyError::Unavailable`] when Clerk's keys cannot be fetched.
    pub async fn verify(&self, token: &str) -> Result<Claims, VerifyError> {
        let header = decode_header(token).map_err(|_| VerifyError::Rejected("malformed token"))?;
        if header.alg != ALGORITHM {
            return Err(VerifyError::Rejected("unexpected signing algorithm"));
        }
        let kid = header
            .kid
            .ok_or(VerifyError::Rejected("token has no key id"))?;

        let jwk = self
            .find_key(&kid)
            .await?
            .ok_or(VerifyError::Rejected("unknown signing key"))?;
        let key = DecodingKey::from_jwk(&jwk)
            .map_err(|_| VerifyError::Rejected("unusable signing key"))?;

        let mut validation = Validation::new(ALGORITHM);
        validation.set_issuer(&[&self.issuer]);
        validation.set_required_spec_claims(&["exp", "iss", "sub"]);
        validation.validate_nbf = true;
        validation.leeway = LEEWAY_SECS;
        // Clerk session tokens carry no `aud`; `azp` is checked below.
        validation.validate_aud = false;

        let claims = decode::<Claims>(token, &key, &validation)
            .map_err(|err| {
                tracing::debug!(error = %err, "Clerk token rejected");
                VerifyError::Rejected("invalid token")
            })?
            .claims;

        if !self.authorized_parties.is_empty()
            && !claims
                .azp
                .as_ref()
                .is_some_and(|azp| self.authorized_parties.contains(azp))
        {
            return Err(VerifyError::Rejected("token was issued for another origin"));
        }
        Ok(claims)
    }

    async fn find_key(&self, kid: &str) -> Result<Option<Jwk>, VerifyError> {
        if let Some(jwk) = self.cached(kid) {
            return Ok(Some(jwk));
        }
        let KeySource::Remote { url, client } = &self.source else {
            return Ok(None);
        };
        if self.recently_fetched() {
            return Ok(None);
        }
        let set = fetch_jwks(client, url).await?;
        let mut keys = self
            .keys
            .write()
            .unwrap_or_else(std::sync::PoisonError::into_inner);
        keys.set = set;
        keys.fetched_at = Some(Instant::now());
        Ok(keys.set.find(kid).cloned())
    }

    fn cached(&self, kid: &str) -> Option<Jwk> {
        self.keys
            .read()
            .unwrap_or_else(std::sync::PoisonError::into_inner)
            .set
            .find(kid)
            .cloned()
    }

    fn recently_fetched(&self) -> bool {
        self.keys
            .read()
            .unwrap_or_else(std::sync::PoisonError::into_inner)
            .fetched_at
            .is_some_and(|at| at.elapsed() < MIN_REFRESH_INTERVAL)
    }
}

async fn fetch_jwks(client: &reqwest::Client, url: &str) -> Result<JwkSet, VerifyError> {
    let unavailable = |err: reqwest::Error| {
        VerifyError::Unavailable(format!("cannot fetch the Clerk JWKS from {url}: {err}"))
    };
    client
        .get(url)
        .send()
        .await
        .and_then(reqwest::Response::error_for_status)
        .map_err(unavailable)?
        .json::<JwkSet>()
        .await
        .map_err(unavailable)
}

/// The signed-in user. Add it to a handler's arguments to require sign-in; a
/// missing or invalid token is a 401.
#[derive(Debug)]
pub struct ClerkAuth {
    pub claims: Claims,
    pub user: users::Model,
}

impl<S> FromRequestParts<S> for ClerkAuth
where
    AppContext: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = Error;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Error> {
        let ctx = AppContext::from_ref(state);

        let token = bearer_token(parts)
            .ok_or_else(|| Error::Unauthorized("missing bearer token".to_owned()))?;

        let claims = {
            let verifier = ctx.shared_store.get_ref::<ClerkVerifier>().ok_or_else(|| {
                Error::from(VerifyError::Unavailable(
                    "Clerk is not configured (settings.clerk.issuer is empty)".to_owned(),
                ))
            })?;
            // Release the store's lock before awaiting.
            let verifier: &ClerkVerifier = &verifier;
            let claims = verifier.verify(token).await;
            claims.map_err(Error::from)?
        };

        let user = users::Model::find_or_create_by_clerk(&ctx.db, &claims)
            .await
            .map_err(|err| {
                tracing::error!(error = %err, "could not load the signed-in user");
                Error::InternalServerError
            })?;
        Ok(Self { claims, user })
    }
}

/// The token of an `Authorization: Bearer <token>` header. The scheme name is
/// case-insensitive (RFC 9110 §11.1).
fn bearer_token(parts: &Parts) -> Option<&str> {
    let value = parts.headers.get(axum::http::header::AUTHORIZATION)?;
    let (scheme, token) = value.to_str().ok()?.split_once(' ')?;
    let token = token.trim();
    (scheme.eq_ignore_ascii_case("bearer") && !token.is_empty()).then_some(token)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn settings(issuer: &str, jwks_url: &str, parties: &str) -> ClerkSettings {
        ClerkSettings {
            publishable_key: String::new(),
            issuer: issuer.to_owned(),
            jwks_url: jwks_url.to_owned(),
            authorized_parties: parties.to_owned(),
        }
    }

    #[test]
    fn the_jwks_url_is_derived_from_the_issuer() {
        let derived = settings("https://a.clerk.accounts.dev/", "", "").resolved_jwks_url();
        assert_eq!(
            derived,
            "https://a.clerk.accounts.dev/.well-known/jwks.json"
        );
    }

    #[test]
    fn an_explicit_jwks_url_wins() {
        let url =
            settings("https://a.example", "https://keys.example/jwks", "").resolved_jwks_url();
        assert_eq!(url, "https://keys.example/jwks");
    }

    #[test]
    fn parties_are_split_and_trimmed() {
        let parties = settings("", "", " https://a.example , ,https://b.example").parties();
        assert_eq!(parties, ["https://a.example", "https://b.example"]);
    }

    fn key_for(domain: &str) -> String {
        format!("pk_test_{}", STANDARD.encode(format!("{domain}$")))
    }

    #[test]
    fn the_issuer_follows_from_the_publishable_key() {
        let key = key_for("example-12.clerk.accounts.dev");
        assert_eq!(
            issuer_from_publishable_key(&key).as_deref(),
            Some("https://example-12.clerk.accounts.dev")
        );
        let live = format!("pk_live_{}", STANDARD.encode("clerk.example.com$"));
        assert_eq!(
            issuer_from_publishable_key(&live).as_deref(),
            Some("https://clerk.example.com")
        );
    }

    #[test]
    fn a_publishable_key_that_is_not_one_gives_no_issuer() {
        for key in [
            "",
            "not-a-key",
            "pk_test_!!!",
            // no trailing `$`
            &format!("pk_test_{}", STANDARD.encode("example.clerk.dev")),
            // a path smuggled into the domain
            &format!("pk_test_{}", STANDARD.encode("evil.example/x$")),
        ] {
            assert_eq!(issuer_from_publishable_key(key), None, "{key}");
        }
    }

    #[test]
    fn an_explicit_issuer_beats_the_publishable_key() {
        let mut s = settings("https://clerk.example.com/", "", "");
        s.publishable_key = key_for("example-12.clerk.accounts.dev");
        assert_eq!(s.resolved_issuer(), "https://clerk.example.com");
        s.issuer.clear();
        assert_eq!(s.resolved_issuer(), "https://example-12.clerk.accounts.dev");
        assert_eq!(
            s.resolved_jwks_url(),
            "https://example-12.clerk.accounts.dev/.well-known/jwks.json"
        );
    }
}
