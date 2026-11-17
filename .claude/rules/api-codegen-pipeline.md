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

新しい API リソースは、次の 4 段階を順番に通す。Rust コードがスキーマの唯一の出所であり、フロントエンドの API クライアント・Zod スキーマ・Effect スキーマは手書きせず、生成物として扱う。

```
1. cargo loco generate scaffold   → Rust のコード一式
2. loco-openapi のマクロを付ける  → ハンドラーとスキーマを OpenAPI に載せる
3. OpenAPI YAML を書き出す        → openapi/openapi.yaml
4. Orval で生成する               → HTTP クライアント + Zod + Effect Schema
```

## 参考情報

| 段階 | URL |
|---|---|
| 1 | <https://loco.rs/docs/how-to/use-generators/> |
| 2, 3 | <https://github.com/loco-rs/loco-openapi-Initializer> |
| 4 (Zod) | <https://orval.dev/docs/guides/client-with-zod> |
| 4 (Effect) | <https://orval.dev/docs/guides/client-with-effect> |

## 1. Loco scaffold でコードを生成する

```sh
cargo loco generate scaffold posts title:string! content:text user:references
cargo loco db migrate && cargo loco db entities
```

- ジェネレーターは**デバッグビルドでのみ**使える（`#[cfg(debug_assertions)]`）。`--release` のバイナリには無い。
- scaffold はエンティティ・マイグレーション・DTO・コントローラー・ルート・モデルテストを生成し、`mod.rs` への登録も行う。手で配線しない。
- `--api` / `--html` / `--htmx` は 1.0 で廃止された。`--api` は何も起きないフラグとして受け付けられるだけ。新しく書くときは付けない。
- scaffold のルートは**既定で JWT 必須**。公開リソースにするときだけ `--no-auth` を付ける。コントローラー単体（`generate controller`）は既定で公開で、`--auth` で認証を付ける。
- アプリに `frontend/` があると、scaffold は型付き React フック・ページも生成する。このアプリでは API クライアントを段階 4 の生成物で統一するので、scaffold が出したフロント側のコードは残さず、生成クライアントに置き換える。
- マイグレーションの生成はファイルを書くだけで DB には触れない。`cargo loco db migrate && cargo loco db entities` で適用する。
- フィールド型は `name:type` の形で書く。サフィックスなしは nullable、`!` は必須、`^` は一意（暗黙に必須）。`bool`・`tstz`・`json` に `^` はない。
- `int` は 1.0 から `i64`（BIGINT）。16 ビットが要るときは `small_int` / `small_unsigned` を使う。
- 外部キーは `name:references`（必須）、`name:references?`（nullable）、`name:references:custom_id`（列名指定）。配列は `tags:array:string`。
- 型名は推測せず、Loco の Generators & field types リファレンスを確認する。
- ドメインロジックはモデルに置き、コントローラーは「パース → モデル呼び出し → レンダリング」に留める（`.claude/skills/loco/doctrine.md`）。

## 2. loco-openapi のマクロを付ける

scaffold 直後のハンドラーはまだ OpenAPI に載らない。次の 3 点を手で足す。依存は `loco-openapi = { version = "0.1", features = ["full"] }`（`Cargo.toml` に導入済み）。

1. **スキーマ**: レスポンス・リクエストに使う struct と、`utoipa::path` の `body` / `params` に現れる型すべてに `#[derive(ToSchema)]` を付ける。`src/views/**` と `src/dtos/**` が対象。
2. **パス注釈**: 各ハンドラーに `#[utoipa::path(...)]` を付ける。`path` は `Routes::prefix` + `add` のパスと**完全一致**させる。`responses` には成功とエラーの両方を書く。ハンドラーの doc コメントの 1 行目がタイトル、以降が説明になる。
3. **ルート登録**: `Routes::add` の `get(handler)` を `openapi(get(handler), routes!(handler))` に置き換える。

```rust
use loco_openapi::prelude::*;

/// 投稿を 1 件取得する
///
/// 認証済みユーザーが ID で投稿を取得する。
#[utoipa::path(
    get,
    path = "/api/posts/{id}",
    security(("jwt_token" = [])),
    params(("id" = i32, Path, description = "Post ID")),
    responses(
        (status = 200, description = "Post found", body = PostResponse),
        (status = 401, description = "Unauthorized", body = ApiError),
        (status = 404, description = "Post not found", body = ApiError),
    ),
)]
async fn show(State(ctx): State<AppContext>, Path(id): Path<i32>) -> Result<Response> { /* ... */ }

pub fn routes() -> Routes {
    Routes::new()
        .prefix("api/posts")
        .add("/{id}", openapi(get(show), routes!(show)))
}
```

制約:

- `utoipa::path` が付いたルートだけが仕様に出る。付け忘れるとフロントエンドの生成物から黙って消える。
- `routes!` には**ハンドラーを 1 つだけ**渡す。複数渡さない。
- 同じルートを自動収集（`openapi(...)`）と手動収集（`api_routes()` → `Some(vec![...])`）の両方に入れない。このアプリは自動収集に統一し、`src/initializers/openapi.rs` の第 2 引数は `None` のままにする。
- 認証が要るルートには `security(("jwt_token" = []))` を付ける。これは initializer の `modifiers(&SecurityAddon)` と `set_jwt_location` が設定済みであることが前提。認証不要のルートは `security` を書かない（または `security(())`）。
- 共通のエラーボディ（`ApiError`）はすべてのエラー応答で同じ型を指定し、Orval が 1 つのスキーマとして生成できるようにする。
- テスト環境ではグローバル状態の競合を避けるため、initializer を `ctx.environment != Environment::Test` のときだけ登録する（または `cargo nextest` を使う）。
- `info(title, description)` は `src/initializers/openapi.rs` の `ApiDoc` に書かれている。サンプルの文言のままなので、アプリの実態に合わせて直す。

## 3. OpenAPI YAML を書き出す

可視化 UI（redoc / scalar / swagger）と JSON/YAML の配信 URL は `config/*.yaml` の `initializers.openapi` で決まる。

```yaml
initializers:
  openapi:
    scalar:
      url: /scalar
      spec_yaml_url: /scalar/openapi.yaml
    swagger:
      url: /swagger
      spec_json_url: /api-docs/openapi.json # swagger は spec_json_url が必須
```

- 開発サーバーを起動して YAML を取得し、リポジトリにコミットする。
  ```sh
  cargo loco start &
  curl -fsS http://localhost:${PORT:-5150}/scalar/openapi.yaml -o openapi/openapi.yaml
  ```
- `openapi/openapi.yaml` は Orval の入力であり、API 契約のスナップショットでもある。ハンドラーやスキーマを変えたら再取得し、差分を同じ PR に含める。
- YAML を手で編集しない。直したいときは Rust のマクロ側を直して再取得する。
- 取得後に scalar（`/scalar`）で、追加したルートが出ているか確認する。

## 4. Orval で Zod と Effect のコードを生成する

Orval は 1 つの出力に HTTP クライアントとスキーマを同居させず、**同じ入力から用途別に複数の設定を並べて**生成する。スキーマ側は `fileExtension` を変えて、HTTP クライアントのファイルと名前が衝突しないようにする。

| 設定 | `client` | `fileExtension` | 生成物 | 用途 |
|---|---|---|---|---|
| `wardrowbe` | `react-query`（`httpClient: 'fetch'`） | 既定 | `<tag>.ts` | TanStack Query のフック。通信は Effect 経由のミューテーターで行う |
| `wardrowbeZod` | `zod` | `.zod.ts` | `<tag>.zod.ts` | Zod スキーマ。TanStack Form の検証と、レスポンスの実行時検証 |
| `wardrowbeEffect` | `effect` | `.effect.ts` | `<tag>.effect.ts` | Effect Schema。Effect パイプライン内でのデコード |

```ts
// frontend/orval.config.ts
import { defineConfig } from "orval";

const input = { target: "../openapi/openapi.yaml" };

export default defineConfig({
  wardrowbe: {
    input,
    output: {
      mode: "tags-split",
      client: "react-query",
      httpClient: "fetch",
      target: "src/api/endpoints",
      schemas: "src/api/models",
      override: {
        mutator: { path: "src/api/effect-fetch.ts", name: "effectFetch" },
      },
    },
  },
  wardrowbeZod: {
    input,
    output: {
      mode: "tags-split",
      client: "zod",
      target: "src/api/endpoints",
      fileExtension: ".zod.ts",
      override: { zod: { version: 4, strict: { response: true } } },
    },
  },
  wardrowbeEffect: {
    input,
    output: {
      mode: "tags-split",
      client: "effect",
      target: "src/api/endpoints",
      fileExtension: ".effect.ts",
      override: { effect: { version: 3 } },
    },
  },
});
```

生成物:

```
frontend/src/api/
├── endpoints/
│   └── posts/
│       ├── posts.ts          # react-query フック
│       ├── posts.zod.ts      # Zod スキーマ
│       └── posts.effect.ts   # Effect Schema
├── models/                   # 型定義
└── effect-fetch.ts           # 手書き: Effect ベースのミューテーター
```

### Zod（検証）

- Zod は v4（`zod@^4`、導入済み）。`override.zod.version: 4` で固定し、生成物を `zod` の import と揃える。
- 使い分け: 送信前の検証には `<Op>Body.parse(...)` / `safeParse`。フォームは TanStack Form のバリデーターに生成スキーマを渡す。
- `strict`・`coerce`・`generate`・`preprocess`・`generateEachHttpStatus`・`dateTimeOptions` は `override.zod` で調整する。操作単位・タグ単位の上書きは `override.operations[id].zod` / `override.tags[tag].zod` で、指定できるのは `strict`・`generate`・`coerce`・`preprocess`・`params`・`useBrandedTypes`・`generateCompanionTypes` のみ。`version` や `variant` など出力全体の設定はここでは無視され、警告が出る。
- `dateTimeOptions` の既定は `{ offset: true }`。RFC3339 のタイムゾーンオフセット付き日時を受け付ける。chrono の `DateTime` 系は通常この形で出る。
- `null` を `undefined` 扱いにしたいレスポンスは `preprocess.response` に関数を指定する（`null` / `undefined` を落とす `stripNill` など）。

### Effect（エラーハンドリング）

- `client: 'effect'` は Effect Schema を生成する。入手するのはスキーマで、HTTP 通信やエラー型は含まれない。エラーハンドリングは `effect-fetch.ts`（ミューテーター）で自分で組む。
- 使うバージョンは導入済みの `effect` を読んで 3 か 4 が選ばれる。未導入だと 4 になる。`override.effect.version` で固定し、`effect` の依存と一致させる。
- 主なオプションは `override.effect` の `strict`・`generate`・`useBrandedTypes`・`exactOptional`・`generateEachHttpStatus`・`generateReusableSchemas`。
- `generateReusableSchemas` を使うと、`$ref` の展開ではなく共有定数として出力され、出力が小さくなる。ただし `output.schemas` と併用できない。
- デコードは `S.decodeUnknown(Schema)`（Effect を返す）を使い、`decodeUnknownSync` のように例外を投げる形は使わない。同期で結果を見たいときは `S.decodeUnknownExit`（Effect 3 は `decodeUnknownEither`）。

### ミューテーター（`src/api/effect-fetch.ts`）

Orval の `override.mutator` に指定する手書きファイル。次を満たす。

- `fetch` を `Effect.tryPromise` で包み、失敗を `E` チャネルに流す。失敗の種類ごとに `Data.TaggedError` を分ける。
  - `NetworkError`: 通信自体の失敗
  - `HttpError`: HTTP ステータス異常。`ApiError` ボディ（`code` / `message`）とステータスを持つ
  - `DecodeError`: レスポンスのデコード（Zod または Effect Schema）の失敗
- 401 は既存の `src/api/client.ts` と同じく、トークンを破棄して `/login` に遷移する。
- 認証ヘッダーは `src/auth/token.ts` の `getToken()` から付ける。SSR で安全な形のまま使う。
- react-query のフックは `Promise` を要求するため、ミューテーターの境界で `Effect.runPromise` を呼ぶ。そのとき失敗は上の `TaggedError` のインスタンスとして reject し、呼び出し側は `error._tag` で分岐する。Effect を保ったまま使いたい場所は、`.effect.ts` のスキーマと同じミューテーター内の関数を直接使う。
- 生成クライアントの呼び出し側で `try/catch` の握りつぶしや `any` 化をしない。

## 現状（2026-11 時点）で未整備のもの

このルールが前提とするが、まだ存在しない。最初の API を通すときに整える。

- `frontend/orval.config.ts` は空ファイル。
- `effect` は `frontend/package.json` に未導入。導入は `vp add effect`。
- `config/*.yaml` に `initializers.openapi` の設定がない。
- `openapi/` ディレクトリがない。
- `src/api/effect-fetch.ts` が未作成。
- `frontend/package.json` に `codegen` script がない（`"codegen": "orval"` を追加し、`vp run codegen` で実行する）。
- 既存の `frontend/src/api/client.ts` と `frontend/src/bindings/*`（ts-rs 由来）は手書きの暫定実装。生成クライアントに移行したら、新規コードからは使わない。

## 完了前チェック

```sh
cargo fmt --all
cargo clippy --all-targets -- -D warnings
cargo test
# フロントエンド
cd frontend && vp run codegen && vp check
```

`openapi/openapi.yaml` と `frontend/src/api/` の生成物に差分が出たら、同じ commit に含める。生成物を直接編集しない。
