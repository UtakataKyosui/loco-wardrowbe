use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::models::_entities::users;

#[derive(Debug, Deserialize, Serialize, ToSchema)]
pub struct LoginResponse {
    pub token: String,
    /// Public identifier of the user (RFC 9562 UUID).
    pub pid: Uuid,
    pub name: String,
    pub is_verified: bool,
}

impl LoginResponse {
    #[must_use]
    pub fn new(user: &users::Model, token: &str) -> Self {
        Self {
            token: token.to_owned(),
            pid: user.pid,
            name: user.name.clone(),
            is_verified: user.email_verified_at.is_some(),
        }
    }
}

#[derive(Debug, Deserialize, Serialize, ToSchema)]
pub struct CurrentResponse {
    /// Public identifier of the user (RFC 9562 UUID).
    pub pid: Uuid,
    pub name: String,
    pub email: String,
}

impl CurrentResponse {
    #[must_use]
    pub fn new(user: &users::Model) -> Self {
        Self {
            pid: user.pid,
            name: user.name.clone(),
            email: user.email.clone(),
        }
    }
}
