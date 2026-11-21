//! Moves sign-in to Clerk: a user is now identified by `clerk_id`, and the
//! password, API key, e-mail verification, password reset and magic-link
//! columns go away. `email` and `name` become optional (Clerk's default
//! session token carries neither) and `email` is no longer unique, because
//! Clerk owns identity now.
//!
//! Rows made before this migration have no `clerk_id` and cannot sign in
//! again; they are kept so nothing is deleted behind the owner's back.

use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, m: &SchemaManager) -> Result<(), DbErr> {
        m.get_connection()
            .execute_unprepared(
                "ALTER TABLE users
                    DROP COLUMN IF EXISTS password,
                    DROP COLUMN IF EXISTS api_key,
                    DROP COLUMN IF EXISTS reset_token,
                    DROP COLUMN IF EXISTS reset_sent_at,
                    DROP COLUMN IF EXISTS email_verification_token,
                    DROP COLUMN IF EXISTS email_verification_sent_at,
                    DROP COLUMN IF EXISTS email_verified_at,
                    DROP COLUMN IF EXISTS magic_link_token,
                    DROP COLUMN IF EXISTS magic_link_expiration,
                    DROP CONSTRAINT IF EXISTS users_email_key,
                    ALTER COLUMN email DROP NOT NULL,
                    ALTER COLUMN name DROP NOT NULL,
                    ADD COLUMN clerk_id varchar NULL UNIQUE",
            )
            .await?;
        Ok(())
    }

    async fn down(&self, _m: &SchemaManager) -> Result<(), DbErr> {
        // Passwords and tokens are gone for good; there is nothing to restore.
        Err(DbErr::Migration(
            "m20261121_000001_clerk_auth cannot be reverted: the dropped password and token \
             columns cannot be recreated with their data"
                .to_owned(),
        ))
    }
}
