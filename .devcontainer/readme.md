# Loco devcontainer

VS Code でこのアプリを Docker 上で開発するための設定。元は [loco-rs/loco-devcontainer](https://github.com/loco-rs/loco-devcontainer) で、このリポジトリでは通常のディレクトリとして管理している。

## 構成

- `app`: Rust 開発コンテナ。`target/` は名前付きボリューム `cargo-target`（`CARGO_TARGET_DIR=/cargo-target`）に置く。
- `db`: PostgreSQL。devcontainer 起動時に自動で上がる。
- `redis` / `mailer`: 既定では起動しない。必要なときだけ手動で起動する。

```sh
docker compose -f .devcontainer/compose.yaml up -d redis mailer
```

メールは `http://localhost:1080` で確認できる。

## VS Code

VS Code Remote は IPv6 に対応していないため、`config/development.yaml` の server の host と binding は `localhost` ではなく `127.0.0.1` にする。
