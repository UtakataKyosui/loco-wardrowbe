//! Builds the [`ClerkVerifier`] from `settings.clerk` and puts it in
//! `ctx.shared_store`, where the [`ClerkAuth`](crate::clerk::ClerkAuth)
//! extractor finds it.
//!
//! Without an issuer (set, or derived from the publishable key) this leaves the verifier out, so a development machine boots
//! without a Clerk account; every authenticated route then answers 500 and the
//! log says why. Production refuses to start without an issuer.

use async_trait::async_trait;
use axum::Router as AxumRouter;
use loco_rs::{
    app::{AppContext, Initializer},
    environment::Environment,
    Error, Result,
};

use crate::clerk::{ClerkSettings, ClerkVerifier};

pub struct ClerkInitializer;

#[async_trait]
impl Initializer for ClerkInitializer {
    fn name(&self) -> String {
        "clerk".to_string()
    }

    async fn after_routes(&self, router: AxumRouter, ctx: &AppContext) -> Result<AxumRouter> {
        let settings = ClerkSettings::from_context(ctx)?;

        if settings.resolved_issuer().is_empty() {
            if ctx.environment == Environment::Production {
                return Err(Error::string(
                    "no Clerk issuer: set CLERK_PUBLISHABLE_KEY (Clerk dashboard → API keys)",
                ));
            }
            tracing::warn!("CLERK_PUBLISHABLE_KEY is not set: sign-in is disabled");
            return Ok(router);
        }

        ctx.shared_store.insert(ClerkVerifier::new(&settings)?);
        Ok(router)
    }
}
