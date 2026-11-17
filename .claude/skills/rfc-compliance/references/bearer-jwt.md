# 認証とトークン（RFC 6750 / 9110 §11 / 7519 / 7518 / 8725）

このアプリは Loco の JWT（`auth::JWT` 抽出子、`Authorization: Bearer <jwt>`）を使う。OAuth 2.0 の認可サーバーではない。

## Bearer の送受信（RFC 6750）

リクエスト（§2.1）:

```
Authorization: Bearer <token>
```

- スキーム名 `Bearer` の大文字小文字は区別しない（RFC 9110 §11.1）。
- トークンは `token68` の文字だけ（英数字と `-._~+/`、末尾に `=`）。JWT は `base64url` + `.` なので満たす。
- **トークンを URL（クエリ・パス）に載せない**。RFC 6750 §2.3 のクエリパラメーター方式は、ログ・履歴・リファラーに残るので使わない。Loco の `auth.jwt.location` の既定（`Authorization: Bearer`）を変えない。cookie に変えるなら `Secure; HttpOnly; SameSite=Lax` 以上を付け、CSRF 対策を別に考える。
- **TLS 必須**（RFC 6750 §5.3）。本番の終端（リバースプロキシ）で HTTPS にする。

応答（§3）。401 は `WWW-Authenticate` が**必須**（RFC 9110 §15.5.2）。

| 状況 | ステータス | `WWW-Authenticate` |
|---|---|---|
| トークンを送っていない | 401 | `Bearer realm="wardrowbe"`（**`error` を付けない**。§3.1 の SHOULD NOT） |
| トークンが無効・期限切れ・署名不一致 | 401 | `Bearer realm="wardrowbe", error="invalid_token", error_description="The access token expired"` |
| リクエストが壊れている（複数の方式で送った、など） | 400 | `Bearer realm="wardrowbe", error="invalid_request"` |
| トークンは有効だが権限（スコープ・ロール）が足りない | 403 | `Bearer realm="wardrowbe", error="insufficient_scope"`（スコープを定義しているときは `scope=`） |

- `realm` は 1 回だけ。`error` の値は上の 3 つだけ（§3.1）。
- `error_description` は人間向けで、ユーザーの存在やトークンの中身を漏らさない。
- **ログイン（`POST /api/auth/login`）の資格情報の誤り**は、本文の資格情報での失敗で、`Authorization` ヘッダーの認証ではない。401 を使うなら `WWW-Authenticate` が MUST なので、`Bearer realm="wardrowbe"` を付ける（このアプリでは 401 を維持する方針）。別のステータスにするなら 400 / 403 のどちらにもできるが、クライアントの分岐が増えるので 401 + チャレンジに揃える。

## トークンを返す応答の扱い

- トークンを本文に含む応答（`POST /api/auth/login`、`GET /api/auth/magic-link/{token}`）には `Cache-Control: no-store`（RFC 9111 §5.2.2.5）。OAuth のトークン応答に `no-store` を必須とする RFC 6749 §5.1 と同じ考え方で、このアプリは認可サーバーではないが流用する。古いクライアントのために `Pragma: no-cache` を足してもよい（任意）。
- ログにトークンを書かない。`tracing` のフィールドに `token` を入れない。

## ワンタイムトークン（メール検証・パスワードリセット・マジックリンク）

- 十分なエントロピー（128 ビット以上の乱数）で、短命にし、使い切りにする。
- **URL のパスに載せる使い方は、GET の副作用の問題と同じ理由で避ける**（RFC 9110 §9.2.1、RFC 3986 §7.5）。メールのリンクは SPA のページ（`/verify/<token>`、`/magic-link/<token>`）を指し、ページが `POST /api/auth/...` の本文でトークンを送る。リンクのプレビューやスキャナーがトークンを消費しない。
- トークンを引き換える POST は冪等にしない（使い切り）。2 回目は 401。

## JWT（RFC 7519、RFC 8725、RFC 7518）

Loco 1.3.1 の `auth::jwt::JWT` は次のとおり（`loco-rs` のソースで確認）。

- 鍵: `auth.jwt.secret` を **標準の base64（パディングあり）としてデコードしたバイト列**。鍵長は文字数ではなく、デコード後のバイト数（文字数の約 3/4。64 バイトなら 86 文字以上）。base64 として不正な文字列では、トークンの生成が失敗する。
- 署名: 既定は **HS512**（HMAC-SHA-512）。受け付けるアルゴリズムは HMAC 系（HS256 / HS384 / HS512）だけで、`none` と非対称鍵は受け付けない。トークンの `alg` がサーバーの設定と違うと `InvalidAlgorithm` で拒否する。
- クレーム: `pid`（ユーザーの識別子）、`exp`。`iss` / `aud` / `sub` / `iat` / `nbf` / `jti` は入れない。受け取った `aud` は、受理しない（`aud` つきのトークンは拒否する）。
- `exp` を必ず検証する（RFC 7519 §4.1.4: 現在時刻が `exp` より前でなければならない）。

準拠のために守ること:

1. **鍵の長さ（RFC 7518 §3.2）**: HMAC には、ハッシュ出力と同じサイズ以上の鍵を使わなければならない（MUST）。HS512 なら **512 ビット（64 バイト）以上**。測るのは、base64 をデコードした後のバイト数。現状の `config/development.yaml` と `config/test.yaml` の `secret` は 20 文字で、デコードすると 15 バイト（120 ビット）にしかならず、HS512 の要件に満たない。本番の `JWT_SECRET` は、デコード後に 64 バイト以上になるランダムな値にする。生成例: `openssl rand -base64 72`（72 バイト、Base64 後 96 文字）。
2. **鍵のエントロピー（RFC 8725 §3.5）**: 人間が覚える文字列を鍵にしない。暗号論的乱数で作る。リポジトリにコミットした秘密鍵は本番で使わない（`config/production.yaml` は環境変数から読む設計で、これを保つ）。
3. **起動時の検査**: 本番の `JWT_SECRET` が 64 バイト未満なら起動を拒否する検査（`Initializer` の `before_run`）を置くと、設定ミスを防げる。
4. **アルゴリズムの固定（RFC 8725 §3.1）**: `alg` はサーバーの設定で固定する。Loco の `JWT` は固定している。独自の検証コードを書くときも、トークンのヘッダーに従わない。
5. **有効期限（RFC 7519 §4.1.4）**: `exp` は必須で、`auth.jwt.expiration`（秒）から作られる。開発の既定は 604800（7 日）で、失効の手段（ログアウト、パスワード変更による失効）がないので長い。本番は短くし、更新の仕組みを別に設計する。
6. **明示的な型付け（RFC 8725 §3.11）**: 同じ鍵で別の種類の JWT（メール確認用など）を発行する場合は、`typ` や用途を区別する。このアプリはメール系を DB のランダムなトークンで扱い、JWT は認証用だけなので該当しない。
7. **RFC 9068（JWT アクセストークンのプロファイル）は適用しない**。OAuth 2.0 の認可サーバーとして `typ: at+jwt`、`iss`、`aud`、`client_id` などを出す場合だけ必要になる。

## 認証失敗のとき情報を漏らさない

- ログインの失敗は、メールの不存在とパスワードの誤りで同じ応答（本文・ステータス・時間）にする。Loco は本文を共通にしている（実測）。応答時間の差（パスワードのハッシュ検証をしない分、不存在のほうが速い）が残るので、不存在のときもダミーのハッシュ検証を行う。
- `register` / `forgot` / `reset` が、メールの有無にかかわらず同じ成功を返すのは、列挙を防ぐための意図的な設計。これは保つ。

## 総当たりの防御

ログイン・パスワードリセット・マジックリンクの要求には、回数制限をかける。超えたら `429` + `Retry-After`（RFC 6585 §4、RFC 9110 §10.2.3）。Loco 1.3.1 の組み込みミドルウェア（`compression`、`cors`、`etag`、`limit_payload`、`logger`、`powered_by`、`remote_ip`、`secure_headers`、`timeout` など）にレート制限はない（ソースで確認）。`tower_governor` などの層を `Initializer` の `after_routes` で足す。
