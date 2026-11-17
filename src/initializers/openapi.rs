//! `OpenAPI` document, built with [utoipa](https://docs.rs/utoipa) and served
//! through Scalar.
//!
//! `loco-openapi` does not support Loco 1.3, so this wires utoipa straight into
//! an [`Initializer`]. Every documented handler is listed in [`ApiDoc`]'s
//! `paths(...)`; every request / response type that is not reachable from a
//! `body = ...` of those handlers can be added to `components(schemas(...))`.
//!
//! Served at (outside production):
//!
//! | URL                         | what                     |
//! |-----------------------------|--------------------------|
//! | `/scalar`                   | Scalar API reference UI  |
//! | `/api-docs/openapi.json`    | spec as JSON             |
//! | `/api-docs/openapi.yaml`    | spec as YAML (Orval in.) |
//!
//! The committed snapshot `openapi/openapi.yaml` is produced by
//! `cargo loco task openapi:export`.

use async_trait::async_trait;
use axum::{http::header, routing::get, Router as AxumRouter};
use loco_rs::{
    app::{AppContext, Initializer},
    environment::Environment,
    Result,
};
use utoipa::{
    openapi::security::{HttpAuthScheme, HttpBuilder, SecurityScheme},
    Modify, OpenApi,
};
use utoipa_scalar::{Scalar, Servable};

use crate::{controllers, dtos, models::users, views};

/// Name of the JWT security scheme. `#[utoipa::path]` only accepts a string
/// literal, so handlers spell it out:
/// `security(("jwt_token" = []))`; keep the two in sync.
pub const JWT_SECURITY_SCHEME: &str = "jwt_token";

/// Registers the `jwt_token` bearer scheme (`Authorization: Bearer <jwt>`),
/// which is Loco's default JWT location.
struct SecurityAddon;

impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_scheme(
                JWT_SECURITY_SCHEME,
                SecurityScheme::Http(
                    HttpBuilder::new()
                        .scheme(HttpAuthScheme::Bearer)
                        .bearer_format("JWT")
                        .build(),
                ),
            );
        }
    }
}

#[derive(OpenApi)]
#[openapi(
    info(
        title = "wardrowbe API",
        description = "HTTP API of wardrowbe, built on [Loco](https://loco.rs)."
    ),
    modifiers(&SecurityAddon),
    paths(
        controllers::auth::register,
        controllers::auth::verify,
        controllers::auth::login,
        controllers::auth::forgot,
        controllers::auth::reset,
        controllers::auth::current,
        controllers::auth::magic_link,
        controllers::auth::magic_link_verify,
        controllers::auth::resend_verification_email,
    ),
    components(schemas(
        dtos::common::ProblemDetails,
        dtos::common::FieldError,
        controllers::auth::TokenParams,
        users::LoginParams,
        users::RegisterParams,
        views::auth::LoginResponse,
        views::auth::CurrentResponse,
    )),
    tags((name = "auth", description = "Registration, login and account recovery"))
)]
pub struct ApiDoc;

/// Serves the `OpenAPI` document and the Scalar UI.
pub struct OpenapiInitializer;

#[async_trait]
impl Initializer for OpenapiInitializer {
    fn name(&self) -> String {
        "openapi".to_string()
    }

    async fn after_routes(&self, router: AxumRouter, ctx: &AppContext) -> Result<AxumRouter> {
        // The interactive reference is a development aid; do not publish the
        // API surface from production.
        if ctx.environment == Environment::Production {
            return Ok(router);
        }

        let json = ApiDoc::openapi()
            .to_json()
            .map_err(|err| loco_rs::Error::string(&err.to_string()))?;
        let yaml = ApiDoc::openapi()
            .to_yaml()
            .map_err(|err| loco_rs::Error::string(&err.to_string()))?;

        Ok(router
            .route(
                "/api-docs/openapi.json",
                get(move || async move { ([(header::CONTENT_TYPE, "application/json")], json) }),
            )
            .route(
                "/api-docs/openapi.yaml",
                get(move || async move { ([(header::CONTENT_TYPE, "application/yaml")], yaml) }),
            )
            .merge(Scalar::with_url("/scalar", ApiDoc::openapi())))
    }
}
