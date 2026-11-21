//! The wire format of the API against the RFCs it must follow. See
//! `.claude/skills/rfc-compliance/` for the requirement behind each test.

use axum::http::Method;
use loco_rs::testing::prelude::*;
use serial_test::serial;
use std::sync::Arc;
use wardrowbe::{app::App, clerk::ClerkVerifier};

use crate::support::{claims, keys, ISSUER};

const PROBLEM_JSON: &str = "application/problem+json";
const BARE_CHALLENGE: &str = r#"Bearer realm="wardrowbe""#;
const INVALID_TOKEN_CHALLENGE: &str = r#"Bearer realm="wardrowbe", error="invalid_token""#;

/// RFC 9457: the body is a problem document, and its `status` is the status
/// of the HTTP response (§3.1.2: generators MUST use the same status code).
macro_rules! assert_problem {
    ($response:expr, $status:expr) => {{
        let response = &$response;
        assert_eq!(response.status_code(), $status);
        assert_eq!(response.header("content-type"), PROBLEM_JSON);
        let problem: serde_json::Value = response.json();
        assert_eq!(problem["status"], $status.as_u16());
        assert!(
            problem["title"].as_str().is_some_and(|t| !t.is_empty()),
            "a problem has a title: {problem}"
        );
        assert_eq!(problem["type"], "about:blank");
        problem
    }};
}

// RFC 9110 §15.5.2: a 401 MUST carry a WWW-Authenticate challenge.
// RFC 6750 §3.1: no `error` when the request had no credentials.
#[tokio::test]
#[serial]
async fn a_401_without_credentials_carries_a_bare_bearer_challenge() {
    request::<App, _, _>(|request, _ctx| async move {
        let response = request.get("/api/auth/current").await;
        assert_problem!(response, axum::http::StatusCode::UNAUTHORIZED);
        assert_eq!(response.header("www-authenticate"), BARE_CHALLENGE);
    })
    .await;
}

// RFC 6750 §3.1: `invalid_token` when the presented token is rejected.
#[tokio::test]
#[serial]
async fn a_rejected_bearer_token_is_reported_as_invalid_token() {
    request::<App, _, _>(|request, _ctx| async move {
        let response = request
            .get("/api/auth/current")
            .add_header("authorization", "Bearer not-a-jwt")
            .await;
        assert_problem!(response, axum::http::StatusCode::UNAUTHORIZED);
        assert_eq!(response.header("www-authenticate"), INVALID_TOKEN_CHALLENGE);
    })
    .await;
}

// RFC 9457 §5: the reason a token was refused is not spelled out to the caller.
#[tokio::test]
#[serial]
async fn a_rejected_token_does_not_reveal_why() {
    request::<App, _, _>(|request, ctx| async move {
        ctx.shared_store
            .insert(Arc::new(ClerkVerifier::with_static_keys(
                ISSUER,
                &[],
                keys().jwks(),
            )));
        let expired = keys().token(&crate::support::with(
            claims("u"),
            "exp",
            serde_json::json!(crate::support::now() - 3600),
        ));
        let response = request
            .get("/api/auth/current")
            .add_header("authorization", format!("Bearer {expired}"))
            .await;
        let problem = assert_problem!(response, axum::http::StatusCode::UNAUTHORIZED);
        let detail = problem["detail"].to_string().to_lowercase();
        assert!(
            !detail.contains("expired"),
            "detail leaks the reason: {detail}"
        );
    })
    .await;
}

// RFC 9110 §15.6.1: a server-side failure is a 5xx, not a 401, and its detail
// does not name the configuration (RFC 9457 §5).
#[tokio::test]
#[serial]
async fn missing_clerk_configuration_is_a_500_that_does_not_leak() {
    request::<App, _, _>(|request, ctx| async move {
        let _ = ctx.shared_store.remove::<Arc<ClerkVerifier>>();
        let response = request
            .get("/api/auth/current")
            .add_header(
                "authorization",
                format!("Bearer {}", keys().token(&claims("u"))),
            )
            .await;
        let problem = assert_problem!(response, axum::http::StatusCode::INTERNAL_SERVER_ERROR);
        assert!(!problem["detail"].to_string().contains("issuer"));
    })
    .await;
}

// RFC 9110 §15.5.1 / §15.5.6: the router's own failures are problems too, and
// a 405 keeps its `Allow`.
#[tokio::test]
#[serial]
async fn a_405_keeps_its_allow_header_and_is_a_problem() {
    request::<App, _, _>(|request, _ctx| async move {
        let response = request.post("/api/auth/current").await;
        assert_problem!(response, axum::http::StatusCode::METHOD_NOT_ALLOWED);
        let allow = response.header("allow");
        let allow = allow.to_str().unwrap();
        assert!(allow.contains("GET"), "Allow: {allow}");
    })
    .await;
}

#[tokio::test]
#[serial]
async fn an_unknown_api_route_is_a_problem() {
    request::<App, _, _>(|request, _ctx| async move {
        let response = request.get("/api/does-not-exist").await;
        assert_problem!(response, axum::http::StatusCode::NOT_FOUND);
    })
    .await;
}

// RFC 9110 §9.3.2: a HEAD response has the headers of the GET response and no
// content.
#[tokio::test]
#[serial]
async fn a_head_response_has_no_body() {
    request::<App, _, _>(|request, _ctx| async move {
        let response = request.method(Method::HEAD, "/api/auth/current").await;
        assert_eq!(response.status_code(), 401);
        assert_eq!(response.header("content-type"), PROBLEM_JSON);
        assert_eq!(response.header("www-authenticate"), BARE_CHALLENGE);
        assert!(response.text().is_empty());
    })
    .await;
}

// RFC 9111 §5.2.2.5: what is private to a signed-in user must not be stored.
#[tokio::test]
#[serial]
async fn the_signed_in_user_is_not_cacheable() {
    request::<App, _, _>(|request, ctx| async move {
        ctx.shared_store
            .insert(Arc::new(ClerkVerifier::with_static_keys(
                ISSUER,
                &[],
                keys().jwks(),
            )));
        let response = request
            .get("/api/auth/current")
            .add_header(
                "authorization",
                format!("Bearer {}", keys().token(&claims("u"))),
            )
            .await;
        assert_eq!(response.status_code(), 200);
        assert_eq!(response.header("cache-control"), "no-store");
    })
    .await;
}

// RFC 9562: the public identifier is a lowercase, hyphenated UUID.
#[tokio::test]
#[serial]
async fn the_pid_is_a_canonical_uuid() {
    request::<App, _, _>(|request, ctx| async move {
        ctx.shared_store
            .insert(Arc::new(ClerkVerifier::with_static_keys(
                ISSUER,
                &[],
                keys().jwks(),
            )));
        let response = request
            .get("/api/auth/current")
            .add_header(
                "authorization",
                format!("Bearer {}", keys().token(&claims("u"))),
            )
            .await;
        let body: serde_json::Value = response.json();
        let pid = body["pid"].as_str().expect("pid is a string");
        assert_eq!(pid, pid.to_lowercase());
        assert_eq!(pid.len(), 36);
        uuid::Uuid::parse_str(pid).expect("pid parses as a UUID");
    })
    .await;
}
