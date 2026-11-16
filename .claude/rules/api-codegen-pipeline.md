---
paths:
  - "src/controllers/**/*.rs"
  - "src/views/**/*.rs"
  - "src/dtos/**/*.rs"
  - "src/initializers/openapi.rs"
  - "config/*.yaml"
  - "openapi/**"
  - "frontend/orval.config.ts"
  - "frontend/src/api/**"
---

# API 追加パイプライン

新しい API リソースは、次の 4 段階を順番に通す。バックエンドの Rust コードがスキーマの唯一の出所であり、フロントエンドの API クライアントと型は手書きせず、生成物として扱う。

```
1. cargo loco generate scaffold
2. loco-openapi-initializer のマクロを付ける
3. OpenAPI YAML を書き出す
4. Orval で Zod + Effect クライアントを生成する
```

## 1. Loco scaffold でコードを生成する

- モデル・マイグレーション・コントローラー・ビューは `cargo loco generate scaffold <name> <field:type>... --api` で生成する。手で配線しない。
- 生成後に `src/controllers/mod.rs`・`src/app.rs` のルート登録が追加されたことを確認する。
- マイグレーションを適用し、エンティティを再生成する（`cargo loco db migrate` / `cargo loco db entities`）。
- ドメインロジックはモデルに置き、コントローラーは「パース → モデル呼び出し → レンダリング」に留める（`.claude/skills/loco/doctrine.md`）。

## 2. loco-openapi-initializer のマクロを付ける

scaffold 直後のハンドラーはまだ OpenAPI に載らない。次の 3 点を手で足す。

1. **スキーマ**: リクエスト・レスポンスに使う struct に `#[derive(ToSchema)]` を付ける。`src/views/**` と `src/dtos/**` の両方が対象。
2. **パス注釈**: 各ハンドラーに `#[utoipa::path(...)]` を付ける。`path` は `Routes::prefix` + `add` のパスと**完全一致**させる。`responses` には成功・エラーの両方を書き、`body` に `ToSchema` 型を指定する。認証が必要なルートには `security(("jwt_token" = []))` を付ける。
3. **ルート登録**: `Routes::add` の `get(handler)` を `openapi(get(handler), routes!(handler))` に置き換える。

```rust
use loco_openapi::prelude::*;

/// 一覧を取得する
#[utoipa::path(
    get,
    path = "/api/items",
    security(("jwt_token" = [])),
    responses(
        (status = 200, description = "Item list", body = Vec<ItemResponse>),
        (status = 401, description = "Unauthorized", body = ApiError),
    ),
)]
async fn list(State(ctx): State<AppContext>) -> Result<Response> { /* ... */ }

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/items")
        .add("/", openapi(get(list), routes!(list)))
}
```

制約:

- `routes!` には**ハンドラーを 1 つだけ**渡す。複数渡さない。
- 同じルートを自動収集（`openapi(...)`）と手動収集（`api_routes()`）の両方に入れない。このアプリは自動収集に統一し、`src/initializers/openapi.rs` の第 2 引数は `None` のままにする。
- `utoipa::path` が付いていないルートは仕様に出ない。
- テスト環境ではグローバル状態の競合を避けるため、OpenAPI initializer を無効にする（`ctx.environment != Environment::Test` のときだけ登録）。
- `info(title, description)` は `src/initializers/openapi.rs` の `ApiDoc` で、アプリの実態に合わせる。

## 3. OpenAPI YAML を書き出す

- `config/development.yaml` の `initializers.openapi` に `spec_yaml_url` を設定して YAML を配信する。
  ```yaml
  initializers:
    openapi:
      scalar:
        url: /scalar
        spec_yaml_url: /scalar/openapi.yaml
  ```
- 開発サーバーを起動して取得し、リポジトリにコミットする。
  ```sh
  cargo loco start &
  curl -fsS http://localhost:${PORT:-5150}/scalar/openapi.yaml -o openapi/openapi.yaml
  ```
- `openapi/openapi.yaml` を Orval の入力であり、API 契約のスナップショットとして扱う。ハンドラーやスキーマを変えたら必ず再取得し、差分を同じ PR に含める。
- YAML を手で編集しない。直したいときは Rust のマクロ側を直して再取得する。

## 4. Orval で Zod + Effect クライアントを生成する

`frontend/orval.config.ts` で、入力を `../openapi/openapi.yaml` にする。

- スキーマと検証: `schemas: { type: 'zod' }` と `override.fetch.runtimeValidation: true` で、レスポンスを Zod で実行時検証する。Zod は v4（`zod@^4`）を使う。
- クライアント: `client: 'fetch'` を使い、`override.mutator` に Effect ベースの fetch ラッパーを指定する。Orval に Effect 専用のクライアント出力はないため、Effect 化はこのミューテーターで行う。
- ミューテーター（`frontend/src/api/` 配下）の責務:
  - `fetch` を `Effect.tryPromise` で包み、失敗を型付きエラーとして `E` チャネルに流す。ネットワーク障害、HTTP ステータス異常（`ApiError` ボディ付き）、Zod 検証失敗を別々のタグ付きエラー（`Data.TaggedError`）にする。
  - 401 は既存の `src/api/client.ts` と同じく、トークンを破棄して `/login` に遷移させる。
  - 例外を `throw` しない。呼び出し側は `Effect.catchTag` / `Effect.match` で分岐する。
- 生成先は `frontend/src/api/generated/` とし、手で編集しない。生成物はコミットする。
- 生成コマンドは `frontend/package.json` の script に置く（例: `"codegen": "orval"`）。実行は `vp run codegen`。
- 依存の追加は `vp add effect` で行う。

```ts
// frontend/orval.config.ts
import { defineConfig } from "orval";

export default defineConfig({
  wardrowbe: {
    input: "../openapi/openapi.yaml",
    output: {
      client: "fetch",
      mode: "tags-split",
      target: "src/api/generated",
      schemas: { path: "src/api/generated/model", type: "zod" },
      override: {
        mutator: { path: "src/api/effect-fetch.ts", name: "effectFetch" },
        fetch: { runtimeValidation: true },
      },
    },
  },
});
```

## 現状（2026-11 時点）で未整備のもの

このルールが前提とするが、まだ存在しない。最初の API を通すときに合わせて整える。

- `frontend/orval.config.ts` は空ファイル。
- `effect` は `frontend/package.json` に未導入。
- `config/*.yaml` に `initializers.openapi` の設定がない。
- `openapi/` ディレクトリがない。
- 既存の `frontend/src/api/client.ts` と `frontend/src/bindings/*`（ts-rs 由来）は手書きの暫定クライアント。生成クライアントへ移行したら、新規コードからは使わない。

## 完了前チェック

```sh
cargo fmt --all
cargo clippy --all-targets -- -D warnings
cargo test
# フロントエンド
cd frontend && vp run codegen && vp check
```

`openapi/openapi.yaml` と `frontend/src/api/generated/` に差分が出たら、同じ commit に含める。
