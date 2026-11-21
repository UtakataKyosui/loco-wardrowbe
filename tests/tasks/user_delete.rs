use loco_rs::{task, testing::prelude::*};
use wardrowbe::{app::App, clerk::Claims, models::users};

use loco_rs::boot::run_task;
use serial_test::serial;

#[tokio::test]
#[serial]
async fn can_run_user_delete_by_pid() {
    let boot = boot_test::<App>().await.unwrap();

    let user = users::Model::find_or_create_by_clerk(
        &boot.app_context.db,
        &Claims {
            sub: "user_to_delete".to_string(),
            iss: "https://clerk.test.invalid".to_string(),
            azp: None,
            email: Some("test@example.com".to_string()),
            name: Some("Test User".to_string()),
        },
    )
    .await
    .unwrap();

    let pid = user.pid;

    let vars = task::Vars::from_cli_args(vec![
        ("pid".to_string(), pid.to_string()),
        ("force".to_string(), "true".to_string()),
    ]);

    run_task::<App>(&boot.app_context, Some(&"user:delete".to_string()), &vars)
        .await
        .unwrap();

    let user = users::Model::find_by_pid(&boot.app_context.db, &pid.to_string()).await;
    assert!(user.is_err());
}
