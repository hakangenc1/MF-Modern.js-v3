// Production orchestrator — `modern serve` per app.
// NOTE: cross-app SSR federation needs the SSR remote-entry served at
// /bundles/static/ ; see README "Production" for the caveat.
import { spawn } from "node:child_process";
import http from "node:http";
import { join } from "node:path";
import { APPS, ROOT, PM, PM_ENV, RESET } from "./apps.mjs";

const children = [];
const run = (app) => {
  const child = spawn(`${PM} serve`, {
    cwd: join(ROOT, app.name),
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
    env: { ...process.env, ...PM_ENV, NODE_ENV: "production", FORCE_COLOR: "1", PORT: String(app.port) },
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

for (const app of APPS.filter((a) => a.remote)) run(app);
for (let i = 0; i < 60; i++) {
  if ((await Promise.all(APPS.filter((a) => a.remote).map((a) => ping(a.port)))).every(Boolean)) break;
  await new Promise((r) => setTimeout(r, 1000));
}
console.log("Remotes up → starting shell on http://localhost:3000");
run(APPS.find((a) => !a.remote));
