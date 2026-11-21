use loco_rs::testing::prelude::*;
use serial_test::serial;
use utoipa::OpenApi;
use wardrowbe::{app::App, initializers::openapi::ApiDoc, tasks::openapi_export::SPEC_PATH};

#[tokio::test]
#[serial]
async fn serves_the_spec_and_the_ui() {
    request::<App, _, _>(|request, _ctx| async move {
        let json = request.get("/api-docs/openapi.json").await;
        assert_eq!(json.status_code(), 200);
        let spec: serde_json::Value = json.json();
        assert!(spec["paths"]["/api/auth/current"]["get"].is_object());
        assert_eq!(
            spec["components"]["securitySchemes"]["jwt_token"]["scheme"],
            "bearer"
        );

        assert_eq!(
            request.get("/api-docs/openapi.yaml").await.status_code(),
            200
        );
        assert_eq!(request.get("/scalar").await.status_code(), 200);
    })
    .await;
}

/// `openapi/openapi.yaml` is the input of the frontend code generation. When
/// this fails, regenerate it with `cargo loco task openapi:export` and commit.
#[test]
fn committed_spec_is_up_to_date() {
    let committed = std::fs::read_to_string(SPEC_PATH).expect("openapi/openapi.yaml is missing");
    let generated = ApiDoc::openapi().to_yaml().expect("spec serializes");
    assert_eq!(
        committed, generated,
        "openapi/openapi.yaml is stale; run `cargo loco task openapi:export`"
    );
}
