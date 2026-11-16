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

既定の `DATABASE_URL`（`config/development.yaml`）がそのまま接続できる。Redis とメールキャッチャー（<http://localhost:1080>）が必要なときは `extras` プロファイルを指定する。

```sh
docker compose --profile extras up -d
```

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
