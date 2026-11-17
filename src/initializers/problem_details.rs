//! RFC-conformant error responses for the `/api/` routes.
//!
//! Loco builds error bodies itself (`loco_rs::controller::ErrorDetail`,
//! `{"error", "description", "errors"}` as `application/json`) and offers no
//! hook to change that. This initializer wraps the whole router in one
//! middleware that, for every `/api/` response:
//!
//! * turns a 4xx / 5xx body into an RFC 9457 `application/problem+json`
//!   document ([`ProblemDetails`]), whatever produced it: a handler, the JWT
//!   extractor, the `Json` extractor, the router (404 / 405);
//! * adds the `WWW-Authenticate` challenge that RFC 9110 §15.5.2 requires on
//!   every 401 (RFC 6750 §3 syntax);
//! * marks `/api/auth/` responses `Cache-Control: no-store`, because they
//!   carry tokens (RFC 9111 §5.2.2.5).
//!
//! Handlers keep returning `loco_rs::Error` / `unauthorized(...)` as usual.

use async_trait::async_trait;
use axum::{
    body::{to_bytes, Body},
    extract::Request,
    http::{
        header::{AUTHORIZATION, CACHE_CONTROL, CONTENT_LENGTH, CONTENT_TYPE, WWW_AUTHENTICATE},
        HeaderMap, HeaderValue, StatusCode,
    },
    middleware::{from_fn, Next},
    response::Response,
    Router as AxumRouter,
};
use loco_rs::{
    app::{AppContext, Initializer},
    Result,
};
use serde_json::Value;

use crate::dtos::common::{FieldError, ProblemDetails};

/// Media type of the error bodies (RFC 9457 §6.2).
pub const PROBLEM_JSON: &str = "application/problem+json";

/// Error bodies are tiny; refuse to buffer anything larger.
const MAX_ERROR_BODY: usize = 64 * 1024;

/// Wraps the router with the problem-details middleware.
pub struct ProblemDetailsInitializer;

#[async_trait]
impl Initializer for ProblemDetailsInitializer {
    fn name(&self) -> String {
        "problem-details".to_string()
    }

    async fn after_routes(&self, router: AxumRouter, _ctx: &AppContext) -> Result<AxumRouter> {
        Ok(router.layer(from_fn(problem_details)))
    }
}

async fn problem_details(req: Request, next: Next) -> Response {
    let path = req.uri().path().to_owned();
    // `/api/` only: `/api-docs`, `/scalar` and the SPA keep their own bodies.
    if !path.starts_with("/api/") {
        return next.run(req).await;
    }
    let bearer_presented = presents_bearer(req.headers());

    let mut res = next.run(req).await;

    if res.status().as_u16() >= 400 {
        res = into_problem(res).await;
        if res.status() == StatusCode::UNAUTHORIZED && !res.headers().contains_key(WWW_AUTHENTICATE)
        {
            res.headers_mut().insert(
                WWW_AUTHENTICATE,
                HeaderValue::from_static(challenge(bearer_presented)),
            );
        }
    }
    if path.starts_with("/api/auth/") && !res.headers().contains_key(CACHE_CONTROL) {
        res.headers_mut()
            .insert(CACHE_CONTROL, HeaderValue::from_static("no-store"));
    }
    res
}

/// The `WWW-Authenticate` value for a 401 (RFC 6750 §3).
///
/// A request that carried no credentials gets the bare challenge, with no
/// `error` (§3.1: SHOULD NOT include one); a request whose Bearer token was
/// rejected gets `error="invalid_token"`.
const fn challenge(bearer_presented: bool) -> &'static str {
    if bearer_presented {
        r#"Bearer realm="wardrowbe", error="invalid_token""#
    } else {
        r#"Bearer realm="wardrowbe""#
    }
}

/// `true` when the request sent `Authorization: Bearer ...` (the scheme name is
/// case-insensitive, RFC 9110 §11.1).
fn presents_bearer(headers: &HeaderMap) -> bool {
    headers
        .get(AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split_once(' '))
        .is_some_and(|(scheme, _)| scheme.eq_ignore_ascii_case("bearer"))
}

async fn into_problem(res: Response) -> Response {
    let (mut parts, body) = res.into_parts();

    let already_problem = parts
        .headers
        .get(CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .is_some_and(|value| value.starts_with(PROBLEM_JSON));
    if already_problem {
        return Response::from_parts(parts, body);
    }

    let bytes = to_bytes(body, MAX_ERROR_BODY).await.unwrap_or_default();
    let request_id = parts
        .headers
        .get("x-request-id")
        .and_then(|value| value.to_str().ok());
    let problem = problem_from_loco(parts.status, &bytes, request_id);

    // Validation failures are 422 (RFC 9110 §15.5.21): the body is well formed
    // but cannot be processed. Loco reports them as 400.
    parts.status = StatusCode::from_u16(problem.status).unwrap_or(parts.status);

    let body = serde_json::to_vec(&problem).unwrap_or_default();
    parts.headers.remove(CONTENT_LENGTH);
    parts
        .headers
        .insert(CONTENT_TYPE, HeaderValue::from_static(PROBLEM_JSON));
    Response::from_parts(parts, Body::from(body))
}

/// Builds the problem document for a response that Loco / axum produced.
///
/// `body` is whatever the response carried: Loco's
/// `{"error", "description", "errors"}`, or nothing (404, 405).
#[must_use]
pub fn problem_from_loco(
    status: StatusCode,
    body: &[u8],
    request_id: Option<&str>,
) -> ProblemDetails {
    let loco: Value = serde_json::from_slice(body).unwrap_or(Value::Null);
    let description = loco
        .get("description")
        .and_then(Value::as_str)
        .filter(|text| !text.is_empty());
    let errors = loco.get("errors").and_then(field_errors);

    // Loco reports a failed validation as 400 with only `errors` set.
    let status = if errors.is_some() && status == StatusCode::BAD_REQUEST {
        StatusCode::UNPROCESSABLE_ENTITY
    } else {
        status
    };

    // Never put internals in a 5xx (RFC 9457 §5); the log has them, and
    // `instance` finds the entry.
    let detail = if status.is_server_error() {
        Some("An unexpected error occurred.".to_string())
    } else {
        description
            .map(str::to_string)
            .or_else(|| default_detail(status).map(str::to_string))
    };

    ProblemDetails {
        type_: "about:blank".to_string(),
        title: title(status),
        status: status.as_u16(),
        detail,
        instance: request_id
            .filter(|id| uuid::Uuid::parse_str(id).is_ok())
            .map(|id| format!("urn:uuid:{id}")),
        errors,
    }
}

/// The HTTP status phrase, which is the `title` of an `about:blank` problem
/// (RFC 9457 §4.2.1). 422 uses the current RFC 9110 name.
fn title(status: StatusCode) -> String {
    if status == StatusCode::UNPROCESSABLE_ENTITY {
        return "Unprocessable Content".to_string();
    }
    status.canonical_reason().unwrap_or("Error").to_string()
}

/// A `detail` for statuses whose Loco body says nothing useful.
fn default_detail(status: StatusCode) -> Option<&'static str> {
    match status {
        StatusCode::BAD_REQUEST => Some("The request is malformed or invalid."),
        StatusCode::UNAUTHORIZED => {
            Some("Authentication is required, or the credentials are invalid.")
        }
        StatusCode::NOT_FOUND => Some("The requested resource was not found."),
        StatusCode::METHOD_NOT_ALLOWED => Some("The method is not allowed for this resource."),
        StatusCode::UNSUPPORTED_MEDIA_TYPE => {
            Some("The request Content-Type is not supported; use application/json.")
        }
        StatusCode::UNPROCESSABLE_ENTITY => {
            Some("The request body is well formed but does not match the expected schema.")
        }
        _ => None,
    }
}

/// Maps Loco's `{"field": [{"code", "message"}]}` onto RFC 9457's
/// `[{"pointer", "detail"}]`.
fn field_errors(errors: &Value) -> Option<Vec<FieldError>> {
    let map = errors.as_object()?;
    let list: Vec<FieldError> = map
        .iter()
        .flat_map(|(field, entries)| {
            entries
                .as_array()
                .into_iter()
                .flatten()
                .map(move |entry| FieldError {
                    pointer: format!("/{field}"),
                    detail: entry
                        .get("message")
                        .and_then(Value::as_str)
                        .or_else(|| entry.get("code").and_then(Value::as_str))
                        .unwrap_or("invalid")
                        .to_string(),
                })
        })
        .collect();
    (!list.is_empty()).then_some(list)
}

#[cfg(test)]
mod tests {
    use super::*;

    const UUID: &str = "0a3f6a5e-1c4b-4b86-9f4e-6a1d2f0c9b11";

    #[test]
    fn loco_unauthorized_becomes_a_problem() {
        let body = br#"{"error":"unauthorized","description":"You do not have permission to access this resource"}"#;
        let problem = problem_from_loco(StatusCode::UNAUTHORIZED, body, Some(UUID));
        assert_eq!(problem.type_, "about:blank");
        assert_eq!(problem.title, "Unauthorized");
        assert_eq!(problem.status, 401);
        assert_eq!(
            problem.detail.as_deref(),
            Some("You do not have permission to access this resource")
        );
        assert_eq!(problem.instance, Some(format!("urn:uuid:{UUID}")));
    }

    #[test]
    fn json_extractor_failures_get_a_detail_that_fits_the_status() {
        let body = br#"{"error":"Bad Request"}"#;
        let unsupported = problem_from_loco(StatusCode::UNSUPPORTED_MEDIA_TYPE, body, None);
        assert_eq!(unsupported.title, "Unsupported Media Type");
        assert!(unsupported.detail.unwrap().contains("application/json"));

        let schema = problem_from_loco(StatusCode::UNPROCESSABLE_ENTITY, body, None);
        assert_eq!(schema.title, "Unprocessable Content");
        assert_eq!(schema.status, 422);
    }

    #[test]
    fn empty_bodies_are_filled_in() {
        let problem = problem_from_loco(StatusCode::NOT_FOUND, b"", None);
        assert_eq!(problem.status, 404);
        assert_eq!(problem.title, "Not Found");
        assert!(problem.detail.is_some());
        assert!(problem.instance.is_none());
    }

    #[test]
    fn validation_failures_become_422_with_json_pointers() {
        let body = br#"{"errors":{"email":[{"code":"email","message":"invalid email"}],"name":[{"code":"length"}]}}"#;
        let problem = problem_from_loco(StatusCode::BAD_REQUEST, body, None);
        assert_eq!(problem.status, 422);
        let errors = problem.errors.expect("field errors");
        assert_eq!(errors.len(), 2);
        assert_eq!(errors[0].pointer, "/email");
        assert_eq!(errors[0].detail, "invalid email");
        assert_eq!(errors[1].pointer, "/name");
        assert_eq!(errors[1].detail, "length");
    }

    #[test]
    fn server_errors_do_not_leak_their_description() {
        let body = br#"{"error":"internal_server_error","description":"connection to db failed: password=hunter2"}"#;
        let problem = problem_from_loco(StatusCode::INTERNAL_SERVER_ERROR, body, None);
        assert_eq!(
            problem.detail.as_deref(),
            Some("An unexpected error occurred.")
        );
    }

    #[test]
    fn a_request_id_that_is_not_a_uuid_is_not_an_instance() {
        let problem = problem_from_loco(StatusCode::NOT_FOUND, b"", Some("abc"));
        assert!(problem.instance.is_none());
    }

    #[test]
    fn challenge_names_the_error_only_when_a_token_was_rejected() {
        assert_eq!(challenge(false), r#"Bearer realm="wardrowbe""#);
        assert_eq!(
            challenge(true),
            r#"Bearer realm="wardrowbe", error="invalid_token""#
        );
    }

    #[test]
    fn bearer_scheme_is_matched_case_insensitively() {
        let mut headers = HeaderMap::new();
        assert!(!presents_bearer(&headers));
        headers.insert(AUTHORIZATION, HeaderValue::from_static("bearer abc"));
        assert!(presents_bearer(&headers));
        headers.insert(AUTHORIZATION, HeaderValue::from_static("Basic abc"));
        assert!(!presents_bearer(&headers));
    }
}
