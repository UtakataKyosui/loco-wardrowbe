use std::path::Path;

use loco_rs::prelude::*;
use utoipa::OpenApi;

use crate::initializers::openapi::ApiDoc;

/// Where the committed spec snapshot lives. It is the input of Orval.
pub const SPEC_PATH: &str = "openapi/openapi.yaml";

pub struct OpenapiExport;

#[async_trait]
impl Task for OpenapiExport {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "openapi:export".to_string(),
            detail: "Write the OpenAPI spec to openapi/openapi.yaml (or to the path given as `out`), without starting the server.\nUsage:\ncargo loco task openapi:export\ncargo loco task openapi:export out:path/to/openapi.yaml".to_string(),
        }
    }

    async fn run(&self, _app_context: &AppContext, vars: &task::Vars) -> Result<()> {
        let out = vars.cli_arg("out").unwrap_or(SPEC_PATH);
        let yaml = ApiDoc::openapi()
            .to_yaml()
            .map_err(|err| Error::string(&err.to_string()))?;

        if let Some(parent) = Path::new(out).parent() {
            std::fs::create_dir_all(parent)?;
        }
        std::fs::write(out, yaml)?;
        println!("wrote {out}");
        Ok(())
    }
}
