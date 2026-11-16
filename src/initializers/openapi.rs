use loco_openapi::prelude::*;

pub async fn initializers(ctx: &AppContext) -> Result<Vec<Box<dyn Initializer>>> {
    Ok(vec![Box::new(
        loco_openapi::OpenapiInitializerWithSetup::new(
            |ctx| {
                #[derive(OpenApi)]
                #[openapi(
                    modifiers(&SecurityAddon),
                    info(
                        title = "Loco Demo",
                        description = "This app is a kitchensink for various capabilities and examples of the [Loco](https://loco.rs) project."
                    )
                )]
                struct ApiDoc;
                set_jwt_location(ctx.into());

                ApiDoc::openapi()
            },
            // When using automatic schema collection only
            None,
            // When using manual schema collection
            // Manual schema collection can also be used at the same time as automatic schema collection
            // Some(vec![controllers::album::api_routes()]),
        ),
    )])
}