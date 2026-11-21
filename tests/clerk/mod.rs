//! [`ClerkVerifier`]: what it accepts and what it refuses (RFC 8725).

use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Arc,
};

use axum::{routing::get, Json, Router};
use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};
use serde_json::json;
use wardrowbe::clerk::{ClerkSettings, ClerkVerifier, VerifyError};

use crate::support::{claims, keys, now, other_keys, with, ISSUER, KID};

fn verifier(parties: &[&str]) -> ClerkVerifier {
    ClerkVerifier::with_static_keys(ISSUER, parties, keys().jwks())
}

fn assert_rejected(result: &Result<wardrowbe::clerk::Claims, VerifyError>) {
    assert!(
        matches!(result, Err(VerifyError::Rejected(_))),
        "expected a rejection, got {result:?}"
    );
}

#[tokio::test]
async fn accepts_a_valid_token() {
    let token = keys().token(&with(claims("user_1"), "email", json!("a@example.com")));
    let got = verifier(&[]).verify(&token).await.expect("valid token");
    assert_eq!(got.sub, "user_1");
    assert_eq!(got.email.as_deref(), Some("a@example.com"));
}

#[tokio::test]
async fn refuses_an_expired_token() {
    let token = keys().token(&with(claims("u"), "exp", json!(now() - 3600)));
    assert_rejected(&verifier(&[]).verify(&token).await);
}

#[tokio::test]
async fn refuses_a_token_that_is_not_valid_yet() {
    let token = keys().token(&with(claims("u"), "nbf", json!(now() + 3600)));
    assert_rejected(&verifier(&[]).verify(&token).await);
}

#[tokio::test]
async fn refuses_another_issuer() {
    let token = keys().token(&with(claims("u"), "iss", json!("https://evil.example")));
    assert_rejected(&verifier(&[]).verify(&token).await);
}

#[tokio::test]
async fn refuses_a_token_without_exp() {
    let mut body = claims("u");
    body.as_object_mut().unwrap().remove("exp");
    assert_rejected(&verifier(&[]).verify(&keys().token(&body)).await);
}

#[tokio::test]
async fn refuses_a_token_signed_with_another_key() {
    // Same `kid`, different private key.
    let token = other_keys().token(&claims("u"));
    assert_rejected(&verifier(&[]).verify(&token).await);
}

#[tokio::test]
async fn refuses_an_unknown_key_id() {
    let token = keys().sign("some-other-kid", &claims("u"));
    assert_rejected(&verifier(&[]).verify(&token).await);
}

// RFC 8725 §3.1: the algorithm is the server's choice, not the token's. An
// HS256 token signed with the (public) key id as a secret must not pass.
#[tokio::test]
async fn refuses_a_token_that_names_another_algorithm() {
    let mut header = Header::new(Algorithm::HS256);
    header.kid = Some(KID.to_owned());
    let token = encode(
        &header,
        &claims("u"),
        &EncodingKey::from_secret(b"anything"),
    )
    .unwrap();
    assert_rejected(&verifier(&[]).verify(&token).await);
}

#[tokio::test]
async fn refuses_garbage() {
    for token in ["", "not-a-jwt", "a.b.c"] {
        assert_rejected(&verifier(&[]).verify(token).await);
    }
}

#[tokio::test]
async fn checks_the_authorized_party_when_configured() {
    let good = keys().token(&claims("u"));
    verifier(&["https://app.example.com", "https://other.example"])
        .verify(&good)
        .await
        .expect("azp is on the list");

    assert_rejected(&verifier(&["https://other.example"]).verify(&good).await);

    let mut no_azp = claims("u");
    no_azp.as_object_mut().unwrap().remove("azp");
    assert_rejected(
        &verifier(&["https://app.example.com"])
            .verify(&keys().token(&no_azp))
            .await,
    );
}

/// Serves `jwks` at `/jwks.json` on a free local port and counts the requests.
async fn serve_jwks(jwks: serde_json::Value) -> (String, Arc<AtomicUsize>) {
    let hits = Arc::new(AtomicUsize::new(0));
    let counter = Arc::clone(&hits);
    let app = Router::new().route(
        "/jwks.json",
        get(move || {
            counter.fetch_add(1, Ordering::SeqCst);
            let body = jwks.clone();
            async move { Json(body) }
        }),
    );
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}/jwks.json", listener.local_addr().unwrap());
    tokio::spawn(async move { axum::serve(listener, app).await });
    (url, hits)
}

fn remote(url: &str) -> ClerkVerifier {
    ClerkVerifier::new(&ClerkSettings {
        publishable_key: String::new(),
        issuer: ISSUER.to_owned(),
        jwks_url: url.to_owned(),
        authorized_parties: String::new(),
    })
    .unwrap()
}

#[tokio::test]
async fn fetches_the_keys_once_and_caches_them() {
    let (url, hits) = serve_jwks(keys().jwks_json()).await;
    let verifier = remote(&url);
    let token = keys().token(&claims("u"));

    verifier.verify(&token).await.expect("first");
    verifier.verify(&token).await.expect("second");
    assert_eq!(hits.load(Ordering::SeqCst), 1);
}

#[tokio::test]
async fn an_unknown_key_id_does_not_refetch_in_a_loop() {
    let (url, hits) = serve_jwks(keys().jwks_json()).await;
    let verifier = remote(&url);
    let forged = keys().sign("rotated-key", &claims("u"));

    for _ in 0..5 {
        assert_rejected(&verifier.verify(&forged).await);
    }
    assert_eq!(
        hits.load(Ordering::SeqCst),
        1,
        "one fetch, not one per request"
    );
}

#[tokio::test]
async fn an_unreachable_jwks_is_unavailable_not_unauthorized() {
    // Nothing listens on port 1.
    let verifier = remote("http://127.0.0.1:1/jwks.json");
    let result = verifier.verify(&keys().token(&claims("u"))).await;
    assert!(
        matches!(result, Err(VerifyError::Unavailable(_))),
        "got {result:?}"
    );
}
