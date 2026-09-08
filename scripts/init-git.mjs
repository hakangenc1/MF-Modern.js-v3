// Make each app its own independent git repository.
import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { APPS, ROOT, RESET } from "./apps.mjs";

const IGNORE = ["node_modules", "dist", ".modern-js", "@mf-types", "*.tsbuildinfo", "*.log", ".DS_Store", ".env", ".env.local"].join("\n") + "\n";

for (const app of APPS) {
  const dir = join(ROOT, app.name);
  writeFileSync(join(dir, ".gitignore"), IGNORE);
  if (existsSync(join(dir, ".git"))) {
    console.log(`${app.color}• ${app.name} already a repo${RESET}`);
    continue;
  }
  const git = (...a) => spawnSync("git", a, { cwd: dir, stdio: "inherit" });
  git("init", "-q");
  git("add", "-A");
  git(
    "-c", "user.email=dev@northwind.example",
    "-c", "user.name=Northwind",
    "commit", "-q", "-m",
    `chore: init northwind-${app.name} (${app.remote ? "Module Federation remote" : "host shell"})`,
  );
  console.log(`${app.color}✓ ${app.name} → independent git repo${RESET}`);
}
console.log("\nEach app is now its own repository — push them to separate remotes if you like.");
