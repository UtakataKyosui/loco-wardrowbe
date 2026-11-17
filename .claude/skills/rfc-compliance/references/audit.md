# 準拠度の監査（実測する）

ハンドラーのコードを読むだけでは、応答に何が載るかは分からない。Loco と axum が既定でヘッダーを足し、あるいは足さないので、**実際の応答のステータス・ヘッダー・本文を出力して確かめる**。

## 1. 準備

テストは PostgreSQL に接続する（`config/test.yaml` の `database.uri`、既定は `postgres://loco:loco@localhost:5432/wardrowbe_test`）。

```sh
docker compose up -d db          # compose.yaml の db。Docker が使えない環境では、ローカルの PostgreSQL を起動して同じ資格情報の DB を作る
pg_isready                       # accepting connections を確認
```

## 2. 探査テスト（一時ファイル）

`tests/requests/zz_rfc_probe.rs` を作り、`tests/requests/mod.rs` に `mod zz_rfc_probe;` を足して実行する。**監査が終わったら両方とも消す**（コミットしない）。

```rust
use loco_rs::testing::prelude::*;
use serial_test::serial;
use wardrowbe::app::App;

macro_rules! dump {
    ($label:expr, $r:expr) => {{
        let r = $r;
        println!("=== {}: {}", $label, r.status_code());
        for (k, v) in r.headers() {
            println!("  {k}: {}", v.to_str().unwrap_or("?"));
        }
        println!("  body: {}", r.text().chars().take(200).collect::<String>());
    }};
}

#[tokio::test]
#[serial]
async fn probe() {
    request::<App, _, _>(|request, _ctx| async move {
        dump!("login unknown", request.post("/api/auth/login").json(&serde_json::json!({"email":"a@b.c","password":"x"})).await);
        dump!("current no token", request.get("/api/auth/current").await);
        dump!("current bad token", request.get("/api/auth/current").add_header("authorization", "Bearer abc").await);
        dump!("login bad json", request.post("/api/auth/login").text("{").content_type("application/json").await);
        dump!("login wrong ctype", request.post("/api/auth/login").text("{}").content_type("text/plain").await);
        dump!("login schema", request.post("/api/auth/login").json(&serde_json::json!({"x":1})).await);
        dump!("GET on a POST route", request.get("/api/auth/login").await);
        dump!("unknown api", request.get("/api/nope").await);
        dump!("HEAD current", request.method(axum::http::Method::HEAD, "/api/auth/current").await);
        dump!("OPTIONS login", request.method(axum::http::Method::OPTIONS, "/api/auth/login").await);
    })
    .await;
}
```

```sh
cargo test --test mod zz_rfc_probe -- --nocapture
```

新しいエンドポイントを足したら、そのエンドポイントの成功・失敗の応答も `dump!` に足す。トークンを返す経路（ログイン成功、マジックリンクの引き換え）は、ユーザーを作ってから呼ぶ（`tests/requests/prepare_data.rs` の補助関数を使う）。

> `axum_test` を直接 `use` するには依存の追加が必要になるので、ヘルパー関数ではなくマクロで書いている（`r` の型を名指ししない）。

## 3. 見るところ

| 確かめること | 準拠の条件 |
|---|---|
| 401 に `www-authenticate` がある | RFC 9110 §15.5.2 |
| 405 に `allow` がある | RFC 9110 §15.5.6 |
| エラー本文の `content-type` が `application/problem+json` | RFC 9457 |
| 本文の `status` と実際のステータスが一致する | RFC 9457 §3.1.2 |
| 415 / 422 / 400 が状況に合った本文を返す | RFC 9110 §15.5 |
| 204 に本文と `content-type` がない | RFC 9110 §15.3.5 |
| 201 に `location` がある | RFC 9110 §15.3.2 |
| トークンを含む応答に `cache-control: no-store` がある | RFC 9111 §5.2.2.5 |
| `HEAD` の応答に本文がなく、`GET` と同じステータス | RFC 9110 §9.3.2 |
| 日時が RFC 3339（オフセットあり）、`pid` が小文字の UUID | RFC 3339 / RFC 9562 |
| GET が状態を変えていない（呼び出し前後で DB を比べる） | RFC 9110 §9.2.1 |
| 429 を返す経路があり、`retry-after` が付く | RFC 6585 §4 |

静的な確認（コードと設定を読む）:

- `config/*.yaml` の `auth.jwt.secret` の長さ（HS512 なら 64 バイト以上）。`config/production.yaml` は `JWT_SECRET` 環境変数なので、デプロイ先の値の長さを確認する。
- `auth.jwt.location` が既定（`Authorization: Bearer`）のままか。
- `GET` に付いたハンドラーで、DB の更新・メール送信・トークン発行をしているものがないか（`routes()` の `.add("...", get(...))` を全部見る）。
- URL（パス・クエリ）にトークンやパスワードを載せていないか。
- `openapi/openapi.yaml` の各エンドポイントが、実測で見えたステータスを網羅しているか。エラー応答の `content` が `application/problem+json` か。

## 4. 結果の固定

直した振る舞いは、探査テストではなく、正式なテストで固定する（`tests/requests/` の既存の流儀。`#[serial]`、`request::<App, _, _>`）。次の形:

```rust
#[tokio::test]
#[serial]
async fn unauthorized_response_carries_a_bearer_challenge() {
    request::<App, _, _>(|request, _ctx| async move {
        let res = request.get("/api/auth/current").await;
        assert_eq!(res.status_code(), 401);
        let challenge = res.header("www-authenticate");
        assert!(challenge.to_str().unwrap().starts_with("Bearer"));
        assert_eq!(res.header("content-type"), "application/problem+json");
    })
    .await;
}
```

- `res.header(name)` は axum-test の API で、ヘッダーが無いと panic する（このコード片は 2026-11-17 時点でコンパイルできることと、現状の未準拠で落ちることを確認済み）。
- 未準拠を見つけたら、先にこの形で落ちるテストを書き、直す変更と同じ PR に入れる。実物は `tests/requests/rfc.rs`（`assert_problem!` マクロで、ステータス・媒体型・本文の `status` の一致をまとめて確かめる）。

## 5. 外部ツール（任意。このリポジトリには未導入、未検証）

- [Schemathesis](https://schemathesis.readthedocs.io/): `openapi/openapi.yaml` を入力に実サーバーへ要求を送り、応答が仕様（ステータス、`Content-Type`、スキーマ）に合うかを調べる。
- [Spectral](https://github.com/stoplightio/spectral) / [Redocly CLI](https://redocly.com/docs/cli/): OpenAPI 文書の構造を lint する。

導入するときは、CI への組み込みを含めて別の変更として扱う。

## 6. 修正前の測定値（ベースライン。2026-11-17、Loco 1.3.1）

`.claude/rules/rfc-compliance.md` の「準拠の状況」の元データ。下の表は **`problem_details` ミドルウェアを入れる前**の、Loco 既定の応答。修正後は `tests/requests/rfc.rs` が現在の挙動を固定している。

| 要求 | ステータス | `content-type` | RFC に関わるヘッダー |
|---|---|---|---|
| `POST /api/auth/login`（未登録のメール） | 401 | `application/json` | `www-authenticate` なし |
| `GET /api/auth/current`（トークンなし） | 401 | `application/json` | `www-authenticate` なし |
| `GET /api/auth/current`（不正なトークン） | 401 | `application/json` | `www-authenticate` なし |
| `POST /api/auth/login`（不正な JSON） | 400 | `application/json` | 本文 `{"error":"Bad Request"}` |
| `POST /api/auth/login`（`text/plain`） | 415 | `application/json` | 本文 `{"error":"Bad Request"}` |
| `POST /api/auth/login`（スキーマ不一致） | 422 | `application/json` | 本文 `{"error":"Bad Request"}` |
| `GET /api/auth/login` | 405 | なし | `allow: POST` |
| `OPTIONS /api/auth/login` | 405 | なし | `allow: POST` |
| `GET /api/nope` | 404 | なし | 本文なし |
| `HEAD /api/auth/current` | 401 | `application/json` | 本文なし |
| `POST /api/auth/register` | 200 | `application/json` | 本文 `null` |
| `POST /api/auth/magic-link`（`x@Gmail.com`） | 400 | `application/json` | 許可ドメインの判定が大文字小文字を区別する |

トークンを返す応答（ログイン成功、マジックリンクの引き換え）の `cache-control` は、実測していない。コード上は付けている箇所がない。
