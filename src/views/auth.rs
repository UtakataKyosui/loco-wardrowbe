use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::models::_entities::users;

#[derive(Debug, Deserialize, Serialize, ToSchema)]
pub struct CurrentResponse {
    /// Public identifier of the user (RFC 9562 UUID).
    pub pid: Uuid,
    /// Display name; falls back to the e-mail address when Clerk sent no name.
    pub name: String,
    /// `null` until Clerk's session token carries an `email` claim.
    pub email: Option<String>,
}

impl CurrentResponse {
    #[must_use]
    pub fn new(user: &users::Model) -> Self {
        Self {
            pid: user.pid,
            name: users::Model::display_name(user).to_owned(),
            email: user.email.clone(),
        }
    }
}
