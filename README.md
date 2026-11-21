# Welcome to Loco :train:

[Loco](https://loco.rs) is a web and API framework running on Rust.

This is the **SaaS starter** which includes a `User` model and authentication based on JWT.
It also include configuration sections that help you pick either a frontend or a server-side template set up for your fullstack server.


## Quick Start

```sh
cargo loco start
```

```sh
$ cargo loco start
Finished dev [unoptimized + debuginfo] target(s) in 21.63s
    Running `target/debug/myapp start`

    :
    :
    :

controller/app_routes.rs:203: [Middleware] Adding log trace id

                      ▄     ▀
                                 ▀  ▄
                  ▄       ▀     ▄  ▄ ▄▀
                                    ▄ ▀▄▄
                        ▄     ▀    ▀  ▀▄▀█▄
                                          ▀█▄
▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄▄▄ ▀▀█
 ██████  █████   ███ █████   ███ █████   ███ ▀█
 ██████  █████   ███ █████   ▀▀▀ █████   ███ ▄█▄
 ██████  █████   ███ █████       █████   ███ ████▄
 ██████  █████   ███ █████   ▄▄▄ █████   ███ █████
 ██████  █████   ███  ████   ███ █████   ███ ████▀
   ▀▀▀██▄ ▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀ ██▀
       ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
                https://loco.rs

environment: development
   database: automigrate
     logger: debug
compilation: debug
      modes: server

listening on http://localhost:5150
```

## Full Stack Serving

You can check your [configuration](config/development.yaml) to pick either frontend setup or server-side rendered template, and activate the relevant configuration sections.


## Getting help

Check out [a quick tour](https://loco.rs/docs/tutorials/the-tour/) or [build your first app](https://loco.rs/docs/tutorials/your-first-app/).

## Local services

開発用の PostgreSQL は Docker Compose で起動する。アプリ本体はホストの `cargo loco start` で動かす。

```sh
docker compose up -d db
```

既定の `DATABASE_URL`（`config/development.yaml`）がそのまま接続できる。Redis が必要なときは `extras` プロファイルを指定する。

```sh
docker compose --profile extras up -d
```

## ログイン（Clerk）

ログインは [Clerk](https://clerk.com) に任せている。パスワード、確認メール、再設定は backend に無く、メール送信の設定（SMTP）も要らない。backend は、ブラウザが付けてくる Clerk のセッショントークン（RS256 の JWT）を検証するだけで、秘密鍵や API キーは持たない。

設定する値は、Clerk ダッシュボード（API keys）の **publishable key** 1 つで、backend と frontend が同じ変数 `CLERK_PUBLISHABLE_KEY` を読む。公開してよい値で、トークンの発行元（issuer）と公開鍵の URL（`<issuer>/.well-known/jwks.json`）はここから決まる。

```sh
export CLERK_PUBLISHABLE_KEY=pk_test_...
cargo loco start                      # backend
cd frontend && pnpm dev               # frontend（同じシェルで起動する）
```

- 未設定でも backend は起動する（ログインだけ無効で、認証が要る API は 500 を返す）。production は未設定だと起動しない。
- Clerk 独自ドメインを使うときだけ `CLERK_ISSUER` を足す。`CLERK_AUTHORIZED_PARTIES`（フロントのオリジン。カンマ区切り）を足すと、トークンの `azp` も検証する。production では設定を勧める。
- 既定のセッショントークンにはメールアドレスも名前も入らない。保存したいときは Clerk ダッシュボードの Sessions → Customize session token に `{"email": "{{user.primary_email_address}}", "name": "{{user.full_name}}"}` を足す。無くても動く（画面には「—」を出す）。
- 最初の API リクエストで `users` テーブルに行が作られる。Clerk 側でユーザーを消しても、この行は残る（`cargo loco task user:delete pid:... force:true` で消す）。
- Docker では publishable key をビルド引数で渡す: `docker build --build-arg CLERK_PUBLISHABLE_KEY=pk_live_... .`。実行時にも同じ変数と `DATABASE_URL` が要る。

## Frontend と backend を並べて開発する

ターミナルを 2 つ使い、それぞれ起動する。

```sh
# 1: backend（http://localhost:5150）
docker compose up -d db
cargo loco start

# 2: frontend（http://localhost:5173）
cd frontend && pnpm dev
```

ブラウザは <http://localhost:5173> を開く。`frontend/vite.config.ts` の dev server proxy が `/api/*` を backend に転送するため、CORS 設定は不要。backend のポートを変えるときは、両方のターミナルで同じ `PORT` を渡す（例: `PORT=5151`）。
