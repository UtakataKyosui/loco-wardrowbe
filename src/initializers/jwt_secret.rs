//! Refuses to start with a JWT secret that is too short for the signing
//! algorithm.
//!
//! Loco decodes `auth.jwt.secret` as standard base64 and signs with HS512.
//! RFC 7518 §3.2 requires an HMAC key at least as large as the hash output:
//! 512 bits, i.e. 64 bytes **after decoding**. A shorter key is
//! brute-forceable, so a misconfigured `JWT_SECRET` should stop the boot
//! rather than silently weaken every token.

use async_trait::async_trait;
use base64::{engine::general_purpose::STANDARD, Engine};
use loco_rs::{
    app::{AppContext, Initializer},
    Error, Result,
};

/// Minimum key length for HS512 (RFC 7518 §3.2), in bytes after base64
/// decoding.
pub const MIN_KEY_BYTES: usize = 64;

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

/// Fails unless `secret` is standard base64 that decodes to at least
/// [`MIN_KEY_BYTES`] bytes (the key Loco signs with).
///
/// # Errors
///
/// When the secret is not valid base64, or its key is shorter than the HS512
/// minimum.
pub fn check_secret(secret: &str) -> Result<()> {
    let key = STANDARD.decode(secret).map_err(|_| {
        Error::string(
            "auth.jwt.secret is not valid standard base64, which Loco requires. \
             Generate one with `openssl rand -base64 72`.",
        )
    })?;
    if key.len() < MIN_KEY_BYTES {
        return Err(Error::string(&format!(
            "auth.jwt.secret decodes to {} bytes; HS512 needs at least {MIN_KEY_BYTES} \
             (RFC 7518 §3.2). Generate one with `openssl rand -base64 72`.",
            key.len()
        )));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn secret_of(bytes: usize) -> String {
        STANDARD.encode(vec![7u8; bytes])
    }

    #[test]
    fn short_keys_are_rejected() {
        assert!(check_secret(&secret_of(MIN_KEY_BYTES - 1)).is_err());
        assert!(check_secret("too-short").is_err());
    }

    #[test]
    fn the_length_is_that_of_the_decoded_key_not_of_the_text() {
        // 64 characters decode to only 48 bytes.
        let sixty_four_chars = "A".repeat(64);
        assert!(check_secret(&sixty_four_chars).is_err());
    }

    #[test]
    fn a_hash_sized_key_is_accepted() {
        assert!(check_secret(&secret_of(MIN_KEY_BYTES)).is_ok());
        assert!(check_secret(&secret_of(MIN_KEY_BYTES + 8)).is_ok());
    }

    #[test]
    fn text_that_is_not_base64_is_rejected() {
        assert!(check_secret(&"not base64! ".repeat(8)).is_err());
    }

    #[test]
    fn the_committed_dev_and_test_secrets_are_long_enough() {
        for path in ["config/development.yaml", "config/test.yaml"] {
            let text = std::fs::read_to_string(path).expect("config file");
            let secret = text
                .lines()
                .find_map(|line| line.trim().strip_prefix("secret:"))
                .map(str::trim)
                .expect("a secret line");
            // development.yaml wraps its default in `get_env(..., default="…")`.
            let secret = secret
                .split("default=\"")
                .nth(1)
                .and_then(|rest| rest.split('"').next())
                .unwrap_or(secret);
            check_secret(secret).unwrap_or_else(|err| panic!("{path}: {err}"));
        }
    }
}
