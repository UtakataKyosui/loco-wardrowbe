---
name: rfc-compliance
description: Make the HTTP API of this Loco (loco-rs 1.3 / axum 0.8 / utoipa) app conform to the relevant IETF RFCs — RFC 9110 HTTP semantics, RFC 9457 Problem Details, RFC 6750 Bearer tokens, RFC 7519/8725/7518 JWT, RFC 8259 JSON, RFC 3339 timestamps, RFC 9562 UUID, RFC 5321/5322 email. Use when adding or changing a controller, an error response, auth or token handling, a status code, a header, a date/ID/email field, or the OpenAPI spec; when asked to "make it RFC compliant", to audit the API against the RFCs, or to decide which status code / header / body shape is correct. Also use before citing an RFC section in code or a PR.
---

# RFC 準拠スキル

HTTP API の「外から観測できる振る舞い」が、該当する RFC の規範的要件を満たすようにするためのスキル。対象は線上のバイト列（ステータス、ヘッダー、本文、トークン、日時、ID）で、Rust の書き方は対象外（それは `rust-best-practices`、Loco の流儀は `loco`）。

自動で読み込まれる短い要点は `.claude/rules/rfc-compliance.md`。このスキルはその根拠・判断基準・実装方針・監査手順を持つ。

## 使い方

1. 変えようとしている部分がどの領域かを下の表で決め、該当する参照文書を読む。
2. 規範レベルを区別する。**MUST / MUST NOT** は準拠の条件で、破ると仕様違反。**SHOULD / SHOULD NOT** は例外を認識したうえで外せる。**MAY** は任意。コメントや PR に書くときはこの区別を保つ。
3. 実装したら、ステータス・ヘッダー・本文を**実測**する（`references/audit.md` の手順）。ハンドラーを読んだだけで「準拠」と言わない。Loco や axum が既定で付けるヘッダー、あるいは付けないヘッダーがあり、コードに現れないため。
4. `openapi/openapi.yaml` を再生成し、返し得る応答を仕様に反映する（`.claude/rules/api-codegen-pipeline.md`）。

| 触るもの | 読む文書 |
|---|---|
| メソッド、ステータスコード、`Location` / `Allow` / `Retry-After`、キャッシュ、条件付きリクエスト | `references/http-semantics.md` |
| エラー応答の本文と媒体型、検証エラーの形 | `references/problem-details.md` |
| ログイン、トークン、`Authorization` / `WWW-Authenticate`、JWT の設定と検証 | `references/bearer-jwt.md` |
| 日時、ID、メールアドレス、JSON の数値、URL、OpenAPI の `format` | `references/data-formats.md` |
| 既存コードの準拠度を調べる、テストで固定する | `references/audit.md` |

## 準拠の対象と対象外

対象にする RFC は、この API が実際に使っている仕様に限る。

- **HTTP**: RFC 9110（意味論。RFC 7231 / 7232 / 7235 を置き換えた）、RFC 9111（キャッシュ）、RFC 6585（429 など）。HTTP/1.1 の framing（RFC 9112）は axum / hyper が担うのでアプリ側では扱わない。
- **エラー**: RFC 9457（Problem Details。RFC 7807 を置き換えた）。
- **認証**: RFC 6750（Bearer）。このアプリは OAuth 2.0 の認可サーバーではないので、RFC 6749 のフローや RFC 9068（JWT アクセストークンのプロファイル）は**宣言しない限り適用外**。ただしトークン応答の扱いなど、考え方が参考になる箇所は流用する。
- **トークン**: RFC 7519（JWT）、RFC 7518（JWA。鍵長）、RFC 8725（JWT のベストプラクティス）。
- **データ**: RFC 8259（JSON）、RFC 3339（日時）、RFC 9562（UUID。RFC 4122 を置き換えた）、RFC 5321 / 5322 / 4343（メール、ドメインの大文字小文字）、RFC 3986（URI）。
- **メールの本文・ヘッダー**: `src/mailers/**` が出すメール自体は RFC 5322 / 2045 系。送信は `lettre`（Loco 経由）が組み立てるので、件名の非 ASCII や `From` の形式を手で組まない。

対象外の例: CORS（RFC ではなく Fetch Standard）、OpenAPI 自体（OAI の仕様。RFC 3986 / 6570 のパステンプレートに近い書式を使うだけ）。

## 判断の原則

- **番号は原典で確かめる**。節番号は記憶で書かない。<https://www.rfc-editor.org/rfc/rfc9110.html> のように RFC エディターの原文で当たる（`rfc9110.txt` で grep しやすい）。引用するときは「RFC 9110 §15.5.2」の形で、規範語（MUST など）を原文のまま保つ。
- **既存 RFC は置き換わる**。RFC 7807 → 9457、RFC 4122 → 9562、RFC 7231 → 9110。古い番号を新しいコードに書かない。
- **ステータスとヘッダーは組で決める**。401 ⇒ `WWW-Authenticate`、405 ⇒ `Allow`、429 / 503 ⇒ `Retry-After`（推奨）、201 ⇒ `Location`（推奨）。ステータスだけ足してヘッダーを忘れるのが典型的な誤り。
- **セキュリティと互換性を秤にかける場合は理由を残す**。たとえば `register` が既存メールでも成功を返すのは、列挙攻撃への配慮という正当な逸脱の理由がある。RFC の規範に反しない範囲か確認し、反するなら PR に理由を書く。
- **フレームワークの既定を前提にしない**。Loco 1.3.1 のエラー本文は `{"error","description"}` の `application/json`、401 に `WWW-Authenticate` を付けない。axum は 405 に `Allow` を付ける。実測する。
- **まとめて直す**。全エラー応答に共通する要件（`WWW-Authenticate`、`application/problem+json`、`Cache-Control`）は、各ハンドラーに書かず 1 か所（`Initializer` の `after_routes` で `axum::middleware::map_response`）に集約する。ハンドラーごとの手書きは必ずぶれる。

## 現状

未準拠の一覧と状態（済 / 未対応）は `.claude/rules/rfc-compliance.md` の「準拠の状況」の表にある。直したら状態を更新し、新しく見つけたら足す。実装の入口は `src/initializers/problem_details.rs`（エラー応答、`WWW-Authenticate`、`Cache-Control`）、`src/initializers/jwt_secret.rs`（鍵長）、固定するテストは `tests/requests/rfc.rs`。

## このスキルの出所

2026-11-17 に、既存のスキル・ルールを探した。claude.ai のスキル検索とプラグイン検索には RFC 準拠向けのものがなく、公開されているものも RFC 9457 だけを扱う単発のコミュニティ製スキルしか見つからなかった（HTTP の意味論、Bearer / JWT、データ形式までを通したものはない）。出所を確かめられない外部の文書を取り込まず、このアプリ（Loco 1.3.1、axum 0.8、utoipa 6、JWT）に合わせて自前で作った。

- 規範的な記述（MUST など）と節番号は、RFC エディター（<https://www.rfc-editor.org/>）の原文で確認した。
- 「現状」と Loco の挙動は、`loco-rs` 1.3.1 / `tower-http` 0.6.11 のソースと、実際に起動した応答の測定で確認した。
- RFC は改訂される。番号を使う前に、原文が現行（obsoleted でない）か確認する。
