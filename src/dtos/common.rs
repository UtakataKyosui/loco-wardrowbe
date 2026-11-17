use loco_rs::model::query::PageResponse;
use ts_rs::TS;

/// A page of results: the items, plus the framework's pagination metadata
/// flattened alongside them.
///
/// The field names are exactly `PagerMeta`'s (`page`, `page_size`,
/// `total_pages`, `total_items`), so an app has one pagination vocabulary
/// whether a handler answers with this typed envelope or with the framework's
/// own `Pager`. Build it with [`Page::from_query`] rather than by hand — that
/// is what keeps the two in step.
#[derive(serde::Serialize, serde::Deserialize, TS)]
#[ts(export, export_to = "../frontend/src/bindings/")]
pub struct Page<T: TS> {
    pub items: Vec<T>,
    #[ts(type = "number")]
    pub page: u64,
    #[ts(type = "number")]
    pub page_size: u64,
    #[ts(type = "number")]
    pub total_pages: u64,
    #[ts(type = "number")]
    pub total_items: u64,
}

impl<T: TS> Page<T> {
    /// Build a page from a paginated query (`query::paginate`,
    /// `query::fetch_page`), mapping each model onto its DTO.
    pub fn from_query<M>(res: PageResponse<M>) -> Self
    where
        T: From<M>,
    {
        Self {
            items: res.page.into_iter().map(T::from).collect(),
            page: res.meta.page,
            page_size: res.meta.page_size,
            total_pages: res.meta.total_pages,
            total_items: res.meta.total_items,
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, TS)]
#[ts(export, export_to = "../frontend/src/bindings/")]
pub struct ApiError {
    pub code: String,
    pub message: String,
    #[ts(type = "unknown")]
    pub details: Option<serde_json::Value>,
}

/// An RFC 9457 "problem details" object, the body of every error response of
/// the `/api/` routes (`Content-Type: application/problem+json`).
///
/// It is produced for every error by `initializers::problem_details`, so the
/// `OpenAPI` description matches what the server really sends. Use it as the
/// `body` (with `content_type = "application/problem+json"`) of every error
/// response in `#[utoipa::path]`.
#[derive(Debug, serde::Serialize, serde::Deserialize, utoipa::ToSchema)]
pub struct ProblemDetails {
    /// A URI reference that identifies the problem type. `about:blank` means
    /// the problem has no semantics beyond the HTTP status code.
    #[serde(rename = "type")]
    #[schema(rename = "type", example = "about:blank")]
    pub type_: String,
    /// Short, human-readable summary of the problem type (the HTTP status
    /// phrase while `type` is `about:blank`).
    pub title: String,
    /// The HTTP status code of the response, repeated for convenience.
    pub status: u16,
    /// Explanation specific to this occurrence of the problem.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
    /// A URI reference that identifies this occurrence (`urn:uuid:` of the
    /// `x-request-id` response header), to find it in the server logs.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub instance: Option<String>,
    /// Extension member, present on validation failures: one entry per
    /// invalid field.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub errors: Option<Vec<FieldError>>,
}

/// One invalid field of a validation failure (extension member of
/// [`ProblemDetails`]).
#[derive(Debug, serde::Serialize, serde::Deserialize, utoipa::ToSchema)]
pub struct FieldError {
    /// JSON Pointer (RFC 6901) to the invalid field of the request body.
    #[schema(example = "/email")]
    pub pointer: String,
    /// What is wrong with the field.
    pub detail: String,
}
