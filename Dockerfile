FROM node:22-bookworm-slim AS frontend
WORKDIR /app
RUN npm install -g pnpm@10.12.4
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml frontend/
RUN pnpm --dir frontend install --frozen-lockfile
COPY frontend frontend
COPY openapi openapi
RUN pnpm --dir frontend build

FROM lukemathwalker/cargo-chef:latest-rust-1 AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS build
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release

FROM gcr.io/distroless/cc-debian12:nonroot
WORKDIR /app
COPY --from=build /app/target/release/wardrowbe-cli /usr/local/bin/server
COPY config config
COPY --from=frontend /app/frontend/dist/client frontend/dist/client
ENV LOCO_ENV=production
ENV PORT=80
ENTRYPOINT ["/usr/local/bin/server", "start"]
