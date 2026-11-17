---
paths:
  - "src/controllers/**/*.rs"
  - "src/views/**/*.rs"
  - "src/dtos/**/*.rs"
  - "src/models/users.rs"
  - "src/mailers/**/*.rs"
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

1. **メソッドの安全性**: `GET` / `HEAD` / `OPTIONS` で状態を変えない（RFC 9110 §9.2.1）。状態を変える操作は `POST` / `PUT` / `PATCH` / `DELETE`。メールのリンクから開かれるトークンの検証も同じで、リンクは SPA のページ（`/verify#<token>`、`/magic-link#<token>`）を指し、ページが `POST /api/auth/verify` などの本文でトークンを送る。トークンを URL のパスやクエリに載せない（fragment は送信されない）。
2. **401 には `WWW-Authenticate` を付ける**（RFC 9110 §15.5.2 の MUST）。同じミドルウェアが付ける: `Bearer realm="wardrowbe"`。トークンが無効・期限切れのときは `error="invalid_token"`、トークンを送っていないときは `error` を付けない（RFC 6750 §3）。
3. **405 には `Allow` を付ける**（RFC 9110 §15.5.6）。axum のルーターが自動で付けるので、手書きのハンドラーで 405 を返すときだけ気をつける。
4. **エラー本文は `application/problem+json`**（RFC 9457）。`type` / `title` / `status` / `detail` を持ち、`status` は実際の HTTP ステータスと一致させる。`src/initializers/problem_details.rs` のミドルウェアが `/api/` の全エラー応答（ハンドラー、`Json` / JWT の抽出子、404 / 405 を含む）をこの形に作り替えるので、ハンドラーは今までどおり `loco_rs::Error`（`unauthorized(...)` など）を返せばよい。内部エラーの詳細（SQL、スタック、パス）は 5xx の `detail` に出ない作りになっている（RFC 9457 §5）。新しいエラーの種類を足すときは、ミドルウェアの変換を通ることを `tests/requests/rfc.rs` で確かめる。
5. **ステータスコードを使い分ける**: 作成は `201` + `Location`、本文なしの成功は `204`（本文を付けない）、非同期の受付は `202`、不正な JSON は `400`、`Content-Type` の不一致は `415`、構文は正しいが意味が不正な入力は `422`、レート制限は `429` + `Retry-After`。
6. **トークンを返す応答は `Cache-Control: no-store`**（RFC 9111 §5.2.2.5、RFC 6749 §5.1 と同じ考え方）。ミドルウェアが `/api/auth/` の全応答に付ける。`token` を本文に含む応答を `/api/auth/` の外に作るときは、自分で付ける。
7. **JWT**: 署名アルゴリズムの鍵長は RFC 7518 §3.2 に従う（HS512 は 512 ビット = 64 バイト以上）。`JwtSecretInitializer`（`src/initializers/jwt_secret.rs`）が、短い `auth.jwt.secret` では起動しないようにしている。`exp` を必ず検証し、`alg` はサーバー側で固定する（RFC 8725）。トークンを URL（パス・クエリ）に載せない。
8. **日時は RFC 3339**（`2026-11-17T01:19:03Z`）。`chrono::DateTime<Utc>`（または `FixedOffset`）を使い、タイムゾーンを持たない `NaiveDateTime` をそのまま API に出さない。OpenAPI は `format: date-time`。
9. **ID は UUID の正規形**（小文字 8-4-4-4-12、RFC 9562）。レスポンスの型は `String` ではなく `uuid::Uuid` にして、OpenAPI に `format: uuid` を出させる（`views/auth.rs` の `pid`）。
10. **メールアドレスを正規表現で検証しない**。`validator` の `#[validate(email)]` を使う。ドメイン部は大文字小文字を区別しない（RFC 5321 §2.4、RFC 4343）ので、許可リストなどの比較は `eq_ignore_ascii_case` で行う（`controllers/auth.rs` の `is_allowed_email_domain`）。
11. **JSON は UTF-8**（RFC 8259 §8.1）。`Content-Type: application/json` に `charset` を付けない。JavaScript から読む整数 ID は 2^53 を超えない型にする（RFC 8259 §6）。
12. **OpenAPI を実装に合わせる**: 返し得るステータス（400 / 401 / 415 / 422 など）、エラー本文 `dtos::common::ProblemDetails` と媒体型 `application/problem+json`、401 の `WWW-Authenticate` ヘッダー、`Location` / `Retry-After` を `#[utoipa::path]` に書く（`controllers/auth.rs` の既存の注釈をそのまま写せる）。`.claude/rules/api-codegen-pipeline.md` の段階 2 と併せて適用する。

## 準拠の状況（2026-11 時点）

`.claude/skills/rfc-compliance/references/audit.md` の手順で実測した未準拠 10 件のうち、7 件を直した。固定するテストは `tests/requests/rfc.rs`（と `src/initializers/*` のユニットテスト）。

| # | 内容 | 状態 | 直し方 |
|---|---|---|---|
| 1 | 401 に `WWW-Authenticate` が付かない（RFC 9110 §15.5.2） | 済 | `problem_details` ミドルウェアが付ける |
| 2 | エラー本文が `application/problem+json` でない（RFC 9457） | 済 | 同上。`ProblemDetails` を OpenAPI にも反映 |
| 3 | 415 / 422 / 不正 JSON の本文がどれも `Bad Request`。OpenAPI に 415 がない | 済 | ステータスに合う `title` / `detail`。検証エラーは 422 + `errors`（JSON Pointer）。OpenAPI に 415 / 422 |
| 4 | GET が状態を変える。トークンが URL に載る（RFC 9110 §9.2.1、RFC 3986 §7.5） | 済 | `POST /api/auth/verify`、`POST /api/auth/magic-link/verify`（本文にトークン）。メールのリンクは SPA の `/verify#<token>`、`/magic-link#<token>`。旧 GET ルートは削除 |
| 5 | dev / test の JWT 秘密鍵が 20 バイト（RFC 7518 §3.2） | 済 | 96 バイトに差し替え。`JwtSecretInitializer` が 64 バイト未満の起動を拒否 |
| 6 | トークンを返す応答に `Cache-Control: no-store` がない（RFC 9111 §5.2.2.5） | 済 | ミドルウェアが `/api/auth/` の全応答に付ける |
| 7 | 許可メールドメインの判定が大文字小文字を区別する（RFC 5321 §2.4） | 済 | `is_allowed_email_domain`（正規表現をやめ、`regex` 依存も削除） |
| 8 | `register` などが本文 `null` の `200` を返す | 未対応（違反ではない） | `null` は有効な JSON で、RFC 9110 §15.3 に反しない。`202` / `204` への変更は契約の変更になるので、必要が出てからにする |
| 9 | `pid` に OpenAPI の `format: uuid` がない（RFC 9562） | 済 | `pid: Uuid`。生成された Zod は `z.uuid()` |
| 10 | レート制限と `429` / `Retry-After` がない | 未対応（RFC の要件ではない） | RFC 6585 §4 は 429 の意味を定めるだけで、制限を義務づけない。総当たり対策としては必要で、クライアント IP の取り方（リバースプロキシの構成）を決めてから入れる。Loco の `remote_ip` ミドルウェアが候補 |

この表にない既知の残り:

- メールアドレスの正規化（全体を小文字にして保存・照合する）。既存の行の扱い（大文字小文字違いの重複）を決めてから入れる。
- メールの `/reset#<token>` を受ける SPA のページがまだない（RFC ではなく機能の欠落）。
- Loco の `secure_headers`（HSTS、`nosniff` など）は有効にしていない。CSP が SPA を壊すおそれがあるので、HSTS と `nosniff` だけの最小構成から検討する。

新しい未準拠を見つけたら、この表に足す。

## 完了前チェック

```sh
cargo fmt --all
cargo clippy --all-targets -- -D warnings
cargo test
```

API の振る舞いを変えたら、`openapi/openapi.yaml` を再生成する（`cargo loco task openapi:export`）。RFC に関わる変更には、ステータス・ヘッダー・本文の形を確かめる `tests/requests/**` のテストを足す。
