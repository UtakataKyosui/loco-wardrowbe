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

1. **メソッドの安全性**: `GET` / `HEAD` / `OPTIONS` で状態を変えない（RFC 9110 §9.2.1）。状態を変える操作は `POST` / `PUT` / `PATCH` / `DELETE`。メールのリンクから開かれるトークン検証のように GET に見える入り口は、GET では「確認画面を返すだけ」にして、実際の変更は POST で行う。
2. **401 には `WWW-Authenticate` を付ける**（RFC 9110 §15.5.2 の MUST）。Bearer なら `Bearer realm="wardrowbe"`。トークンが無効・期限切れのときは `error="invalid_token"`、トークンを送っていないときは `error` を付けない（RFC 6750 §3）。
3. **405 には `Allow` を付ける**（RFC 9110 §15.5.6）。axum のルーターが自動で付けるので、手書きのハンドラーで 405 を返すときだけ気をつける。
4. **エラー本文は `application/problem+json`**（RFC 9457）。`type` / `title` / `status` / `detail` を持ち、`status` は実際の HTTP ステータスと一致させる。Loco 既定の `{"error", "description"}` は RFC 9457 ではない。内部エラーの詳細（SQL、スタック、パス）は `detail` に出さない（RFC 9457 §5）。
5. **ステータスコードを使い分ける**: 作成は `201` + `Location`、本文なしの成功は `204`（本文を付けない）、非同期の受付は `202`、不正な JSON は `400`、`Content-Type` の不一致は `415`、構文は正しいが意味が不正な入力は `422`、レート制限は `429` + `Retry-After`。
6. **トークンを返す応答は `Cache-Control: no-store`**（RFC 9111 §5.2.2.5、RFC 6749 §5.1 と同じ考え方）。ログイン、マジックリンクの検証など、`token` を本文に含む応答すべて。
7. **JWT**: 署名アルゴリズムの鍵長は RFC 7518 §3.2 に従う（HS512 は 512 ビット = 64 バイト以上）。`exp` を必ず検証し、`alg` はサーバー側で固定する（RFC 8725）。トークンを URL（パス・クエリ）に載せない。
8. **日時は RFC 3339**（`2026-11-17T01:19:03Z`）。`chrono::DateTime<Utc>`（または `FixedOffset`）を使い、タイムゾーンを持たない `NaiveDateTime` をそのまま API に出さない。OpenAPI は `format: date-time`。
9. **ID は UUID の正規形**（小文字 8-4-4-4-12、RFC 9562）。OpenAPI は `type: string, format: uuid`。型は `String` ではなく `uuid::Uuid` にして `ToSchema` に `format` を出させる。
10. **メールアドレスを正規表現で検証しない**。`validator` の `#[validate(email)]` を使う。ドメイン部は大文字小文字を区別しない（RFC 5321 §2.4、RFC 4343）ので、比較・許可リストは小文字化してから行う。
11. **JSON は UTF-8**（RFC 8259 §8.1）。`Content-Type: application/json` に `charset` を付けない。JavaScript から読む整数 ID は 2^53 を超えない型にする（RFC 8259 §6）。
12. **OpenAPI を実装に合わせる**: 返し得るステータス（400 / 401 / 415 / 422 / 429 など）、エラー本文の媒体型 `application/problem+json`、401 の `WWW-Authenticate` ヘッダー、`Location` / `Retry-After` を `#[utoipa::path]` に書く。`.claude/rules/api-codegen-pipeline.md` の段階 2 と併せて適用する。

## 現状（2026-11 時点）で未準拠のもの

Loco 1.3.1 の既定の挙動と、このアプリの実装を実測した結果。直すときはこの一覧を更新する。測定の手順は `.claude/skills/rfc-compliance/references/audit.md`。

| # | 内容 | 根拠 | 重さ |
|---|---|---|---|
| 1 | 401 に `WWW-Authenticate` が付かない（`/api/auth/login`、`/api/auth/current` ほか全 401） | RFC 9110 §15.5.2 MUST | 高 |
| 2 | エラー本文が `application/json` の `{"error","description"}`。`application/problem+json` ではない | RFC 9457 | 高 |
| 3 | 415 / 422 / 不正 JSON の本文がどれも `{"error":"Bad Request"}`（ステータスと本文が食い違う）。OpenAPI にも 415 がない | RFC 9457 §3.1.2、RFC 9110 §15.5.16 / §15.5.21 | 中 |
| 4 | `GET /api/auth/verify/{token}` と `GET /api/auth/magic-link/{token}` が状態を変える（検証済みへの更新、トークンの消費、JWT の発行）。トークンが URL に載り、ログやリファラーに残る | RFC 9110 §9.2.1、RFC 3986 §7.5 | 高 |
| 5 | `development.yaml` / `test.yaml` の JWT 秘密鍵が 20 文字。Loco は `auth.jwt.secret` を base64 としてデコードしたものを鍵にするので、実際の鍵は 15 バイト（120 ビット）。Loco の既定アルゴリズムは HS512 で、512 ビット（64 バイト）以上が必要 | RFC 7518 §3.2 MUST | 中（本番は `JWT_SECRET` の長さ次第） |
| 6 | トークンを返す応答に `Cache-Control: no-store` がない | RFC 9111 §5.2.2.5 | 中 |
| 7 | 許可メールドメインの正規表現（`controllers/auth.rs`）が大文字小文字を区別する。`x@Gmail.com` が 400 になる | RFC 5321 §2.4、RFC 4343 | 低 |
| 8 | `register` / `forgot` などが本文 `null` の `200` を返す。受付だけなら `202`、本文なしなら `204` | RFC 9110 §15.3 | 低 |
| 9 | `pid` が OpenAPI 上 `string` のみで `format: uuid` がない（`LoginResponse`、`CurrentResponse`） | RFC 9562 | 低 |
| 10 | レート制限がなく、`429` / `Retry-After` を返す経路がない（ログイン・パスワードリセット・マジックリンクの総当たり対策も兼ねる） | RFC 6585 §4 | 中 |

直し方の方針は `.claude/skills/rfc-compliance/references/problem-details.md`（1〜3）と `references/bearer-jwt.md`（5、6）。1〜3 は、全エラー応答を 1 か所で作り替える `after_routes` のミドルウェア（`axum::middleware::map_response`）にまとめるのが最も手数が少ない。

## 完了前チェック

```sh
cargo fmt --all
cargo clippy --all-targets -- -D warnings
cargo test
```

API の振る舞いを変えたら、`openapi/openapi.yaml` を再生成する（`cargo loco task openapi:export`）。RFC に関わる変更には、ステータス・ヘッダー・本文の形を確かめる `tests/requests/**` のテストを足す。
