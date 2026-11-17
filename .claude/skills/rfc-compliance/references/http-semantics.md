# HTTP の意味論（RFC 9110 / 9111 / 6585）

節番号は RFC 9110（2022 年 6 月）。規範語は原文のまま。

## メソッド

| メソッド | 性質 | このアプリでの意味 |
|---|---|---|
| `GET` / `HEAD` | 安全（§9.2.1）、冪等 | 読み取りのみ。状態を変えない |
| `OPTIONS` | 安全（§9.3.7） | 既定のルーターは 405 を返す（実測）。CORS プリフライトを使うなら応答する |
| `PUT` / `DELETE` | 冪等（§9.2.2） | 同じリクエストを繰り返しても結果が同じ |
| `POST` / `PATCH` | 安全でも冪等でもない | 作成、アクション、部分更新 |

**安全なメソッドで状態を変えない**。クライアント、プロキシ、メールのリンクプレビュー、ウイルススキャナー、プリフェッチは GET を何度でも自動で呼ぶ。GET で「トークンの消費」「検証済みへの更新」「JWT の発行」をすると、リンクを開いただけで・スキャナーが踏んだだけで効果が出る（このアプリはかつて `GET /api/auth/verify/{token}` と `GET /api/auth/magic-link/{token}` がそうだった。今は `POST /api/auth/verify` と `POST /api/auth/magic-link/verify`）。

直し方の定石（このアプリで採った形）:

1. メールのリンクは SPA のページに向け、トークンは **fragment**（`/verify#<token>`、`/magic-link#<token>`）に置く。fragment はサーバーに送られないので、アクセスログにも `Referer` にも残らない。ページは fragment を読んで URL から消し（`frontend/src/auth/tokenFromHash.ts`）、`POST /api/auth/verify` に `{token}` を **本文**で送る（URL はログ・履歴・リファラーに残る。RFC 3986 §7.5）。
2. `verify` を冪等にする: すでに検証済みなら成功を返す（現状どおり）。
3. マジックリンクは、使い捨てトークンを POST で引き換えて JWT を得る。リンクプレビューやスキャナーは JavaScript を実行しないので、ページを取得されただけではトークンは消費されない。引き換えは 1 回限りで、画面側は StrictMode の二重実行でも 1 回しか送らない（`MagicLink.tsx` の `started`）。

## ステータスコード

| 状況 | コード | 付けるもの |
|---|---|---|
| 取得・更新の成功 | `200` | 本文 |
| リソースを作成した | `201`（§15.3.2） | `Location`（作成したリソースの URI。無いと対象 URI が作成物を指すものとして扱われる）。本文は任意 |
| 受け付けたが処理は未了、または結果を明かさない | `202`（§15.3.3） | 本文は任意 |
| 成功して返す本文がない | `204`（§15.3.5） | **本文を付けない**。`Content-Type` も付けない |
| 不正な JSON、不正な構文、必須パラメーターの欠落 | `400` | Problem Details |
| 認証情報がない・無効 | `401`（§15.5.2） | **`WWW-Authenticate`（MUST）** |
| 認証はできているが権限がない | `403` | Problem Details |
| リソースがない | `404` | Problem Details |
| メソッドが未対応 | `405`（§15.5.6） | **`Allow`（MUST）**。axum が自動で付ける |
| `Content-Type` が未対応 | `415`（§15.5.16） | 受け付ける媒体型を `Accept` で示せる（§12.5.1）。Problem Details |
| 前提条件の不一致（`If-Match`） | `412` | |
| 状態が競合している（重複、版違い） | `409` | Problem Details |
| 構文は正しいが意味が不正（検証エラー） | `422`（§15.5.21） | Problem Details に `errors` |
| 前提条件が必須なのに無い | `428`（RFC 6585 §3） | |
| 呼び出しが多すぎる | `429`（RFC 6585 §4） | `Retry-After`（RFC 6585 §4 は MAY、§10.2.3） |
| サーバー側の障害 | `500` / `503` | 内部情報を出さない。`503` には `Retry-After` |

選び方の注意:

- **検証エラーは 400 か 422 か**。RFC 9110 は 422 を「構文は正しいが、含まれる指示を処理できない」と定義する。このアプリの OpenAPI は不正 JSON を 400、スキーマ不一致を 422 としている。Loco のモデル検証（`ModelError::Validation`）は 400 を返す（`loco-rs` の `validation_error_response`）。同じ種類の失敗が経路によって 400 と 422 に割れないよう、どちらかに統一する。**推奨は 422**（`errors` を持たせる）。
- **ステータスと本文を食い違わせない**。実測では 415 と 422 の本文が `{"error":"Bad Request"}`（400 の文言）になっていた。
- **存在の秘匿**: 認証のない相手に、あるリソースが存在することを漏らさないときは、403 ではなく 404 を使ってよい（§15.5.4、§15.5.5）。メールの存否を漏らさないための「常に 200」（`register` / `forgot` / `reset`）は正当な逸脱。ただし**応答の時間差**でも漏れる（存在すれば DB 書き込みとメール送信が走る）。メール送信を非同期のワーカーに回し、応答時間を揃える。
- **`202` と `204`**: `register` / `forgot` などは今 `200` と本文 `null` を返す。結果を明かさない「受付」なら `202`（本文なし）が意味に合う。本文のない `200` を返さない（`null` を返すと、型が `void` の生成クライアントが読めない）。

## ヘッダー

- **`WWW-Authenticate`**（§11.6.1）: 401 に必須。書式は `Bearer realm="wardrowbe"`。エラーの付け方は `bearer-jwt.md`。
- **`Allow`**（§10.2.1）: 405 に必須。axum が付ける。手書きの 405 では自分で付ける。
- **`Location`**（§10.2.2）: 201 に付ける。絶対 URI でも相対参照でもよい。
- **`Retry-After`**（§10.2.3）: 秒数（整数）か HTTP-date。429 / 503 に付ける。
- **`Content-Type`**（§8.3）: 本文の実際の媒体型と一致させる。本文のない応答に付けない。
- **`Vary`**（§12.5.5）: 応答が `Accept` / `Accept-Encoding` / `Authorization` などで変わるなら列挙する。圧縮ミドルウェア（Loco の `compression`）は `Vary: Accept-Encoding` を付ける。認証つきで内容が変わる応答は、キャッシュさせないか `Vary: Authorization` を付ける。
- **`X-` 接頭辞**: RFC 6648 で新規の `X-` ヘッダーは非推奨。Loco が付ける `x-request-id`、`x-powered-by` は既存。新しく作る独自ヘッダーに `X-` を付けない。`x-powered-by: loco.rs` は技術情報を漏らすので、Loco の `powered_by` ミドルウェア（`server.middlewares.powered_by`）で外せる（準拠の要件ではなく衛生）。

## キャッシュ（RFC 9111）

- **トークンを含む応答、個人情報を含む応答**: `Cache-Control: no-store`（§5.2.2.5）。キャッシュは本文を保存してはならなくなる。
- **ユーザー別の応答**: 共有キャッシュに保存させない（`private`、または `no-store`）。`Authorization` つきリクエストへの応答は、`public` / `s-maxage` / `must-revalidate` がない限り共有キャッシュは再利用できない（RFC 9111 §3.5）が、明示するほうが安全。
- **OpenAPI の読み取り API**（`/api-docs/*`）は公開情報なので、短い `max-age` と `ETag` を付けてよい。
- **静的ファイル**（`frontend/dist`）は `tower-http` の `ServeDir` が `Last-Modified` と `Content-Length` を付ける（`ETag` は付けない。tower-http 0.6.11 のソースで確認）。ハッシュ付きファイル名のアセットには `Cache-Control: public, max-age=31536000, immutable`、`index.html` には `no-cache` を付ける（HTML を長くキャッシュさせると、古いアセットを指す）。

## 条件付きリクエスト（更新の競合を防ぐ）

更新 API（`PUT` / `PATCH` / `DELETE`）で「読んでから書く」間の上書きを防ぎたいときは、楽観的ロックを RFC 9110 の機構で表す。

1. 取得応答に `ETag`（強い検証子、例: 版番号を含む）を付ける。
2. 更新は `If-Match` を要求する。付いていなければ `428`、一致しなければ `412`。
3. 独自の `version` フィールドを本文に持たせるより、標準のヘッダーを使うほうがクライアント・プロキシの理解が揃う。
4. Loco には `etag` ミドルウェア（`server.middlewares.etag`）がある。API 応答に有効化する前に、どの応答に `ETag` を付けるかを実測で確かめる。

## ページング

現状の `PaginatedResponse` は本文に `page` / `total_pages` などを持つ。これは RFC の違反ではない。ページ遷移をヘッダーで表したいときは `Link` ヘッダー（RFC 8288。`rel="next"` / `"prev"` / `"first"` / `"last"`）を使う。RFC 5988 は置き換え済み。

## 非推奨化と廃止

API を廃止するときは、応答に `Deprecation`（RFC 9745）と `Sunset`（RFC 8594）のヘッダーを付け、移行先を `Link: <...>; rel="successor-version"` で示す。

## 運用上の関連 RFC（任意）

- HSTS（RFC 6797）: 本番を HTTPS で配信するなら `Strict-Transport-Security`。リバースプロキシで付けるか、Loco の `secure_headers` ミドルウェア（`github` / `owasp` のプリセットに `Strict-Transport-Security` と `X-Content-Type-Options: nosniff` などが入っている。`owasp` は全応答に `Cache-Control: no-store` も付けるので、静的ファイルの配信とは相性を確かめる）を使う。
- `/.well-known/security.txt`（RFC 9116）: 脆弱性の報告窓口を公開するとき。
- Cookie（RFC 6265）: JWT の位置を cookie に変える場合は `Secure; HttpOnly; SameSite=Lax` 以上。
