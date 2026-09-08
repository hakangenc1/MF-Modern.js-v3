# Deployment

A step-by-step runbook for putting the four apps online. Pairs with
[`ARCHITECTURE.md` §08](ARCHITECTURE.md#08--deploy), which covers the topology; this file is
the procedure.

---

## 1. One repo or four?

**You can deploy all four from a single repo. Module Federation does not care how your
source is organised** — it only cares that at runtime each app is a separate running
service reachable at its own URL. "Separate them" is a team-workflow choice, not a
technical requirement.

| | One repo (monorepo) | Four repos (polyrepo) |
|---|---|---|
| Deploy | Point each service at a subfolder (`rootDir: shell`, etc.). One `git push` can redeploy any/all. | Each app has its own repo + its own pipeline. |
| Best when | One person or one team owns everything. **← you** | Separate teams own each domain and release on their own cadence. |
| CI | Path filters (`accounts/**` → build accounts). | Natural — a push to the repo *is* the trigger. |
| Overhead | One `.gitignore`, one PR flow. | Four of everything; version drift between apps to police. |

For this project: **one repo.** The rest of this guide assumes that.

### 1a. Fix the repo layout first (required)

Right now the root repo tracks `shell/ accounts/ payments/ security/` as **git submodule
pointers with no `.gitmodules`** — embedded repos. If you push as-is, GitHub shows four
greyed-out folders and a clone gets **empty directories**. No build platform can deploy
that.

Convert to a plain monorepo — run from the repo root:

```bash
# 1. drop the nested git repos (keeps all the files)
for a in shell accounts payments security; do rm -rf "$a/.git"; done

# 2. remove the submodule pointers from the index
git rm --cached shell accounts payments security

# 3. re-add the folders as normal tracked files
git add shell accounts payments security
git status          # now shows hundreds of new files, incl. each app's pnpm-lock.yaml

# 4. commit
git commit -m "chore: consolidate the four apps into this repo (monorepo layout)"
git push origin main
```

The root `.gitignore` already excludes `node_modules`, `dist`, `.output`, `.modern-js`,
`*.log` at any depth, so the subfolders are covered. **Commit each app's `pnpm-lock.yaml`
and its `patches/` folder** (next section) — the builds use `--frozen-lockfile`.

> Prefer four repos instead? Create four empty GitHub repos, then in each app:
> `git remote set-url origin <that repo>` and `git push`. The root repo then keeps only
> `scripts/`, `docs/`, `README.md`. Skip to [§4](#4-pick-a-host) — everything else is the
> same, just per-repo.

### 1b. The federation patch (already applied — just don't drop it)

Each app carries `patches/@module-federation__modern-js-v3@2.8.2.patch`, referenced from its
`package.json` under `pnpm.patchedDependencies`. `pnpm install` applies it automatically.
It fixes two bugs in the plugin's production SSR static middleware that otherwise break
every deploy:

1. `path.join("/", "/bundles")` returns `\bundles` on Windows, so the SSR remote entry is
   never matched and the shell gets an HTML page instead of JS →
   `Failed to load Node.js entry … Unexpected token '<'`.
2. `Content-Length` was set from the JS string length, not the UTF-8 byte length, so any
   remote chunk containing a non-ASCII byte was **truncated** on the wire →
   `Unexpected token '}'` when the shell evaluates it. (This one bites Linux too.)

If you regenerate `package.json` with `scripts/gen-package-json.mjs`, it re-copies the patch
and re-adds the reference. Don't hand-remove it.

---

## 2. What you are deploying

Four long-lived Node processes. Each one is **`install → build → deploy → run`**:

| Step | Command | Produces |
|---|---|---|
| build | `modern build` (`npm run build` at the root) | `dist/` |
| package | `modern deploy` (`pnpm run deploy` in an app) | `.output/` — a self-contained server that bundles its own runtime deps |
| run | `node .output/index` (`pnpm run start` in an app) | the HTTP server on `$PORT` |

`modern deploy` is the one that matters for federation: it wires each remote's server to
serve its **SSR remote entry** (`/bundles/static/*`), which is what lets the shell
server-render federated regions. `modern serve` is a quick preview and does **not** do
this — don't use it as your production server.

```mermaid
flowchart LR
    U["browser"] --> SH

    subgraph cloud [" "]
        SH["shell<br/>:3000 · SSR host"]
        AC["accounts<br/>:3001"]
        PY["payments<br/>:3002"]
        SC["security<br/>:3003"]
    end

    SH -. "fetches /static/mf-manifest.json<br/>at render time" .-> AC & PY & SC
    AC & PY & SC -. "serve their own hashed JS/CSS/font" .-> U
```

The browser loads a page from **shell** only. The shell's server fetches each remote's
manifest to know which chunks to embed; the browser then pulls those chunks **directly from
each remote's origin** — which is why every remote must be publicly reachable and must know
its own public URL (`assetPrefix`).

### Environment variables

| Variable | shell | accounts | payments | security | Value |
|---|:--:|:--:|:--:|:--:|---|
| `PORT` | ✓ | ✓ | ✓ | ✓ | Injected by the host. `node .output/index` binds it. |
| `SHELL_ORIGIN` | ✓ | | | | Public URL of the shell, e.g. `https://northwind.example`. |
| `ACCOUNTS_ORIGIN` | ✓ | ✓ | | | Public URL of the accounts service. Shell uses it to build the manifest URL; accounts uses it as its own `assetPrefix`. |
| `PAYMENTS_ORIGIN` | ✓ | | ✓ | | …same, payments. |
| `SECURITY_ORIGIN` | ✓ | | | ✓ | …same, security. |
| `SESSION_SECRET` | ✓ | ✓ | | ✓ | HMAC key for the session cookie. **Must be identical** on shell, accounts, security. Generate 32+ random bytes. |

Every `*_ORIGIN` must be a full origin with scheme and **no trailing slash**:
`https://northwind-accounts.onrender.com`. Without it a remote falls back to
`http://localhost:<port>` and its assets 404 in production.

---

## 3. Dry run locally in production mode

Do this before touching a cloud platform — it catches 90% of deploy failures on your own
machine.

```bash
# from the repo root — package all four (→ .output/ each; runs modern build too)
npm run deploy

# run all four from their .output/, with the wiring set explicitly
SESSION_SECRET=$(openssl rand -hex 32) \
SHELL_ORIGIN=http://localhost:3000 \
ACCOUNTS_ORIGIN=http://localhost:3001 \
PAYMENTS_ORIGIN=http://localhost:3002 \
SECURITY_ORIGIN=http://localhost:3003 \
npm run start
```

`npm run start` runs each app's `.output/index.js` (and runs `modern deploy` first for any
app that has no `.output/` yet). Open `http://localhost:3000`, sign in (any email +
password, 2FA `123456`), and click through every menu.

Verify SSR **including the federated regions** — view source on `/` and confirm the
dashboard's federated widgets are in the HTML:

```bash
curl -s http://localhost:3000/ -H "cookie: <a valid bank_session>" | grep -o "Recent activity"
```

(Easier: DevTools → Network → the document response → the markup contains `$128,032.02`,
`Everyday Checking`, transaction rows, *and* the quick-transfer card — not just the shell
chrome.) If a federated block is missing from the HTML, the patch in [§1b](#1b-the-federation-patch-already-applied--just-dont-drop-it)
isn't applied — `pnpm install` in that app and rebuild.

Windows PowerShell equivalent for the env vars:

```powershell
$env:SESSION_SECRET="<32-byte hex>"; $env:SHELL_ORIGIN="http://localhost:3000"
$env:ACCOUNTS_ORIGIN="http://localhost:3001"; $env:PAYMENTS_ORIGIN="http://localhost:3002"
$env:SECURITY_ORIGIN="http://localhost:3003"; npm run start
```

---

## 4. Pick a host

The app is **four always-on Node servers**. Anything that runs a persistent Node process
works. It is **not** a static site and **not** a good fit for pure edge/serverless without
adapter work.

| Host | Why | Notes |
|---|---|---|
| **Render** | Multiple services from one repo, `rootDir` per service, free TLS, zero Docker. **Recommended starting point.** | [§5](#5-path-a--render) |
| **Railway** | Same shape as Render, monorepo-aware. | Set "Root Directory" per service. |
| **Fly.io / Cloud Run / AWS App Runner / Azure Container Apps** | Container hosts — most portable, scale to zero (Cloud Run). | Use the Dockerfile in [§6](#6-path-b--docker-any-container-host). |
| **Vercel / Netlify** | Possible via Modern.js deploy adapters, one project per app. | The SSR-streaming + cross-origin federation story is rougher on serverless; only if you already live there. |

---

## 5. Path A — Render

### 5.1 Manual (clearest — do this first time)

Create the **remotes first**, then the shell (the shell needs their URLs).

**For each of `accounts`, `payments`, `security`:**

1. Render Dashboard → **New → Web Service** → connect the GitHub repo.
2. **Root Directory**: `accounts` (resp. `payments`, `security`).
3. **Runtime**: Node. **Build Command**:
   ```
   corepack enable && corepack pnpm install --frozen-lockfile && corepack pnpm run deploy
   ```
   (`pnpm run deploy` → `modern deploy`. Not bare `pnpm deploy`, which is a different
   built-in pnpm command.)
4. **Start Command**: `node .output/index`
5. **Environment** →
   - `SESSION_SECRET` — same value for accounts + security (payments doesn't need it, but
     setting it everywhere is harmless). Use Render's "Generate" once, then paste the same
     value into the others.
   - Leave `<NAME>_ORIGIN` unset for now.
6. Create the service. Wait for the first deploy. Copy its URL, e.g.
   `https://northwind-accounts.onrender.com`.
7. Go back to **Environment** and add `ACCOUNTS_ORIGIN` = that URL (no trailing slash).
   Save → it redeploys. Repeat the pattern for payments/security.

**Then the shell:**

1. **New → Web Service** → same repo → **Root Directory**: `shell`.
2. Build / Start commands: identical to above.
3. **Environment**:
   - `SESSION_SECRET` — the **same** value as accounts + security.
   - `ACCOUNTS_ORIGIN` = `https://northwind-accounts.onrender.com`
   - `PAYMENTS_ORIGIN` = `https://northwind-payments.onrender.com`
   - `SECURITY_ORIGIN` = `https://northwind-security.onrender.com`
   - `SHELL_ORIGIN` = the shell's own URL (set it after the first deploy, same trick).
4. Deploy. Open the shell URL → sign in → click through.

### 5.2 Blueprint (`render.yaml`)

Commit this at the repo root to create all four in one shot. You still fill the shell's
three `*_ORIGIN` values once the remote URLs exist (Render can't know them at blueprint
time).

```yaml
envVarGroups:
  - name: northwind-shared
    envVars:
      - key: SESSION_SECRET
        generateValue: true          # one value, shared by every service below

services:
  - type: web
    name: northwind-accounts
    runtime: node
    rootDir: accounts
    plan: starter
    buildCommand: corepack enable && corepack pnpm install --frozen-lockfile && corepack pnpm run deploy
    startCommand: node .output/index
    envVars:
      - fromGroup: northwind-shared
      - key: ACCOUNTS_ORIGIN
        sync: false                  # paste https://northwind-accounts.onrender.com after first deploy

  - type: web
    name: northwind-payments
    runtime: node
    rootDir: payments
    plan: starter
    buildCommand: corepack enable && corepack pnpm install --frozen-lockfile && corepack pnpm run deploy
    startCommand: node .output/index
    envVars:
      - fromGroup: northwind-shared
      - key: PAYMENTS_ORIGIN
        sync: false

  - type: web
    name: northwind-security
    runtime: node
    rootDir: security
    plan: starter
    buildCommand: corepack enable && corepack pnpm install --frozen-lockfile && corepack pnpm run deploy
    startCommand: node .output/index
    envVars:
      - fromGroup: northwind-shared
      - key: SECURITY_ORIGIN
        sync: false

  - type: web
    name: northwind-shell
    runtime: node
    rootDir: shell
    plan: starter
    buildCommand: corepack enable && corepack pnpm install --frozen-lockfile && corepack pnpm run deploy
    startCommand: node .output/index
    envVars:
      - fromGroup: northwind-shared
      - key: SHELL_ORIGIN
        sync: false
      - key: ACCOUNTS_ORIGIN
        sync: false
      - key: PAYMENTS_ORIGIN
        sync: false
      - key: SECURITY_ORIGIN
        sync: false
```

Render Dashboard → **New → Blueprint** → pick the repo. After the first deploy, fill the
five `sync: false` values with the real URLs and let it redeploy.

---

## 6. Path B — Docker (any container host)

Add this `Dockerfile` to **each** app folder (`shell/`, `accounts/`, `payments/`,
`security/`):

```dockerfile
# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN corepack pnpm install --frozen-lockfile
COPY . .
RUN corepack pnpm run deploy          # → .output/ (self-contained server)

# ---- run ----
FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/index"]
```

`.output/` bundles its own runtime dependencies, so the run stage needs no `pnpm install`
and no `node_modules` — just Node and the folder.

And a `.dockerignore` next to each:

```
node_modules
dist
.output
.modern-js
*.log
```

Build & run one locally to check:

```bash
cd accounts
docker build -t northwind-accounts .
docker run --rm -p 3001:3001 \
  -e PORT=3001 \
  -e SESSION_SECRET=dev-secret \
  -e ACCOUNTS_ORIGIN=http://localhost:3001 \
  northwind-accounts
```

Then push each image to your registry and deploy:

- **Cloud Run**: `gcloud run deploy northwind-accounts --source ./accounts --set-env-vars ...`
  — one service per app, `--allow-unauthenticated`, scales to zero.
- **Fly.io**: `fly launch` in each folder, `fly secrets set SESSION_SECRET=... ACCOUNTS_ORIGIN=...`.
- **ECS / App Runner / Container Apps**: one task/service per image, same env vars.

`docker-compose.yml` at the repo root for a full local production stack:

```yaml
services:
  accounts: { build: ./accounts, environment: { PORT: 3001, ACCOUNTS_ORIGIN: "http://localhost:3001", SESSION_SECRET: dev }, ports: ["3001:3001"] }
  payments: { build: ./payments, environment: { PORT: 3002, PAYMENTS_ORIGIN: "http://localhost:3002", SESSION_SECRET: dev }, ports: ["3002:3002"] }
  security: { build: ./security, environment: { PORT: 3003, SECURITY_ORIGIN: "http://localhost:3003", SESSION_SECRET: dev }, ports: ["3003:3003"] }
  shell:
    build: ./shell
    environment:
      PORT: 3000
      SHELL_ORIGIN: "http://localhost:3000"
      ACCOUNTS_ORIGIN: "http://localhost:3001"
      PAYMENTS_ORIGIN: "http://localhost:3002"
      SECURITY_ORIGIN: "http://localhost:3003"
      SESSION_SECRET: dev
    ports: ["3000:3000"]
    depends_on: [accounts, payments, security]
```

---

## 7. SSR federation in production — how it works

`modern deploy` wires `@module-federation/modern-js-v3`'s `staticServePlugin` into each
app's `.output/index.js`. That plugin serves the **SSR remote entry** and its chunks from
`.output/bundles/static/*` at `<origin>/bundles/*`. The flow per request:

```mermaid
sequenceDiagram
    participant Sh as shell (.output server)
    participant Ac as accounts (.output server)
    Sh->>Ac: GET /static/mf-manifest.json
    Ac-->>Sh: { ssrRemoteEntry, ssrPublicPath: "<origin>/bundles/" }
    Sh->>Ac: GET /bundles/static/remoteEntry.js   (Node/CJS build)
    Ac-->>Sh: JS  ← staticServePlugin, not the page handler
    Sh->>Ac: GET /bundles/<exposed-chunk>.js
    Ac-->>Sh: JS
    Note over Sh: evaluates ./widgets, ./AccountsView … renders them into the stream
```

So on a normal `node .output/index` deploy the federated regions **are** server-rendered —
view source on `/` shows the real widget markup, not a skeleton. The only prerequisite is
the [§1b](#1b-the-federation-patch-already-applied--just-dont-drop-it) patch (the stock
plugin's middleware is broken); it's already in the repo.

`modern serve` (the app-level `serve` script) is the exception — it does **not** run this
plugin, so federated regions fall back to client rendering there. That's a preview-tool
limitation, not a deploy one. Use `node .output/index` / `npm run start`.

---

## 8. Custom domains & CDN

1. Give each service a subdomain: `app.northwind.example` (shell),
   `accounts.northwind.example`, `payments.…`, `security.…`.
2. Update every `*_ORIGIN` to the custom domains and redeploy.
3. Put a CDN in front (Cloudflare, or the platform's own). Cache rule:
   `*/static/*` and `*/bundles/*` → cache 1 year (filenames are content-hashed and
   immutable). Everything else → bypass / respect origin (the HTML is per-request and
   personalised).
4. TLS everywhere — mixed content breaks federation (the shell on HTTPS cannot pull a
   remote entry over HTTP).

---

## 9. CI/CD

One repo, path-filtered. GitHub Actions sketch — one job per app, only runs if that folder
changed:

```yaml
name: build
on: { push: { branches: [main] } }
jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      accounts: ${{ steps.f.outputs.accounts }}
      payments: ${{ steps.f.outputs.payments }}
      security: ${{ steps.f.outputs.security }}
      shell:    ${{ steps.f.outputs.shell }}
    steps:
      - uses: actions/checkout@v4
      - id: f
        uses: dorny/paths-filter@v3
        with:
          filters: |
            accounts: ['accounts/**']
            payments: ['payments/**']
            security: ['security/**']
            shell:    ['shell/**']
  build:
    needs: changes
    runs-on: ubuntu-latest
    strategy:
      matrix: { app: [accounts, payments, security, shell] }
    if: ${{ needs.changes.outputs[matrix.app] == 'true' }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: corepack enable
      - run: corepack pnpm install --frozen-lockfile
        working-directory: ${{ matrix.app }}
      - run: corepack pnpm run typecheck && corepack pnpm run deploy
        working-directory: ${{ matrix.app }}
```

Render / Railway auto-deploy on push to `main` by default — the Action is your gate
(typecheck + build) before that happens. The compatibility contract between apps is the set
of **exposed module names** and the **shared React major** — both change rarely, both are
worth a review rule.

---

## 10. Deploy order & smoke test

**Order:** remotes first (`accounts`, `payments`, `security` — any order), then `shell`. A
remote coming up after the shell is fine too; the shell fetches manifests per-request, so
it recovers on the next page load.

**Smoke test after every shell deploy:**

| Check | How | Pass |
|---|---|---|
| Shell is up | `curl -I https://<shell>` | `200` |
| Auth | Sign in, 2FA `123456` | lands on dashboard |
| SSR (shell) | View source of `/cards` | real card data in HTML |
| Federation wiring | DevTools Network on `/accounts` | `mf-manifest.json` + chunks load **from the accounts origin**, `200` |
| Remote isolation | Stop the `payments` service, reload `/` | dashboard still renders; only the quick-transfer card degrades |
| Session shared | Sign in on shell, hit `/security` | no re-login (same `SESSION_SECRET`) |

If federation chunks 404: the remote's `*_ORIGIN` is wrong or has a trailing slash. If
`/security` bounces you to login: `SESSION_SECRET` differs between services.

---

*Runbook — update when the host or the federation wiring changes.*
