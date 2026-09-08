# Build Plan — Northwind SSR Micro-Frontend

This is the original design plan for the app. The **current** structure (4 standalone
repos, no workspace) is described in [`ARCHITECTURE.md`](ARCHITECTURE.md); this file is
kept for the reasoning and the dead ends that shaped it.

## Goal

A working, professional enterprise **banking** app as a **micro-frontend architecture** on
**Module Federation 2.0**, with **SSR + streaming** (Suspense/Await flushing from the
server, shadcn skeletons), mock data, shadcn/ui only.

## Stack — revised after hitting dead ends

The originally-planned React-Router-v8-framework-mode + `rsbuild-plugin-react-router` +
Module Federation SSR **does not work** in current releases (asyncStartup entry-wrapping
breaks server-build resolution; the plugin's own docs point to Modern.js for MFE). Pivoted
to the Module Federation team's own framework:

- **Modern.js `3.5.0`** (`@modern-js/app-tools`, `@modern-js/runtime`) — Rspack,
  React-Router-7 based file routing, streaming SSR. NOT Next.js.
- **React `18.3.1`** — Modern 3.5 + `@module-federation/modern-js-v3` are validated against
  React 18; shadcn components are the legacy `forwardRef` "new-york" set.
- **`@module-federation/modern-js-v3` `2.8.2`** + `pnpm.overrides` pinning the whole MF
  stack to `2.8.2` / `@rspack/core` `2.1.8` / `react-server-dom-rspack` `0.0.2` (the matrix
  the `module-federation/core` `apps/modernjs-ssr` example resolves to).
- **Tailwind v4** via `@tailwindcss/postcss`.
- **shadcn/ui** legacy `new-york` registry, unmodified, copied into each app.

## Federation rules that made it work

- MF `shared`: **only `react` + `react-dom`** (singletons). Sharing `react-router` /
  `@modern-js/runtime` drags the remote's Modern runtime in and renders a 2nd `<Router>`.
- MF `dts: false` everywhere (the DTS worker crashes the dev server when a remote manifest
  is briefly unreachable).
- **Federated components are router-free / presentational**: plain `<a href>` and GET
  `<form>`, data passed in as props already resolved. The **shell owns all routing + data
  loading + `<Suspense>`/`<Await>` streaming**; it imports plain async fns from
  `<remote>/data` in its `page.data.ts` loaders.
- Remotes also run standalone (their own `src/routes/`) for dev.

## Structure

Shell host + 3 domain remotes, each an independent Modern.js app, each its own git repo.
No pnpm workspace.

| App | Port | Role |
|---|---|---|
| `shell` | :3000 | host — routing, auth/login + 2FA gate, app chrome, `/cards`, `/insights`; composes remotes |
| `accounts` | :3001 | remote — exposes `AccountsView`, `AccountDetailView`, `widgets`, `data` |
| `payments` | :3002 | remote — exposes `TransferView`, `PayeesView`, `ActivityView`, `QuickTransferCard`, `data` |
| `security` | :3003 | remote — exposes `SecurityView`, `TwoFactorView`, `DevicesView`, `SessionsView`, `TwoFactorChallenge`, `SecurityStatusCard`, `data` |

Each app: `modern.config.ts` (port, `ssr.mode:'stream'`, `output.assetPrefix` for remotes,
`moduleFederationPlugin()`), `module-federation.config.ts`, `postcss.config.mjs`,
`src/styles.css`, `src/routes/` (conventional), `src/federation/` (exposed modules),
`src/mock/` (seeded data + HMAC session).

## Status — done

- Auth end to end: login → `/login/verify` (2FA `123456`) → signed cookie → dashboard.
- `accounts` remote: dashboard widgets, `/accounts`, `/accounts/:id` with streamed
  transactions, `/cards`.
- `payments` remote: transfer wizard, payees list + add-payee, activity (scheduled + past),
  `QuickTransferCard`.
- `security` remote: overview (score, streamed devices + sessions), `/security/two-factor`,
  `/security/devices`, `/security/sessions` with revoke actions, `SecurityStatusCard` +
  `TwoFactorChallenge`.
- `dataviz`-validated chart colors, dark mode, empty states, responsive, error boundaries.
- Performance pass — see [`ARCHITECTURE.md` §06](ARCHITECTURE.md#06--performance).
- `git init` per app + this root repo.

## Known limitations

- **Production** (`modern serve`) doesn't serve the SSR remote-entry, so cross-app SSR
  federation works in **dev** but a plain prod deploy falls back to client rendering for
  the federated regions. See [`ARCHITECTURE.md` §08](ARCHITECTURE.md#08--deploy).
- Modern.js 3.5's client data layer doesn't follow redirects from route **actions** (only
  loaders); auth actions return `{ next }` + `Set-Cookie` and the component navigates.
- Run **one** dev server at a time — `dev.mjs` aborts if :3000–:3003 are busy.

## Verify

```bash
npm run dev          # remotes first, then shell → http://localhost:3000
```

- Unauth `/` → `/login`; sign in (any creds); 2FA `123456`; dashboard streams
  skeleton → chart/activity; open an account → transactions stream; run a transfer;
  toggle 2FA.
- **SSR proof**: `curl` a page with the session cookie → real data (account names,
  transactions) in the initial HTML.
- **Federation proof**: network shows `remoteEntry.js` from :3001–:3003; killing a remote
  degrades only its surface.
- `npm run build` + `npm run start`.
