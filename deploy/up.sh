#!/usr/bin/env bash
# Pull latest, rebuild changed images, restart. Run on the VM: deploy/up.sh
set -euo pipefail
cd "$(dirname "$0")"

git -C .. fetch --quiet origin
git -C .. reset --hard origin/main

docker compose build
docker compose up -d --remove-orphans
docker image prune -f >/dev/null || true

echo
docker compose ps
