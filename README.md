# Northwind Bank — SSR Micro‑Frontend Banking App

**Five independent applications** — a host shell and four domain remotes — wired together at
runtime with **Module Federation 2.0** and **server‑side rendered + streamed** into a single
page.

Each folder here is a **standalone project**: its own `package.json` with real version
numbers, its own `node_modules`. Shared UI is just shadcn components copied into each app
(that's how shadcn works); it is **not** shipped as a federated module.

```
northwind-mfe/            ← this folder: only orchestration scripts, no app code
├── shell/       :3000    ← host. routing, auth + 2FA, app chrome, /cards, /insights,
│                             /budgets, /statements, /notifications, /settings
├── accounts/    :3001    ← remote. exposes AccountsView, AccountDetailView, BudgetsView,
│                             StatementsView, TransactionDetail, widgets, data
├── payments/    :3002    ← remote. exposes TransferView (payee + own-account), PayeesView
│                             (CRUD), ActivityView (scheduled/recurring), QuickTransferCard, data
│                             — composes twofactor in the transfer flow
├── security/    :3003    ← remote. exposes Security/TwoFactor/Devices/SessionsView, data
└── twofactor/   :3004    ← remote. exposes TwoFactorChallenge, TwoFactorDialog, TwoFactorGate, data
                              — the reusable 2FA widget; shell uses it at login, payments before a transfer
```

**Design**: the stock shadcn/ui **black-and-white** palette (neutral base). The only
chromatic tokens are `--destructive`, the money ink (`--pos` / `--neg`, muted green/red)
and the badge status colors; charts are a monochrome ramp. Federated views only use
utility classes that reach the host stylesheet — `shell/src/styles.css` `@source`s the
sibling remotes' `src` so every class ships.

**Loading UX**: a filter chip / action button spins **on itself**; the full-page
navigation treatment (top progress bar + soft blur) fires **only for page-to-page moves**,
never for in-page filtering. Federated views get a `pendingHref` prop; mutations use a
per-control `useFetcher`. See `shell/src/components/patterns/pending.tsx`.

## Docs

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — how the five apps compose, the
  streaming-SSR render path, the federation contract, the performance levers, and the
  deploy topology. Renders on GitHub (Mermaid diagrams).
- **[docs/architecture.html](docs/architecture.html)** — the same reference as a designed,
  single-file page; open it in a browser.
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — step-by-step runbook: repo layout, hosts
  (Render / Docker), env-var wiring, deploy order, smoke tests.
- **[docs/PLAN.md](docs/PLAN.md)** — the original build plan and the dead ends that shaped
  the stack.

## Run everything with one command

**Requires Node 18+.** Each app installs with **pnpm 9.15.4**, provisioned automatically
through **corepack** (bundled with Node) — the version is pinned via each app's
`packageManager` field, so nothing is global and corepack never falls back to a
`pnpm@latest` that older corepack builds can't launch. Run once: `corepack enable`.

```bash
node scripts/run.mjs install     # or: npm run install:all  — installs all 5 apps
npm run dev                      # boots all 5 (remotes first, then the shell)
```

Open **http://localhost:3000** → pick an **entitlement persona** (Premier or Personal) →
2FA code **`123456`**. The persona decides which features the shell unlocks and passes down
to the remotes; flip individual entitlements from **Settings → Entitlements**.
See [`docs/ARCHITECTURE.md` §05a](docs/ARCHITECTURE.md#05a--entitlements).

| root command | what it does |
|---|---|
| `npm run install:all` | `pnpm install` in each app |
| `npm run dev` | clears caches, boots the 4 remotes one‑by‑one, then the shell (refuses to start if a previous run is still on :3000‑:3004) |
| `npm run stop` | kill a lost `dev`/`start` run whose terminal is gone but whose ports are still held |
| `npm run build` | `modern build` in each app → `dist/` |
| `npm run deploy` | `modern deploy` in each app → `.output/` (self‑contained server) |
| `npm run start` | run each app's `.output/index.js` (production; deploys first if needed) |
| `npm run typecheck` | `tsc --noEmit` in each app |
| `npm run init:git` | turn each app into its own git repository |
| `node scripts/sync-mock.mjs` | copy `shell/src/mock/*` → the other 3 data apps (run after editing mock); `--check` fails on drift |
| `node scripts/keep-warm.mjs` | ping every deployed service so free hosting doesn't spin them down (run on a cron) |

Each app also runs on its own — `cd accounts && npm run dev` serves the accounts remote
standalone on :3001 with its own routes.

## Seeing SSR vs CSR

- **Every authed page carries a badge in the header** (`⚡ SSR · 14:32:01`). Click it:
  it shows which app produced the HTML, the Node version and pid it ran on (values that
  can only come from a server), and a **“Show what the server actually sent”** button that
  re‑fetches the current URL and prints the raw text — you'll see `$128,032.02`,
  `Everyday Checking`, transaction rows, etc. *in the HTML*.
- **Federated pages tag their origin** — the Accounts page shows `accounts:3001`, Payments
  shows `payments:3002`, etc. That UI was built and served by a different app and
  server‑rendered into the shell's response.
- **`/insights` is deliberately client‑rendered.** The badge flips to `💻 CSR`, the server
  sends an empty shell, and the numbers are fetched + computed in your browser — calling
  the **same `accounts/data` federated module**, just from the client instead of a loader.
  “View source” on that page shows nothing.
- **Streaming**: the dashboard flushes the shell first, then streams the cash‑flow /
  spending charts and recent‑activity list in through `<Suspense>` / `<Await>` (the mock
  data has artificial latency so the skeleton → content swap is visible).

## Stack

| | |
|---|---|
| Framework | **Modern.js 3.5** (Rspack, React‑Router‑7 file routing) — *not Next.js* |
| Federation | **`@module-federation/modern-js-v3` 2.8.2**, `server.ssr.mode: "stream"` |
| UI | **React 18.3** · **shadcn/ui** (unmodified) · **Tailwind v4** |
| Data | per‑app `src/mock/` — deterministic seeded banking data, HMAC‑cookie session |

Every app pins the same Module Federation version matrix via `pnpm.overrides` in its own
`package.json`, so the singletons (`react`, `react-dom`) negotiate cleanly across apps.

### Federation rules

- `shared`: only `react` + `react-dom`. The **shell owns all routing, data loading and
  streaming**; it imports plain async functions from `<remote>/data` in its loaders and
  renders the remote's **router‑free** presentational components with the resolved data.
- Remote components use `<a href>` / GET `<form>` (never router hooks) so they render
  identically standalone or federated into the shell's SSR stream.
- **One 2FA widget, consumed everywhere.** `twofactor` exposes the challenge/dialog/gate
  once; the **shell** uses it at `/login/verify`, **payments** inside the transfer confirm
  dialog, **security** on `/security/two-factor`. A remote composing another remote — each
  host just sets `TWOFACTOR_ORIGIN` and imports `twofactor/*`. Nothing is re-implemented.
- **Full SPA — even from router-free remotes.** Federated components emit plain `<a href>`
  and GET `<form>` (they can't use router hooks). A single delegated handler in the app
  layout (`shell/src/components/spa-nav.tsx`) upgrades every in-app link click and filter
  submit to `navigate()`, so the whole app navigates without a page reload and no remote
  depends on the router.
- **`useId` under streamed SSR.** Modern.js numbers React's `useId` by streamed‑boundary
  position, so a Radix trigger (Popover / Select / Tabs / DropdownMenu) rendered on the
  server can hydrate with a different generated id — a **dev‑only** `Prop \`aria-controls\`
  did not match` console warning that React reconciles and that does **not** appear in prod
  builds. Header menus + charts still use the mount‑gate / stable‑`id` mitigations; the
  federated views use plain shadcn `Select`/`Tabs`.

## Known limitations

- **Production** uses `modern deploy` → `node .output/index` per app (`npm run start`), not
  `modern serve` — see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Two things it needs:
  - the vendored patch `<app>/patches/@module-federation__modern-js-v3@2.8.2.patch`
    (applied by `pnpm install`) — fixes two bugs in the plugin's SSR static middleware (a
    Windows `path.join`, and a byte‑vs‑string `Content-Length` that truncates chunks). With
    it, `modern deploy` wires `staticServePlugin` and cross‑app **SSR federation works in
    production**.
  - **`MODERN_MF_AUTO_CORS=true`** in each remote's env (set automatically by
    `npm run start`) — so the browser can fetch each remote's manifest cross‑origin for
    client‑side federation + SPA navigation. Without it: `blocked by CORS policy` on every
    load and in‑app navigation dies.
  - `modern serve` (the app‑level `serve` script) is a quick preview only and does **not**
    serve the SSR remote entry — federated regions fall back to CSR there.
- **Federated‑view SSR is partial.** `/` and `/login/verify` server‑render their federated
  content fully. `/payments`, `/security` and its sub‑routes throw a React #419/#421 during
  streaming SSR (`Element type is invalid … undefined`) and **React client‑renders that
  route's content instead** — the pages and every flow (including the transfer + 2FA) work,
  but that content isn't in the first HTML and the errors show in the console. Appears to be
  an ESM/CJS interop edge in `@module-federation/node` for this Modern.js version.
- **Cold free‑tier remotes.** SSR federation needs every remote reachable when the shell
  renders. On free hosting a remote spins down after ~15 min idle and answers with an HTML
  "waking up" page instead of its manifest JSON — so the **first** request after an idle
  period is slow (the host retries the manifest for ~40s while the remote boots — see
  `shell/src/mf-runtime-plugin.ts`) and, if a remote is still cold after that, the shell
  shows a "warming up, retrying" page (`shell/src/routes/error.tsx`) rather than a bare 500.
  Run **`scripts/keep-warm.mjs`** on a ~10‑min cron (a free Render Cron Job works) to keep
  the whole set warm.
- Modern.js 3.5's client data layer doesn't follow redirects returned from route
  **actions** (only loaders); the auth actions return `{ next }` + `Set-Cookie` and the
  component navigates.
- Parallel Rspack builds can panic (`should mgm exist`) on a stale cache — `dev.mjs` clears
  caches and boots the remotes serially.
- Run **one** dev server at a time. Two concurrent `npm run dev` runs clear and regenerate
  each other's `node_modules/.modern-js` mid‑build, which surfaces as
  `html-rspack-plugin: Can't resolve .modern-js/index/index.html` or
  `Can't find renderBundle index`. `dev.mjs` now aborts if :3000‑:3004 are busy;
  `npm run stop` clears a lost run.
