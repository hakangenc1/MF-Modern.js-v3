// Run one pnpm command in every app, in order. Usage: node scripts/run.mjs <install|build|typecheck>
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { APPS, ROOT, PM, PM_ENV, RESET } from "./apps.mjs";

const cmd = process.argv[2] || "install";
const pnpmArgs = cmd === "install" ? ["install"] : ["run", cmd];

for (const app of APPS) {
  console.log(`\n${app.color}▶ ${app.name}: pnpm ${pnpmArgs.join(" ")}${RESET}`);
  const res = spawnSync(`${PM} ${pnpmArgs.join(" ")}`, {
    cwd: join(ROOT, app.name),
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...PM_ENV, NODE_OPTIONS: "--max-old-space-size=4096" },
  });
  if (res.status !== 0) {
    console.error(`\n${app.color}✗ ${app.name} failed (${cmd})${RESET}`);
    process.exit(res.status || 1);
  }
}
console.log(`\n✓ ${cmd} complete for all ${APPS.length} apps`);
