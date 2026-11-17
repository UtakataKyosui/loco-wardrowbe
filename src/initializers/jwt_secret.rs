//! Refuses to start with a JWT secret that is too short for the signing
//! algorithm.
//!
//! Loco signs tokens with HS512, and RFC 7518 §3.2 requires an HMAC key at
//! least as large as the hash output: 512 bits, i.e. 64 bytes. A shorter
//! secret is brute-forceable, so a misconfigured `JWT_SECRET` should stop the
//! boot rather than silently weaken every token.

use async_trait::async_trait;
use loco_rs::{
    app::{AppContext, Initializer},
    Error, Result,
};

/// Minimum secret length for HS512 (RFC 7518 §3.2), in bytes.
pub const MIN_SECRET_BYTES: usize = 64;

/// Checks `auth.jwt.secret` at boot.
pub struct JwtSecretInitializer;

#[async_trait]
impl Initializer for JwtSecretInitializer {
    fn name(&self) -> String {
        "jwt-secret".to_string()
    }

    async fn before_run(&self, ctx: &AppContext) -> Result<()> {
        match ctx.config.auth.as_ref().and_then(|auth| auth.jwt.as_ref()) {
            Some(jwt) => check_secret(&jwt.secret),
            None => Ok(()),
        }
    }
}

/// Fails unless `secret` is at least [`MIN_SECRET_BYTES`] long.
///
/// # Errors
///
/// When the secret is shorter than the HS512 minimum.
pub fn check_secret(secret: &str) -> Result<()> {
    if secret.len() < MIN_SECRET_BYTES {
        return Err(Error::string(&format!(
            "auth.jwt.secret is {} bytes; HS512 needs at least {MIN_SECRET_BYTES} (RFC 7518 §3.2). \
             Generate one with `openssl rand -base64 72`.",
            secret.len()
        )));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn short_secrets_are_rejected() {
        assert!(check_secret("gg3OcwDnOCh7Rl5Soqsk").is_err());
        assert!(check_secret(&"a".repeat(MIN_SECRET_BYTES - 1)).is_err());
    }

    #[test]
    fn a_hash_sized_secret_is_accepted() {
        assert!(check_secret(&"a".repeat(MIN_SECRET_BYTES)).is_ok());
    }
}
