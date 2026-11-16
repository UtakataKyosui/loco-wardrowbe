FROM mcr.microsoft.com/devcontainers/rust:latest

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
     && apt-get -y install --no-install-recommends postgresql-client \
     && rm -rf /var/lib/apt/lists/* \
     && curl -L --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/cargo-bins/cargo-binstall/main/install-from-binstall-release.sh | bash \
     && cargo binstall -y sea-orm-cli cargo-insta \
     && mkdir -p /cargo-target \
     && chown -R vscode /usr/local/cargo /cargo-target

ENV CARGO_TARGET_DIR=/cargo-target

COPY .env /.env
