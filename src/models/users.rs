use loco_rs::prelude::*;
use uuid::Uuid;

use crate::clerk::Claims;

pub use super::_entities::users::{self, ActiveModel, Entity, Model};

#[async_trait::async_trait]
impl ActiveModelBehavior for super::_entities::users::ActiveModel {
    async fn before_save<C>(self, _db: &C, insert: bool) -> Result<Self, DbErr>
    where
        C: ConnectionTrait,
    {
        if insert {
            let mut this = self;
            this.pid = ActiveValue::Set(Uuid::new_v4());
            Ok(this)
        } else {
            Ok(self)
        }
    }
}

impl Model {
    /// finds a user by the public identifier
    ///
    /// # Errors
    ///
    /// When could not find user by the given pid or DB query error
    pub async fn find_by_pid(db: &DatabaseConnection, pid: &str) -> ModelResult<Self> {
        let parse_uuid = Uuid::parse_str(pid).map_err(|e| ModelError::Any(e.into()))?;
        let user = users::Entity::find()
            .filter(
                model::query::condition()
                    .eq(users::Column::Pid, parse_uuid)
                    .build(),
            )
            .one(db)
            .await?;
        user.ok_or_else(|| ModelError::EntityNotFound)
    }

    /// finds a user by the id Clerk gave them (the `sub` of their tokens)
    ///
    /// # Errors
    ///
    /// DB query error
    pub async fn find_by_clerk_id(
        db: &DatabaseConnection,
        clerk_id: &str,
    ) -> ModelResult<Option<Self>> {
        Ok(users::Entity::find()
            .filter(users::Column::ClerkId.eq(clerk_id))
            .one(db)
            .await?)
    }

    /// The user behind a verified Clerk token. The first request of a new
    /// Clerk user creates the row; later requests copy over an e-mail address
    /// or name that changed in Clerk.
    ///
    /// # Errors
    ///
    /// DB query error
    pub async fn find_or_create_by_clerk(
        db: &DatabaseConnection,
        claims: &Claims,
    ) -> ModelResult<Self> {
        if let Some(user) = Self::find_by_clerk_id(db, &claims.sub).await? {
            return user.sync_profile(db, claims).await;
        }

        let created = users::ActiveModel {
            clerk_id: ActiveValue::set(Some(claims.sub.clone())),
            email: ActiveValue::set(claims.email.clone()),
            name: ActiveValue::set(claims.name.clone()),
            ..Default::default()
        }
        .insert(db)
        .await;

        match created {
            Ok(user) => Ok(user),
            // Two first requests raced; the other one inserted the row.
            Err(err) => Self::find_by_clerk_id(db, &claims.sub)
                .await?
                .ok_or_else(|| ModelError::from(err)),
        }
    }

    /// Copies the e-mail address and name from the claims when they are
    /// present and differ. A token without them (the default session token)
    /// leaves what is stored untouched.
    async fn sync_profile(self, db: &DatabaseConnection, claims: &Claims) -> ModelResult<Self> {
        let email_changed = claims.email.is_some() && claims.email != self.email;
        let name_changed = claims.name.is_some() && claims.name != self.name;
        if !email_changed && !name_changed {
            return Ok(self);
        }

        let mut active = self.into_active_model();
        if email_changed {
            active.email = ActiveValue::set(claims.email.clone());
        }
        if name_changed {
            active.name = ActiveValue::set(claims.name.clone());
        }
        Ok(active.update(db).await?)
    }

    /// The name to show: the stored name, else the e-mail address, else a
    /// placeholder.
    #[must_use]
    pub fn display_name(&self) -> &str {
        self.name
            .as_deref()
            .or(self.email.as_deref())
            .unwrap_or("(unnamed)")
    }
}
