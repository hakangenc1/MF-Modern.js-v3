# Northwind Bank — SSR Micro‑Frontend Banking App

Four **independent applications** — a host shell and three domain remotes — wired together
at runtime with **Module Federation 2.0** and **server‑side rendered + streamed** into a
single page.

Each folder here is a **standalone project**: its own `package.json` with real version
numbers, its own `node_modules`, its own git repository. There is **no monorepo / pnpm
workspace** — `shell/` could live in a different repo on a different machine and nothing
would change. Shared UI is just shadcn components copied into each app (that's how shadcn
works); it is **not** shipped as a federated module.

```
northwind-mfe/            ← this folder: only orchestration scripts, no code, no node_modules
├── shell/       :3000    ← host. own repo. routing, auth + 2FA, app chrome, /cards, /insights
├── accounts/    :3001    ← remote. own repo. exposes AccountsView, AccountDetailView, widgets, data
├── payments/    :3002    ← remote. own repo. exposes TransferView, PayeesView, ActivityView, QuickTransferCard, data
└── security/    :3003    ← remote. own repo. exposes Security/TwoFactor/Devices/SessionsView, TwoFactorChallenge, data
```

## Docs

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — how the four apps compose, the
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
node scripts/run.mjs install     # or: npm run install:all  — installs all 4 apps
npm run dev                      # boots all 4 (remotes first, then the shell)
```

Open **http://localhost:3000** → any email + password → 2FA code **`123456`**.

| root command | what it does |
|---|---|
| `npm run install:all` | `pnpm install` in each app |
| `npm run dev` | clears caches, boots the 3 remotes one‑by‑one, then the shell (refuses to start if a previous run is still on :3000‑:3003) |
| `npm run stop` | kill a lost `dev`/`start` run whose terminal is gone but whose ports are still held |
| `npm run build` | `modern build` in each app → `dist/` |
| `npm run deploy` | `modern deploy` in each app → `.output/` (self‑contained server) |
| `npm run start` | run each app's `.output/index.js` (production; deploys first if needed) |
| `npm run typecheck` | `tsc --noEmit` in each app |
| `npm run init:git` | turn each app into its own git repository |

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
- **`useId` under streamed SSR.** Modern.js numbers React's `useId` by streamed‑boundary
  position, so a Radix trigger (Popover / Select / Tabs / DropdownMenu) that renders on
  the server hydrates with a different generated id than the client computes —
  "Prop `aria-controls` did not match". Three rules keep every route's SSR HTML free of
  `useId`‑derived ids: charts pass a stable `id` to `ChartContainer` (shadcn's own API);
  the header menus render a static trigger and mount the Radix popover/dropdown after
  hydration; and the two federated views that had a server‑rendered Radix trigger use
  plain controls instead — `TransferView` a native `<select>`, `ActivityView` a `useState`
  segmented toggle. Both pages stay fully server‑rendered.

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
- Modern.js 3.5's client data layer doesn't follow redirects returned from route
  **actions** (only loaders); the auth actions return `{ next }` + `Set-Cookie` and the
  component navigates.
- Parallel Rspack builds can panic (`should mgm exist`) on a stale cache — `dev.mjs` clears
  caches and boots the remotes serially.
- Run **one** dev server at a time. Two concurrent `npm run dev` runs clear and regenerate
  each other's `node_modules/.modern-js` mid‑build, which surfaces as
  `html-rspack-plugin: Can't resolve .modern-js/index/index.html` or
  `Can't find renderBundle index`. `dev.mjs` now aborts if :3000‑:3003 are busy;
  `npm run stop` clears a lost run.
