# エラー応答（RFC 9457 Problem Details）

RFC 9457（2023 年 7 月）は RFC 7807 を置き換えた。媒体型は `application/problem+json`。

## 仕様の要点

本文は JSON オブジェクトで、次のメンバーを持てる（§3.1）。

| メンバー | 型 | 意味 |
|---|---|---|
| `type` | URI 参照 | 問題の種類。省略時は `about:blank`（§4.2.1）。`about:blank` のときは、HTTP ステータス以上の意味がないことを表す |
| `status` | 数値（§3.1.2） | HTTP ステータス。**助言**だが、生成側は実際の応答と**同じ値を使わなければならない**（MUST） |
| `title` | 文字列 | 種類の短い要約。同じ `type` なら変えない。`type` が `about:blank` のときは HTTP のステータス句（`Unauthorized` など）にする（SHOULD） |
| `detail` | 文字列 | この発生に固有の説明。人間向け。クライアントが解析するものではない |
| `instance` | URI 参照 | この発生を指す識別子。ログと突き合わせるときに使う |

- 拡張メンバーを足してよい。クライアントは、知らない拡張メンバーを**無視しなければならない**。拡張メンバーは `type` ごとに定義する。
- `type` に `about:blank` 以外を使うときは、そこに人間向けの文書がある URL を置く（URI の参照解決は不要）。
- セキュリティ（§5）: `detail` と拡張メンバーに、内部の実装（SQL、スタックトレース、ファイルパス、依存関係）を出さない。認証の失敗理由を細かく書き分けない（ユーザーの存在が漏れる）。

## Loco の既定との差

Loco 1.3.1 の `Error::into_response` は、本文を `loco_rs::controller::ErrorDetail` で作る（`{"error"?, "description"?, "errors"?}`、`Content-Type: application/json`）。実測した内容:

| 状況 | ステータス | 本文 |
|---|---|---|
| `unauthorized("...")` | 401 | `{"error":"unauthorized","description":"You do not have permission to access this resource"}`（ハンドラーに渡した文言は本文に出ない） |
| 不正な JSON | 400 | `{"error":"Bad Request"}` |
| `Content-Type` が JSON でない | 415 | `{"error":"Bad Request"}` |
| スキーマ不一致 | 422 | `{"error":"Bad Request"}` |
| `bad_request("invalid request")` | 400 | `{"error":"Bad Request","description":"invalid request"}` |
| 未知のルート | 404 | 本文なし |
| 未対応メソッド | 405 | 本文なし、`Allow` あり |

どれも `application/problem+json` ではなく、415 と 422 の本文は 400 の文言になっている（§3.1.2 の「ステータスの一致」の精神にも反する）。本文のない 404 / 405 は RFC 違反ではないが、API としては Problem Details で揃えるほうがクライアントが扱いやすい。

## 実装方針

Loco 1.3.1 には `Error` → 応答の変換を差し替える設定やフックが見当たらない。**全エラー応答を 1 か所で作り替える**。

1. `Initializer`（`src/initializers/`）の `after_routes` で、ルーターに `axum::middleware::map_response` の層を足す。`OpenapiInitializer` と同じ作り。
2. 層は応答のステータスが 400 以上のときだけ働く。本文を `axum::body::to_bytes`（上限付き）で読み、Loco の `ErrorDetail` の形なら Problem Details に作り替える。
   - `status` = 応答のステータス
   - `title` = ステータス句（`StatusCode::canonical_reason()`）、`type` は `about:blank`（独自の種類を持つ場面だけ URL にする）
   - `detail` = `description`（あれば）
   - `errors` = 検証エラーの拡張メンバー（`errors` の元の値）
   - `instance` = `urn:uuid:<x-request-id>`（Loco が付ける `x-request-id` が UUID のとき）。ログとの突き合わせに使える
3. `Content-Type: application/problem+json` にする。`Content-Length` は新しい本文に合わせて付け直す。
4. 401 には `WWW-Authenticate` を付ける（`bearer-jwt.md`）。
5. 本文のない 404 / 405 も Problem Details にする。`Allow` はそのまま残す。
6. HEAD への応答に本文を付けない。
7. 5xx の `detail` は固定文にする（例: `An unexpected error occurred`）。内部情報は `tracing` に出し、`instance` で突き合わせる。

別解: コントローラーが返す独自のエラー型（`IntoResponse` を実装）を使う。ただし `loco_rs::Error` を直接返す既存コードと、axum の `Json` 抽出の失敗（Loco の `Json` が `rejection(Error)` で受ける）は変換されない。層で一括変換するほうが漏れない。

### 検証エラーの形

400 / 422 に拡張メンバー `errors` を持たせる。1 つの形に統一する。RFC 9457 §3 の例は、フィールドを JSON Pointer（RFC 6901）で指す次の形。

```json
{
  "type": "about:blank",
  "title": "Unprocessable Content",
  "status": 422,
  "detail": "Request validation failed",
  "errors": [
    { "pointer": "/email", "detail": "invalid email" }
  ]
}
```

Loco の `ModelValidationErrors`（`{"email":[{"code":"email","message":"invalid email"}]}`）をこの形へ写す。`pointer` は `"/" + フィールド名`。

## OpenAPI への反映

- `dtos::common::ErrorResponse`（Loco の形）を、Problem Details の形の `ProblemDetails` に置き換える（`type`、`title`、`status`、`detail`、`instance`、`errors`）。`ApiError`（`code` / `message`）は使わない。
- すべてのエラー応答に、媒体型 `application/problem+json` を書く。`#[utoipa::path(responses((status = 401, body = ProblemDetails, content_type = "application/problem+json", ...)))]`。
- 401 には `WWW-Authenticate` のヘッダーを書く（`headers(("WWW-Authenticate" = String, description = "..."))`）。
- 返し得る `415` / `429` を足す。
- `openapi/openapi.yaml` を再生成し、フロントエンドの生成物（`orval`）を更新する。`frontend/src/api/effect-fetch.ts` の `HttpError` は `ApiError` の `code` / `message` を読んでいるので、`ProblemDetails` の `status` / `title` / `detail` に合わせて直す。
- Orval の Zod / Effect Schema は `application/problem+json` のレスポンススキーマも生成する。クライアントは `Content-Type` が `application/problem+json` のときだけ `ProblemDetails` として読む。

## 守らないこと（よくある誤り）

- `{"error": "..."}` のような独自の形を作る。
- `status` と実際の HTTP ステータスをずらす。
- `detail` に例外メッセージや SQL をそのまま入れる。
- 成功応答（2xx）に Problem Details を使う。
- RFC 7807 の番号を新しいコードに書く。
