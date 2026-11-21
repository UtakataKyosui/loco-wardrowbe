use loco_rs::testing::prelude::*;
use serial_test::serial;
use wardrowbe::{app::App, clerk::Claims, models::users::Model};

fn claims(sub: &str, email: Option<&str>, name: Option<&str>) -> Claims {
    Claims {
        sub: sub.to_owned(),
        iss: "https://clerk.test.invalid".to_owned(),
        azp: None,
        email: email.map(str::to_owned),
        name: name.map(str::to_owned),
    }
}

#[tokio::test]
#[serial]
async fn find_or_create_creates_once() {
    let boot = boot_test::<App>().await.expect("boot");
    let db = &boot.app_context.db;
    let c = claims("user_1", Some("a@example.com"), Some("Ada"));

    let first = Model::find_or_create_by_clerk(db, &c).await.unwrap();
    let second = Model::find_or_create_by_clerk(db, &c).await.unwrap();

    assert_eq!(first.id, second.id);
    assert_eq!(first.pid, second.pid);
    assert_eq!(first.clerk_id.as_deref(), Some("user_1"));
    assert_eq!(first.email.as_deref(), Some("a@example.com"));
    assert_eq!(first.name.as_deref(), Some("Ada"));
}

#[tokio::test]
#[serial]
async fn claims_without_a_profile_keep_the_stored_one() {
    let boot = boot_test::<App>().await.expect("boot");
    let db = &boot.app_context.db;

    Model::find_or_create_by_clerk(db, &claims("user_2", Some("a@example.com"), Some("Ada")))
        .await
        .unwrap();
    let again = Model::find_or_create_by_clerk(db, &claims("user_2", None, None))
        .await
        .unwrap();

    assert_eq!(again.email.as_deref(), Some("a@example.com"));
    assert_eq!(again.name.as_deref(), Some("Ada"));
}

#[tokio::test]
#[serial]
async fn the_pid_is_assigned_on_insert() {
    let boot = boot_test::<App>().await.expect("boot");
    let user = Model::find_or_create_by_clerk(&boot.app_context.db, &claims("user_3", None, None))
        .await
        .unwrap();
    assert!(!user.pid.is_nil());
    let found = Model::find_by_pid(&boot.app_context.db, &user.pid.to_string())
        .await
        .unwrap();
    assert_eq!(found.id, user.id);
}

#[tokio::test]
#[serial]
async fn display_name_falls_back() {
    let boot = boot_test::<App>().await.expect("boot");
    let db = &boot.app_context.db;
    let named =
        Model::find_or_create_by_clerk(db, &claims("u_a", Some("x@example.com"), Some("X")))
            .await
            .unwrap();
    let mailonly = Model::find_or_create_by_clerk(db, &claims("u_b", Some("y@example.com"), None))
        .await
        .unwrap();
    let bare = Model::find_or_create_by_clerk(db, &claims("u_c", None, None))
        .await
        .unwrap();
    assert_eq!(named.display_name(), "X");
    assert_eq!(mailonly.display_name(), "y@example.com");
    assert_eq!(bare.display_name(), "(unnamed)");
}
