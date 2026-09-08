# syntax=docker/dockerfile:1
#
# Shared build for every Northwind app. The build context is a single app folder
# (deploy/docker-compose.yml sets `context: ../<app>`), so `pnpm run deploy` here
# runs that app's own `modern deploy` and emits a self-contained `.output/` server.
#
# The *_ORIGIN values are consumed at BUILD time — they are baked into each
# remote's `assetPrefix` and into the shell's federated manifest URLs
# (see */modern.config.ts and shell/module-federation.config.ts). Pass the ones
# an app needs as build args; unused args stay empty and are harmless.

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV MODERNJS_DEPLOY=node
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# node-gyp fallback for any dep without an arm64 prebuild
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable

ARG SHELL_ORIGIN=
ARG ACCOUNTS_ORIGIN=
ARG PAYMENTS_ORIGIN=
ARG SECURITY_ORIGIN=
ARG TWOFACTOR_ORIGIN=
ENV SHELL_ORIGIN=$SHELL_ORIGIN \
    ACCOUNTS_ORIGIN=$ACCOUNTS_ORIGIN \
    PAYMENTS_ORIGIN=$PAYMENTS_ORIGIN \
    SECURITY_ORIGIN=$SECURITY_ORIGIN \
    TWOFACTOR_ORIGIN=$TWOFACTOR_ORIGIN

# deps first so the install layer caches across source-only changes
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm run deploy

# ---- runtime ----
FROM node:22-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production
# .output bundles its own runtime deps — no node_modules, no pnpm needed here
COPY --from=build /app/.output ./.output
CMD ["node", ".output/index"]
