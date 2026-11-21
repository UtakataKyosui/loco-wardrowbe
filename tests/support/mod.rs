//! Signs Clerk-shaped session tokens for the tests.
//!
//! The RSA key pair is generated at run time and lives only in memory, so no
//! private key is committed to the repository.

use std::{
    sync::OnceLock,
    time::{SystemTime, UNIX_EPOCH},
};

use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use jsonwebtoken::{jwk::JwkSet, Algorithm, EncodingKey, Header};
use rsa::{
    pkcs1::{EncodeRsaPrivateKey, LineEnding},
    traits::PublicKeyParts,
    RsaPrivateKey,
};
use serde_json::{json, Value};

pub const ISSUER: &str = "https://clerk.test.invalid";
pub const KID: &str = "test-key";

pub struct TestKeys {
    encoding: EncodingKey,
    jwk: Value,
}

impl TestKeys {
    fn generate(kid: &str) -> Self {
        let private = RsaPrivateKey::new(&mut rand::rngs::OsRng, 2048).expect("RSA key");
        let pem = private
            .to_pkcs1_pem(LineEnding::LF)
            .expect("PKCS#1 PEM encoding");
        let public = private.to_public_key();
        Self {
            encoding: EncodingKey::from_rsa_pem(pem.as_bytes()).expect("encoding key"),
            jwk: json!({
                "kty": "RSA",
                "use": "sig",
                "alg": "RS256",
                "kid": kid,
                "n": URL_SAFE_NO_PAD.encode(public.n().to_bytes_be()),
                "e": URL_SAFE_NO_PAD.encode(public.e().to_bytes_be()),
            }),
        }
    }

    /// The public half, as Clerk's `/.well-known/jwks.json` would serve it.
    pub fn jwks(&self) -> JwkSet {
        serde_json::from_value(json!({ "keys": [self.jwk] })).expect("JWKS")
    }

    pub fn jwks_json(&self) -> Value {
        json!({ "keys": [self.jwk] })
    }

    /// An RS256 token with the given `kid` and claims.
    pub fn sign(&self, kid: &str, claims: &Value) -> String {
        let mut header = Header::new(Algorithm::RS256);
        header.kid = Some(kid.to_owned());
        jsonwebtoken::encode(&header, claims, &self.encoding).expect("signing")
    }

    /// A valid token for `kid` = [`KID`].
    pub fn token(&self, claims: &Value) -> String {
        self.sign(KID, claims)
    }
}

/// The key pair the verifier trusts.
pub fn keys() -> &'static TestKeys {
    static KEYS: OnceLock<TestKeys> = OnceLock::new();
    KEYS.get_or_init(|| TestKeys::generate(KID))
}

/// A second key pair, for tokens the verifier must refuse.
pub fn other_keys() -> &'static TestKeys {
    static KEYS: OnceLock<TestKeys> = OnceLock::new();
    KEYS.get_or_init(|| TestKeys::generate(KID))
}

pub fn now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_secs()
}

/// Claims of a fresh, valid session token for `sub`.
pub fn claims(sub: &str) -> Value {
    json!({
        "sub": sub,
        "iss": ISSUER,
        "iat": now(),
        "nbf": now() - 5,
        "exp": now() + 60,
        "azp": "https://app.example.com",
    })
}

pub fn with(mut claims: Value, key: &str, value: Value) -> Value {
    claims[key] = value;
    claims
}
