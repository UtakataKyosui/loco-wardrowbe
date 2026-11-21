---
paths:
  - "src/controllers/**/*.rs"
  - "src/views/**/*.rs"
  - "src/dtos/**/*.rs"
  - "src/models/users.rs"
  - "src/clerk.rs"
  - "src/initializers/**/*.rs"
  - "config/*.yaml"
  - "openapi/**"
  - "tests/requests/**"
---

# RFC 準拠ルール

HTTP API の外から観測できる振る舞い（ステータス、ヘッダー、本文、トークン、日時、ID）は、該当する RFC の規範的要件（MUST / MUST NOT）に従う。判断が分かれたら RFC を根拠にし、コードのコメントか PR 説明に RFC 番号と節を書く。

詳細・根拠・監査手順は `.claude/skills/rfc-compliance/`（`SKILL.md` から読む）。この文書は、コントローラーを書き換えるたびに守る要点だけを置く。

## 準拠対象

| 領域 | RFC |
|---|---|
| HTTP の意味論（メソッド、ステータス、ヘッダー） | RFC 9110、キャッシュは RFC 9111、追加ステータスは RFC 6585 |
| エラー応答 | RFC 9457（Problem Details。RFC 7807 の後継） |
| 認証 | RFC 6750（Bearer）、RFC 9110 §11（認証フレームワーク） |
| トークン | RFC 7519（JWT）、RFC 8725（JWT のベストプラクティス）、RFC 7518（署名アルゴリズムと鍵長） |
| データ形式 | RFC 8259（JSON）、RFC 3339（日時）、RFC 9562（UUID）、RFC 5321 / 5322（メールアドレス）、RFC 3986（URI） |

## 必ず守ること

1. **メソッドの安全性**: `GET` / `HEAD` / `OPTIONS` で状態を変えない（RFC 9110 §9.2.1）。状態を変える操作は `POST` / `PUT` / `PATCH` / `DELETE`。トークンを URL のパスやクエリに載せない（fragment は送信されない）。`GET /api/auth/current` が初回に行を作るのは、副作用が冪等で、呼び出し側が結果として観測するものではないため、許容している（JIT プロビジョニング）。
2. **401 には `WWW-Authenticate` を付ける**（RFC 9110 §15.5.2 の MUST）。同じミドルウェアが付ける: `Bearer realm="wardrowbe"`。トークンが無効・期限切れのときは `error="invalid_token"`、トークンを送っていないときは `error` を付けない（RFC 6750 §3）。
3. **405 には `Allow` を付ける**（RFC 9110 §15.5.6）。axum のルーターが自動で付けるので、手書きのハンドラーで 405 を返すときだけ気をつける。
4. **エラー本文は `application/problem+json`**（RFC 9457）。`type` / `title` / `status` / `detail` を持ち、`status` は実際の HTTP ステータスと一致させる。`src/initializers/problem_details.rs` のミドルウェアが `/api/` の全エラー応答（ハンドラー、`Json` / `ClerkAuth` の抽出子、404 / 405 を含む）をこの形に作り替えるので、ハンドラーは今までどおり `loco_rs::Error`（`unauthorized(...)` など）を返せばよい。内部エラーの詳細（SQL、スタック、パス）は 5xx の `detail` に出ない作りになっている（RFC 9457 §5）。新しいエラーの種類を足すときは、ミドルウェアの変換を通ることを `tests/requests/rfc.rs` で確かめる。
5. **ステータスコードを使い分ける**: 作成は `201` + `Location`、本文なしの成功は `204`（本文を付けない）、非同期の受付は `202`、不正な JSON は `400`、`Content-Type` の不一致は `415`、構文は正しいが意味が不正な入力は `422`、レート制限は `429` + `Retry-After`。
6. **サインイン中のユーザー固有の応答は `Cache-Control: no-store`**（RFC 9111 §5.2.2.5）。ミドルウェアが `/api/auth/` の全応答に付ける。トークンを返す API はもう無い（トークンは Clerk が発行する）。`/api/auth/` の外にユーザー固有の応答を作るときは、自分で付ける。
7. **JWT**: トークンは Clerk が RS256 で署名する。検証は `src/clerk.rs` の `ClerkVerifier` に集約している（RFC 8725）: `alg` は `RS256` に固定してトークンの `alg` を信用しない、`kid` が JWKS に無いトークンは拒否、`iss` は設定した issuer と完全一致、`exp` は必須で `nbf` も検証、`azp` は `authorized_parties` を設定したときに照合する。拒否の理由は応答に出さない（RFC 9457 §5）。鍵（JWKS）を取れないときは、呼び出し側の誤りではないので 401 ではなく 500（詳細は出さない）。未知の `kid` による JWKS の再取得は 30 秒に 1 回までにする。検証を足すときは `tests/clerk/mod.rs` に拒否するケースを足す。トークンを URL（パス・クエリ）に載せない。
8. **日時は RFC 3339**（`2026-11-17T01:19:03Z`）。`chrono::DateTime<Utc>`（または `FixedOffset`）を使い、タイムゾーンを持たない `NaiveDateTime` をそのまま API に出さない。OpenAPI は `format: date-time`。
9. **ID は UUID の正規形**（小文字 8-4-4-4-12、RFC 9562）。レスポンスの型は `String` ではなく `uuid::Uuid` にして、OpenAPI に `format: uuid` を出させる（`views/auth.rs` の `pid`）。Clerk の `sub` は内部の紐づけ用で、API には出さない。。
10. **メールアドレスを正規表現で検証しない**。メールアドレスの検証は Clerk に任せ、このアプリはトークンの `email` を保存するだけにする。自前で検証や比較が要るときは、`validator` の `#[validate(email)]` を使い、ドメイン部は大文字小文字を区別しない（RFC 5321 §2.4、RFC 4343）ので `eq_ignore_ascii_case` で比べる。
11. **JSON は UTF-8**（RFC 8259 §8.1）。`Content-Type: application/json` に `charset` を付けない。JavaScript から読む整数 ID は 2^53 を超えない型にする（RFC 8259 §6）。
12. **OpenAPI を実装に合わせる**: 返し得るステータス（400 / 401 / 415 / 422 など）、エラー本文 `dtos::common::ProblemDetails` と媒体型 `application/problem+json`、401 の `WWW-Authenticate` ヘッダー、`Location` / `Retry-After` を `#[utoipa::path]` に書く（`controllers/auth.rs` の既存の注釈をそのまま写せる）。`.claude/rules/api-codegen-pipeline.md` の段階 2 と併せて適用する。

## 準拠の状況（2026-11 時点）

ログインを Clerk に移したため、自前の認証 API（登録、確認メール、パスワード再設定、マジックリンク、ログイン）は無くなり、それらに関わる未準拠（GET の副作用、HMAC 鍵長、許可ドメインの大文字小文字、`200` + `null`）は対象外になった。残る API は `GET /api/auth/current` のみで、固定するテストは `tests/requests/rfc.rs` と `tests/clerk/mod.rs`、`src/initializers/*` のユニットテスト。

| # | 内容 | 状態 | 備考 |
|---|---|---|---|
| 1 | 401 に `WWW-Authenticate` | 済 | `problem_details` ミドルウェア |
| 2 | エラー本文が `application/problem+json` | 済 | 同上 |
| 3 | 415 / 422 / 不正 JSON の区別 | 済 | 同上 |
| 6 | ユーザー固有の応答に `no-store` | 済 | ミドルウェアが `/api/auth/` に付ける |
| 9 | `pid` が UUID（`format: uuid`） | 済 | `pid: Uuid` |
| 10 | レート制限と `429` / `Retry-After` | 未対応（RFC の要件ではない） | 認証の総当たりは Clerk 側が受ける。API 全体の制限は、クライアント IP の取り方（リバースプロキシの構成）を決めてから入れる。Loco の `remote_ip` ミドルウェアが候補 |

この表にない既知の残り:

- Loco の `secure_headers`（HSTS、`nosniff` など）は有効にしていない。CSP が SPA（と Clerk の読み込むスクリプト）を壊すおそれがあるので、HSTS と `nosniff` だけの最小構成から検討する。
- `users` の行は、Clerk 側でユーザーを消しても残る（`user.deleted` の Webhook は未実装）。

新しい未準拠を見つけたら、この表に足す。

## 完了前チェック

```sh
cargo fmt --all
cargo clippy --all-targets -- -D warnings
cargo test
```

API の振る舞いを変えたら、`openapi/openapi.yaml` を再生成する（`cargo loco task openapi:export`）。RFC に関わる変更には、ステータス・ヘッダー・本文の形を確かめる `tests/requests/**` のテストを足す。
