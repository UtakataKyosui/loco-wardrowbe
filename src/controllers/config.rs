//! The public settings the SPA reads when it starts.
//!
//! Clerk's publishable key is public by design. Serving it from here lets one
//! build run with any key, since the backend already has it in its config.

use axum::http::{header::CACHE_CONTROL, HeaderValue};
use loco_rs::prelude::*;
use serde::Serialize;

use crate::clerk::ClerkSettings;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct PublicConfig {
    clerk_publishable_key: String,
}

async fn show(State(ctx): State<AppContext>) -> Result<Response> {
    let settings = ClerkSettings::from_context(&ctx)?;
    let mut response = format::json(PublicConfig {
        clerk_publishable_key: settings.publishable_key.trim().to_owned(),
    })?;
    response
        .headers_mut()
        .insert(CACHE_CONTROL, HeaderValue::from_static("no-cache"));
    Ok(response)
}

pub fn routes() -> Routes {
    Routes::new().add("/config.json", get(show))
}
