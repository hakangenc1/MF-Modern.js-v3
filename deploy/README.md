# Single-box deployment

Runs all five apps + Caddy on one host with Docker Compose. Used for the Oracle
Cloud Always Free VM. The multi-service model (Render, containers, etc.) is in
[`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) — this is the compact version for
one always-on machine.

## Layout

| File | Purpose |
|---|---|
| `Dockerfile` | Shared multi-stage build; context is one app folder. `.output/` runtime image. |
| `docker-compose.yml` | The five apps + `caddy`. Origins baked at build, re-passed at runtime. |
| `Caddyfile` | Auto-HTTPS for `{shell,accounts,payments,security,twofactor}.$BASE_DOMAIN`. |
| `.env.example` | `BASE_DOMAIN` + `SESSION_SECRET`. Copy to `.env` (gitignored). |
| `up.sh` | `git reset --hard origin/main` + rebuild + restart. The redeploy command. |

## First run

```bash
git clone https://github.com/hakangenc1/MF-Modern.js-v3.git northwind-mfe
cd northwind-mfe/deploy
cp .env.example .env
# set BASE_DOMAIN (e.g. <public-ip-with-dots>.sslip.io) and
# SESSION_SECRET=$(openssl rand -hex 32)
docker compose up -d --build
```

Prerequisites: ports 80 + 443 reachable from the internet (cloud firewall/security
list **and** host firewall), and `*.{$BASE_DOMAIN}` resolving to this host.

## Redeploy

```bash
deploy/up.sh
```

Docker layer cache makes source-only rebuilds ~1–2 min per app; the `pnpm install`
layer is reused until a lockfile changes.

## Notes

- **Certs** live in the `caddy_data` volume. Don't `docker compose down -v` unless
  you want to re-issue them (Let's Encrypt rate limits apply).
- **Ephemeral IP:** if `BASE_DOMAIN` is `sslip.io`-based and the host's public IP
  changes (an instance *stop*/start — a reboot keeps it), update `.env` and
  `docker compose up -d --build` (origins are build-time). A reserved public IP
  avoids this.
- **Logs:** `docker compose logs -f shell` (or any service).
- `MODERN_MF_AUTO_CORS=true` is set on every app so the browser can pull remote
  entries cross-origin.
