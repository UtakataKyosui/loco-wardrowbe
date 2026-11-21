use crate::{clerk::ClerkAuth, dtos::common::ProblemDetails, views::auth::CurrentResponse};
use loco_rs::prelude::*;

/// Returns the signed-in user
///
/// The caller signs in with Clerk and sends the session token in the
/// `Authorization` header. The first request of a new Clerk user creates their
/// row here.
#[utoipa::path(
    get,
    path = "/api/auth/current",
    tag = "auth",
    security(("jwt_token" = [])),
    responses(
        (status = 200, description = "The signed-in user", body = CurrentResponse),
        (status = 401, description = "Missing or invalid token", body = ProblemDetails, content_type = "application/problem+json", headers(("WWW-Authenticate" = String, description = "Bearer challenge (RFC 6750 §3)"))),
        (status = 500, description = "Clerk sign-in is not configured, or Clerk's keys cannot be fetched", body = ProblemDetails, content_type = "application/problem+json"),
    ),
)]
pub(crate) async fn current(auth: ClerkAuth) -> Result<Response> {
    format::json(CurrentResponse::new(&auth.user))
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/auth")
        .add("/current", get(current))
}
