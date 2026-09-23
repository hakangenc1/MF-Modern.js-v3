#!/usr/bin/env bash
# Pull latest, rebuild changed images, restart. Run on the VM: deploy/up.sh
set -euo pipefail
cd "$(dirname "$0")"

git -C .. fetch --quiet origin
git -C .. reset --hard origin/main

docker compose build
docker compose up -d --remove-orphans
docker image prune -f >/dev/null || true

# Caddyfile is bind-mounted, so `up -d` won't recreate the caddy container just
# because its content changed (only image/service-def changes trigger that) —
# reload it explicitly. Zero-downtime; a no-op if the config didn't change.
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile 2>&1 || true

echo
docker compose ps
