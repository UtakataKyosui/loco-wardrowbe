//! `GET /api/auth/current` with Clerk session tokens, end to end: token check,
//! just-in-time provisioning, and what a failure looks like on the wire.

use axum::http::{HeaderName, HeaderValue};
use loco_rs::testing::prelude::*;
use sea_orm::{EntityTrait, PaginatorTrait};
use serde_json::json;
use serial_test::serial;
use std::sync::Arc;
use wardrowbe::{
    app::App,
    clerk::ClerkVerifier,
    models::{_entities::users, users::Model},
};

use crate::support::{claims, keys, with, ISSUER};

fn bearer(token: &str) -> (HeaderName, HeaderValue) {
    (
        HeaderName::from_static("authorization"),
        HeaderValue::from_str(&format!("Bearer {token}")).unwrap(),
    )
}

/// Makes the app trust the test key pair instead of fetching Clerk's.
fn trust_test_keys(ctx: &loco_rs::app::AppContext) {
    ctx.shared_store
        .insert(Arc::new(ClerkVerifier::with_static_keys(
            ISSUER,
            &[],
            keys().jwks(),
        )));
}

#[tokio::test]
#[serial]
async fn the_first_request_creates_the_user_from_the_token() {
    request::<App, _, _>(|request, ctx| async move {
        trust_test_keys(&ctx);
        let token = keys().token(&with(
            with(claims("user_abc"), "email", json!("ada@example.com")),
            "name",
            json!("Ada"),
        ));
        let (name, value) = bearer(&token);

        let response = request
            .get("/api/auth/current")
            .add_header(name, value)
            .await;
        assert_eq!(response.status_code(), 200);
        let body: serde_json::Value = response.json();
        assert_eq!(body["name"], "Ada");
        assert_eq!(body["email"], "ada@example.com");

        let stored = Model::find_by_clerk_id(&ctx.db, "user_abc")
            .await
            .unwrap()
            .expect("row was created");
        assert_eq!(body["pid"], stored.pid.to_string());
    })
    .await;
}

#[tokio::test]
#[serial]
async fn the_same_clerk_user_is_one_row() {
    request::<App, _, _>(|request, ctx| async move {
        trust_test_keys(&ctx);
        let (name, value) = bearer(&keys().token(&claims("user_same")));

        let first: serde_json::Value = request
            .get("/api/auth/current")
            .add_header(name.clone(), value.clone())
            .await
            .json();
        let second: serde_json::Value = request
            .get("/api/auth/current")
            .add_header(name, value)
            .await
            .json();
        assert_eq!(first["pid"], second["pid"]);

        assert_eq!(users::Entity::find().count(&ctx.db).await.unwrap(), 1);
    })
    .await;
}

#[tokio::test]
#[serial]
async fn a_token_without_profile_claims_still_signs_in() {
    request::<App, _, _>(|request, ctx| async move {
        trust_test_keys(&ctx);
        let (name, value) = bearer(&keys().token(&claims("user_bare")));

        let response = request
            .get("/api/auth/current")
            .add_header(name, value)
            .await;
        assert_eq!(response.status_code(), 200);
        let body: serde_json::Value = response.json();
        assert!(body["email"].is_null());
        assert_eq!(body["name"], "(unnamed)");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn a_changed_email_in_clerk_reaches_the_row() {
    request::<App, _, _>(|request, ctx| async move {
        trust_test_keys(&ctx);
        for email in ["old@example.com", "new@example.com"] {
            let token = keys().token(&with(claims("user_move"), "email", json!(email)));
            let (name, value) = bearer(&token);
            request
                .get("/api/auth/current")
                .add_header(name, value)
                .await;
        }
        let stored = Model::find_by_clerk_id(&ctx.db, "user_move")
            .await
            .unwrap()
            .unwrap();
        assert_eq!(stored.email.as_deref(), Some("new@example.com"));
    })
    .await;
}

#[tokio::test]
#[serial]
async fn a_rejected_token_creates_no_user() {
    request::<App, _, _>(|request, ctx| async move {
        trust_test_keys(&ctx);
        let forged = crate::support::other_keys().token(&claims("user_forged"));
        let (name, value) = bearer(&forged);

        let response = request
            .get("/api/auth/current")
            .add_header(name, value)
            .await;
        assert_eq!(response.status_code(), 401);
        assert!(Model::find_by_clerk_id(&ctx.db, "user_forged")
            .await
            .unwrap()
            .is_none());
    })
    .await;
}
