use crate::{
    dtos::common::ProblemDetails,
    mailers::auth::AuthMailer,
    models::{
        _entities::users,
        users::{LoginParams, RegisterParams},
    },
    views::auth::{CurrentResponse, LoginResponse},
};
use axum::http::StatusCode;
use loco_rs::prelude::*;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

/// Domains that may request a magic link.
const ALLOWED_EMAIL_DOMAINS: [&str; 2] = ["example.com", "gmail.com"];

/// Whether the domain of `email` is on the allow-list.
///
/// The domain of an address is case-insensitive (RFC 5321 §2.4, RFC 4343), so
/// `x@Gmail.com` is as allowed as `x@gmail.com`.
fn is_allowed_email_domain(email: &str) -> bool {
    email.rsplit_once('@').is_some_and(|(_, domain)| {
        ALLOWED_EMAIL_DOMAINS
            .iter()
            .any(|allowed| allowed.eq_ignore_ascii_case(domain))
    })
}

/// The one-time token from an e-mail link (e-mail verification, magic link).
///
/// It travels in the request body, not in the URL, so it stays out of access
/// logs, browser history and `Referer` (RFC 3986 §7.5).
#[derive(Debug, Deserialize, Serialize, ToSchema)]
pub struct TokenParams {
    pub token: String,
}

#[derive(Debug, Deserialize, Serialize, ToSchema)]
pub struct ForgotParams {
    pub email: String,
}

#[derive(Debug, Deserialize, Serialize, ToSchema)]
pub struct ResetParams {
    pub token: String,
    pub password: String,
}

#[derive(Debug, Deserialize, Serialize, ToSchema)]
pub struct MagicLinkParams {
    pub email: String,
}

#[derive(Debug, Deserialize, Serialize, ToSchema)]
pub struct ResendVerificationParams {
    pub email: String,
}

/// Register function creates a new user with the given parameters and sends a
/// welcome email to the user
#[utoipa::path(
    post,
    path = "/api/auth/register",
    tag = "auth",
    request_body = RegisterParams,
    responses(
        (status = 200, description = "Request accepted. Always 200, even when the email is already taken, so registered emails are not exposed"),
        (status = 400, description = "Request body is not valid JSON", body = ProblemDetails, content_type = "application/problem+json"),
        (status = 415, description = "Content-Type is not application/json", body = ProblemDetails, content_type = "application/problem+json"),
        (status = 422, description = "Request body does not match the schema", body = ProblemDetails, content_type = "application/problem+json"),
    ),
)]
#[debug_handler]
pub(crate) async fn register(
    State(ctx): State<AppContext>,
    Json(params): Json<RegisterParams>,
) -> Result<Response> {
    let res = users::Model::create_with_password(&ctx.db, &params).await;

    let user = match res {
        Ok(user) => user,
        Err(err) => {
            tracing::info!(
                message = err.to_string(),
                user_email = &params.email,
                "could not register user",
            );
            return format::json(());
        }
    };

    let user = user
        .into_active_model()
        .set_email_verification_sent(&ctx.db)
        .await?;

    AuthMailer::send_welcome(&ctx, &user).await?;

    format::json(())
}

/// Verify register user. if the user not verified his email, he can't login to
/// the system.
///
/// A `POST`, not a `GET`: it changes the user, and a safe method must not
/// (RFC 9110 §9.2.1). Mail scanners and link previewers fetch `GET` URLs on
/// their own, which would verify (or burn the token of) an address nobody
/// clicked. The mail links to the SPA page `/verify#<token>`, which posts the
/// token here.
#[utoipa::path(
    post,
    path = "/api/auth/verify",
    tag = "auth",
    request_body = TokenParams,
    responses(
        (status = 204, description = "Email verified (or already verified)"),
        (status = 400, description = "Request body is not valid JSON", body = ProblemDetails, content_type = "application/problem+json"),
        (status = 401, description = "Invalid token", body = ProblemDetails, content_type = "application/problem+json", headers(("WWW-Authenticate" = String, description = "Bearer challenge (RFC 6750 §3)"))),
        (status = 415, description = "Content-Type is not application/json", body = ProblemDetails, content_type = "application/problem+json"),
        (status = 422, description = "Request body does not match the schema", body = ProblemDetails, content_type = "application/problem+json"),
    ),
)]
#[debug_handler]
pub(crate) async fn verify(
    State(ctx): State<AppContext>,
    Json(params): Json<TokenParams>,
) -> Result<Response> {
    let Ok(user) = users::Model::find_by_verification_token(&ctx.db, &params.token).await else {
        return unauthorized("invalid token");
    };

    if user.email_verified_at.is_some() {
        tracing::info!(pid = user.pid.to_string(), "user already verified");
    } else {
        let active_model = user.into_active_model();
        let user = active_model.verified(&ctx.db).await?;
        tracing::info!(pid = user.pid.to_string(), "user verified");
    }

    Ok(StatusCode::NO_CONTENT.into_response())
}

/// In case the user forgot his password  this endpoints generate a forgot token
/// and send email to the user. In case the email not found in our DB, we are
/// returning a valid request for security reasons (not exposing users DB
/// list).
#[utoipa::path(
    post,
    path = "/api/auth/forgot",
    tag = "auth",
    request_body = ForgotParams,
    responses(
        (status = 200, description = "Request accepted. Always 200, even when the email is unknown"),
        (status = 400, description = "Request body is not valid JSON", body = ProblemDetails, content_type = "application/problem+json"),
        (status = 415, description = "Content-Type is not application/json", body = ProblemDetails, content_type = "application/problem+json"),
        (status = 422, description = "Request body does not match the schema", body = ProblemDetails, content_type = "application/problem+json"),
    ),
)]
#[debug_handler]
pub(crate) async fn forgot(
    State(ctx): State<AppContext>,
    Json(params): Json<ForgotParams>,
) -> Result<Response> {
    let Ok(user) = users::Model::find_by_email(&ctx.db, &params.email).await else {
        // we don't want to expose our users email. if the email is invalid we still
        // returning success to the caller
        return format::json(());
    };

    let user = user
        .into_active_model()
        .set_forgot_password_sent(&ctx.db)
        .await?;

    AuthMailer::forgot_password(&ctx, &user).await?;

    format::json(())
}

/// reset user password by the given parameters
#[utoipa::path(
    post,
    path = "/api/auth/reset",
    tag = "auth",
    request_body = ResetParams,
    responses(
        (status = 200, description = "Request accepted. Always 200, even when the token is unknown"),
        (status = 400, description = "Request body is not valid JSON", body = ProblemDetails, content_type = "application/problem+json"),
        (status = 415, description = "Content-Type is not application/json", body = ProblemDetails, content_type = "application/problem+json"),
        (status = 422, description = "Request body does not match the schema", body = ProblemDetails, content_type = "application/problem+json"),
    ),
)]
#[debug_handler]
pub(crate) async fn reset(
    State(ctx): State<AppContext>,
    Json(params): Json<ResetParams>,
) -> Result<Response> {
    let Ok(user) = users::Model::find_by_reset_token(&ctx.db, &params.token).await else {
        // we don't want to expose our users email. if the email is invalid we still
        // returning success to the caller
        tracing::info!("reset token not found");

        return format::json(());
    };
    user.into_active_model()
        .reset_password(&ctx.db, &params.password)
        .await?;

    format::json(())
}

/// Creates a user login and returns a token
#[utoipa::path(
    post,
    path = "/api/auth/login",
    tag = "auth",
    request_body = LoginParams,
    responses(
        (status = 200, description = "Login succeeded", body = LoginResponse),
        (status = 400, description = "Request body is not valid JSON", body = ProblemDetails, content_type = "application/problem+json"),
        (status = 415, description = "Content-Type is not application/json", body = ProblemDetails, content_type = "application/problem+json"),
        (status = 422, description = "Request body does not match the schema", body = ProblemDetails, content_type = "application/problem+json"),
        (status = 401, description = "Invalid credentials", body = ProblemDetails, content_type = "application/problem+json", headers(("WWW-Authenticate" = String, description = "Bearer challenge (RFC 6750 §3)"))),
    ),
)]
#[debug_handler]
pub(crate) async fn login(
    State(ctx): State<AppContext>,
    Json(params): Json<LoginParams>,
) -> Result<Response> {
    let Ok(user) = users::Model::find_by_email(&ctx.db, &params.email).await else {
        tracing::debug!(
            email = params.email,
            "login attempt with non-existent email"
        );
        return unauthorized("Invalid credentials!");
    };

    let valid = user.verify_password(&params.password);

    if !valid {
        return unauthorized("unauthorized!");
    }

    let jwt_secret = ctx.config.get_jwt_config()?;

    let token = user
        .generate_jwt(&jwt_secret.secret, jwt_secret.expiration)
        .or_else(|_| unauthorized("unauthorized!"))?;

    format::json(LoginResponse::new(&user, &token))
}

/// Returns the signed-in user
///
/// Reads the user identified by the JWT in the `Authorization` header.
#[utoipa::path(
    get,
    path = "/api/auth/current",
    tag = "auth",
    security(("jwt_token" = [])),
    responses(
        (status = 200, description = "The signed-in user", body = CurrentResponse),
        (status = 401, description = "Missing or invalid token", body = ProblemDetails, content_type = "application/problem+json", headers(("WWW-Authenticate" = String, description = "Bearer challenge (RFC 6750 §3)"))),
    ),
)]
#[debug_handler]
pub(crate) async fn current(auth: auth::JWT, State(ctx): State<AppContext>) -> Result<Response> {
    let user = users::Model::find_by_pid(&ctx.db, &auth.claims.pid).await?;
    format::json(CurrentResponse::new(&user))
}

/// Magic link authentication provides a secure and passwordless way to log in to the application.
///
/// # Flow
/// 1. **Request a Magic Link**:
///    A registered user sends a POST request to `/magic-link` with their email.
///    If the email exists, a short-lived, one-time-use token is generated and sent to the user's email.
///    For security and to avoid exposing whether an email exists, the response always returns 200, even if the email is invalid.
///
/// 2. **Click the Magic Link**:
///    The user clicks the link (`/magic-link#<token>`, a page of the SPA), which posts the token to
///    `/magic-link/verify`; that validates the token and its expiration.
///    If valid, the server generates a JWT and responds with a [`LoginResponse`].
///    If invalid or expired, an unauthorized response is returned.
///
/// This flow enhances security by avoiding traditional passwords and providing a seamless login experience.
#[utoipa::path(
    post,
    path = "/api/auth/magic-link",
    tag = "auth",
    request_body = MagicLinkParams,
    responses(
        (status = 200, description = "Request accepted. Always 200, even when the email is unknown"),
        (status = 400, description = "Email is not on an allowed domain, or the body is not valid JSON", body = ProblemDetails, content_type = "application/problem+json"),
        (status = 415, description = "Content-Type is not application/json", body = ProblemDetails, content_type = "application/problem+json"),
        (status = 422, description = "Request body does not match the schema", body = ProblemDetails, content_type = "application/problem+json"),
    ),
)]
pub(crate) async fn magic_link(
    State(ctx): State<AppContext>,
    Json(params): Json<MagicLinkParams>,
) -> Result<Response> {
    if !is_allowed_email_domain(&params.email) {
        tracing::debug!(
            email = params.email,
            "The provided email is invalid or does not match the allowed domains"
        );
        return bad_request("invalid request");
    }

    let Ok(user) = users::Model::find_by_email(&ctx.db, &params.email).await else {
        // we don't want to expose our users email. if the email is invalid we still
        // returning success to the caller
        tracing::debug!(email = params.email, "user not found by email");
        return format::empty_json();
    };

    let user = user.into_active_model().create_magic_link(&ctx.db).await?;
    AuthMailer::send_magic_link(&ctx, &user).await?;

    format::empty_json()
}

/// Verifies a magic link token and authenticates the user.
///
/// A `POST` for the same reason as [`verify`]: it consumes the one-time token
/// and issues a JWT. The mail links to the SPA page `/magic-link#<token>`.
#[utoipa::path(
    post,
    path = "/api/auth/magic-link/verify",
    tag = "auth",
    request_body = TokenParams,
    responses(
        (status = 200, description = "Login succeeded", body = LoginResponse),
        (status = 400, description = "Request body is not valid JSON", body = ProblemDetails, content_type = "application/problem+json"),
        (status = 401, description = "Invalid or expired token", body = ProblemDetails, content_type = "application/problem+json", headers(("WWW-Authenticate" = String, description = "Bearer challenge (RFC 6750 §3)"))),
        (status = 415, description = "Content-Type is not application/json", body = ProblemDetails, content_type = "application/problem+json"),
        (status = 422, description = "Request body does not match the schema", body = ProblemDetails, content_type = "application/problem+json"),
    ),
)]
pub(crate) async fn magic_link_verify(
    State(ctx): State<AppContext>,
    Json(params): Json<TokenParams>,
) -> Result<Response> {
    let Ok(user) = users::Model::find_by_magic_token(&ctx.db, &params.token).await else {
        // we don't want to expose our users email. if the email is invalid we still
        // returning success to the caller
        return unauthorized("unauthorized!");
    };

    let user = user.into_active_model().clear_magic_link(&ctx.db).await?;

    let jwt_secret = ctx.config.get_jwt_config()?;

    let token = user
        .generate_jwt(&jwt_secret.secret, jwt_secret.expiration)
        .or_else(|_| unauthorized("unauthorized!"))?;

    format::json(LoginResponse::new(&user, &token))
}

/// Re-sends the verification email
///
/// Always answers 200 so registered emails are not exposed.
#[utoipa::path(
    post,
    path = "/api/auth/resend-verification-mail",
    tag = "auth",
    request_body = ResendVerificationParams,
    responses(
        (status = 200, description = "Request accepted"),
        (status = 400, description = "Request body is not valid JSON", body = ProblemDetails, content_type = "application/problem+json"),
        (status = 415, description = "Content-Type is not application/json", body = ProblemDetails, content_type = "application/problem+json"),
        (status = 422, description = "Request body does not match the schema", body = ProblemDetails, content_type = "application/problem+json"),
    ),
)]
#[debug_handler]
pub(crate) async fn resend_verification_email(
    State(ctx): State<AppContext>,
    Json(params): Json<ResendVerificationParams>,
) -> Result<Response> {
    let Ok(user) = users::Model::find_by_email(&ctx.db, &params.email).await else {
        tracing::info!(
            email = params.email,
            "User not found for resend verification"
        );
        return format::json(());
    };

    if user.email_verified_at.is_some() {
        tracing::info!(
            pid = user.pid.to_string(),
            "User already verified, skipping resend"
        );
        return format::json(());
    }

    let user = user
        .into_active_model()
        .set_email_verification_sent(&ctx.db)
        .await?;

    AuthMailer::send_welcome(&ctx, &user).await?;
    tracing::info!(pid = user.pid.to_string(), "Verification email re-sent");

    format::json(())
}

pub fn routes() -> Routes {
    Routes::new()
        .prefix("/api/auth")
        .add("/register", post(register))
        .add("/verify", post(verify))
        .add("/login", post(login))
        .add("/forgot", post(forgot))
        .add("/reset", post(reset))
        .add("/current", get(current))
        .add("/magic-link", post(magic_link))
        .add("/magic-link/verify", post(magic_link_verify))
        .add("/resend-verification-mail", post(resend_verification_email))
}
