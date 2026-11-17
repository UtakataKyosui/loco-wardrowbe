//! The wire format of the API against the RFCs it must follow. See
//! `.claude/skills/rfc-compliance/` for the requirement behind each test.

use axum::http::Method;
use loco_rs::testing::prelude::*;
use serial_test::serial;
use wardrowbe::{app::App, views::auth::LoginResponse};

use super::prepare_data;

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

#[tokio::test]
#[serial]
async fn a_failed_login_is_a_401_with_a_challenge() {
    request::<App, _, _>(|request, _ctx| async move {
        let response = request
            .post("/api/auth/login")
            .json(&serde_json::json!({ "email": "nobody@example.com", "password": "x" }))
            .await;
        assert_problem!(response, axum::http::StatusCode::UNAUTHORIZED);
        assert_eq!(response.header("www-authenticate"), BARE_CHALLENGE);
    })
    .await;
}

// RFC 9110 §15.5.1 / §15.5.16 / §15.5.21: each request failure gets the status
// that describes it, and the body agrees with it.
#[tokio::test]
#[serial]
async fn request_body_failures_are_distinct_problems() {
    request::<App, _, _>(|request, _ctx| async move {
        let malformed = request
            .post("/api/auth/login")
            .text("{")
            .content_type("application/json")
            .await;
        assert_problem!(malformed, axum::http::StatusCode::BAD_REQUEST);

        let wrong_type = request
            .post("/api/auth/login")
            .text("{}")
            .content_type("text/plain")
            .await;
        let problem = assert_problem!(wrong_type, axum::http::StatusCode::UNSUPPORTED_MEDIA_TYPE);
        assert_eq!(problem["title"], "Unsupported Media Type");

        let wrong_shape = request
            .post("/api/auth/login")
            .json(&serde_json::json!({ "unexpected": 1 }))
            .await;
        let problem = assert_problem!(wrong_shape, axum::http::StatusCode::UNPROCESSABLE_ENTITY);
        assert_eq!(problem["title"], "Unprocessable Content");
    })
    .await;
}

// RFC 9110 §15.5.6: a 405 MUST carry `Allow`; the body is still a problem.
#[tokio::test]
#[serial]
async fn a_405_keeps_its_allow_header_and_is_a_problem() {
    request::<App, _, _>(|request, _ctx| async move {
        let response = request.get("/api/auth/login").await;
        assert_problem!(response, axum::http::StatusCode::METHOD_NOT_ALLOWED);
        assert_eq!(response.header("allow"), "POST");
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

// RFC 9111 §5.2.2.5: responses that carry a token must not be stored.
#[tokio::test]
#[serial]
async fn responses_that_carry_a_token_are_not_cacheable() {
    request::<App, _, _>(|request, ctx| async move {
        let login = prepare_data::init_user_login(&request, &ctx).await;
        let response = request
            .post("/api/auth/login")
            .json(&serde_json::json!({ "email": login.user.email, "password": "1234" }))
            .await;
        assert_eq!(response.status_code(), 200);
        assert_eq!(response.header("cache-control"), "no-store");

        // The failure paths of the same endpoints are not stored either.
        let failed = request
            .post("/api/auth/login")
            .json(&serde_json::json!({ "email": login.user.email, "password": "wrong" }))
            .await;
        assert_eq!(failed.header("cache-control"), "no-store");
    })
    .await;
}

// RFC 9562: the public identifier is a lowercase, hyphenated UUID.
#[tokio::test]
#[serial]
async fn the_pid_is_a_canonical_uuid() {
    request::<App, _, _>(|request, ctx| async move {
        let login = prepare_data::init_user_login(&request, &ctx).await;
        let response = request
            .post("/api/auth/login")
            .json(&serde_json::json!({ "email": login.user.email, "password": "1234" }))
            .await;
        let body: serde_json::Value = response.json();
        let pid = body["pid"].as_str().expect("pid is a string");
        assert_eq!(pid, pid.to_lowercase());
        assert_eq!(pid.len(), 36);
        let parsed = uuid::Uuid::parse_str(pid).expect("pid parses as a UUID");
        let login_response: LoginResponse = response.json();
        assert_eq!(login_response.pid, parsed);
    })
    .await;
}

// RFC 9110 §9.2.1: state changes are not reachable with a safe method. The
// old `GET /api/auth/verify/{token}` and `GET /api/auth/magic-link/{token}`
// are gone, and the new endpoints answer GET with 405.
#[tokio::test]
#[serial]
async fn verification_endpoints_are_not_reachable_with_get() {
    request::<App, _, _>(|request, _ctx| async move {
        for path in [
            "/api/auth/verify/some-token",
            "/api/auth/magic-link/some-token",
        ] {
            assert_problem!(request.get(path).await, axum::http::StatusCode::NOT_FOUND);
        }
        for path in ["/api/auth/verify", "/api/auth/magic-link/verify"] {
            let response = request.get(path).await;
            assert_problem!(response, axum::http::StatusCode::METHOD_NOT_ALLOWED);
            assert_eq!(response.header("allow"), "POST");
        }
    })
    .await;
}

// RFC 5321 §2.4: the domain of an address is case-insensitive.
#[tokio::test]
#[serial]
async fn the_allowed_email_domain_is_matched_case_insensitively() {
    request::<App, _, _>(|request, _ctx| async move {
        let allowed = request
            .post("/api/auth/magic-link")
            .json(&serde_json::json!({ "email": "someone@Gmail.COM" }))
            .await;
        assert_eq!(allowed.status_code(), 200);

        let rejected = request
            .post("/api/auth/magic-link")
            .json(&serde_json::json!({ "email": "someone@temp-mail.com" }))
            .await;
        assert_problem!(rejected, axum::http::StatusCode::BAD_REQUEST);
    })
    .await;
}
