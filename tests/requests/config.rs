use loco_rs::testing::prelude::*;
use serial_test::serial;
use wardrowbe::app::App;

#[tokio::test]
#[serial]
async fn the_frontend_config_is_public_json() {
    request::<App, _, _>(|request, _ctx| async move {
        let response = request.get("/config.json").await;
        assert_eq!(response.status_code(), 200);
        assert_eq!(response.header("content-type"), "application/json");
        let body: serde_json::Value = response.json();
        assert!(body["clerkPublishableKey"].is_string(), "{body}");
    })
    .await;
}
