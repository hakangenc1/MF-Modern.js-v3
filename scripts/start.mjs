// Production orchestrator.
//
// Each app is served from its `modern deploy` output (`.output/index.js`) — a
// self-contained Node server that bundles its own runtime deps. This is the
// path that serves the SSR remote entry (`/bundles/static/*`) correctly, so
// cross-app SSR federation works here, not only in `npm run dev`.
//
// The app-level `serve` script (`modern serve`) is a quick preview only and
// does NOT serve the SSR remote entry — use `npm run start`, or deploy for real.
import { spawn, spawnSync } from "node:child_process";
import http from "node:http";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { APPS, ROOT, PM, PM_ENV, RESET } from "./apps.mjs";

const children = [];

// `.output/` comes from `modern deploy`. Build it if missing; run `npm run build`
// or delete `.output` to force a fresh package.
const ensureBuilt = (app) => {
  if (existsSync(join(ROOT, app.name, ".output", "index.js"))) return;
  console.log(`${app.color}[${app.name}]${RESET} no .output — running \`modern deploy\`…`);
  const r = spawnSync(PM, ["run", "deploy"], {
    cwd: join(ROOT, app.name),
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...PM_ENV, NODE_ENV: "production", MODERN_MF_AUTO_CORS: "true" },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

const run = (app) => {
  const child = spawn(process.execPath, [join(ROOT, app.name, ".output", "index.js")], {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      NODE_ENV: "production",
      FORCE_COLOR: "1",
      PORT: String(app.port),
      // Let each remote answer the browser's cross-origin fetch for its
      // mf-manifest.json / remoteEntry.js / chunks (client-side federation +
      // SPA navigation). The plugin only adds the CORS header when this is set.
      MODERN_MF_AUTO_CORS: "true",
    },
  });
  const prefix = `${app.color}[${app.name}]${RESET} `;
  child.stdout.on("data", (d) => process.stdout.write(prefix + d));
  child.stderr.on("data", (d) => process.stderr.write(prefix + d));
  children.push(child);
};

const ping = (port) =>
  new Promise((res) => {
    const r = http.get({ host: "127.0.0.1", port, path: "/", timeout: 3000 }, (x) => (x.resume(), res(true)));
    r.on("error", () => res(false));
    r.on("timeout", () => (r.destroy(), res(false)));
  });

const shutdown = () => {
  for (const c of children) try { c.kill("SIGTERM"); } catch {}
  setTimeout(() => process.exit(0), 400);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

if (!process.env.SESSION_SECRET) {
  console.log(
    "\n  note: SESSION_SECRET / *_ORIGIN are unset — using localhost + demo defaults.\n" +
      "  Set them to mirror a real deployment. See docs/DEPLOYMENT.md.\n",
  );
}

for (const app of APPS) ensureBuilt(app);
for (const app of APPS.filter((a) => a.remote)) run(app);
for (let i = 0; i < 60; i++) {
  if ((await Promise.all(APPS.filter((a) => a.remote).map((a) => ping(a.port)))).every(Boolean)) break;
  await new Promise((r) => setTimeout(r, 1000));
}
console.log("Remotes up → starting shell on http://localhost:3000");
run(APPS.find((a) => !a.remote));
