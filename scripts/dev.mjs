// Dev orchestrator. Each app is an independent project (own node_modules); this
// just boots them. Remotes start one at a time (parallel Rspack builds can
// panic) and finish their first build before the shell starts.
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import http from "node:http";
import { join } from "node:path";
import { APPS, ROOT, PM, PM_ENV, RESET } from "./apps.mjs";

// Refuse to start if a previous run is still up. Two orchestrators clearing and
// regenerating each other's node_modules/.modern-js mid-build is what produces
// "html-rspack-plugin: Can't resolve .modern-js/index/index.html" and
// "Can't find renderBundle index". One dev server at a time.
const portFree = (port) =>
  new Promise((resolve) => {
    const req = http.get({ host: "127.0.0.1", port, path: "/", timeout: 1500 }, (r) => {
      r.resume();
      resolve(false);
    });
    req.on("error", () => resolve(true));
    req.on("timeout", () => (req.destroy(), resolve(true)));
  });

const busy = [];
for (const app of APPS) if (!(await portFree(app.port))) busy.push(app);
if (busy.length) {
  console.error(
    `\n✗ ports already in use: ${busy.map((a) => `${a.name}:${a.port}`).join(", ")}\n` +
      `  A dev server is still running. Stop it first (Ctrl-C in its terminal, or\n` +
      `  kill the node processes under this folder), then re-run \`npm run dev\`.\n`,
  );
  process.exit(1);
}

// Stale Rspack / Modern.js caches cause a "should mgm exist" panic on restart.
for (const app of APPS) {
  for (const dir of ["node_modules/.cache", "node_modules/.modern-js", "dist"]) {
    rmSync(join(ROOT, app.name, dir), { recursive: true, force: true });
  }
}

const children = [];

function run(app) {
  const child = spawn(`${PM} dev`, {
    cwd: join(ROOT, app.name),
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
    env: { ...process.env, ...PM_ENV, FORCE_COLOR: "1", NODE_OPTIONS: "--max-old-space-size=4096", PORT: String(app.port) },
  });
  const prefix = `${app.color}[${app.name}]${RESET} `;
  const pipe = (stream, out) => {
    let buf = "";
    stream.on("data", (d) => {
      buf += d.toString();
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const l of lines) out.write(prefix + l + "\n");
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on("exit", (code) => process.stdout.write(prefix + `exited (${code})\n`));
  children.push(child);
}

const ping = (port, path) =>
  new Promise((resolve) => {
    const req = http.get({ host: "127.0.0.1", port, path, timeout: 4000 }, (r) => {
      r.resume();
      resolve(r.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => (req.destroy(), resolve(false)));
  });

async function waitReady(port, path, timeoutMs = 150_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await ping(port, path)) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

const shutdown = () => {
  for (const c of children) try { c.kill("SIGTERM"); } catch {}
  setTimeout(() => process.exit(0), 400);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("Starting micro-frontends…\n");
for (const app of APPS.filter((a) => a.remote)) {
  run(app);
  const ok = await waitReady(app.port, "/static/mf-manifest.json");
  console.log(`  ${ok ? "✓" : "!"} ${app.name} on :${app.port}`);
  await new Promise((r) => setTimeout(r, 2000));
}
console.log("\nStarting shell host → http://localhost:3000\n");
run(APPS.find((a) => !a.remote));
