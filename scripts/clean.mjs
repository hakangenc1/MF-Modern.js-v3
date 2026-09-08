import { rmSync } from "node:fs";
import { join } from "node:path";
import { APPS, ROOT } from "./apps.mjs";

for (const app of APPS) {
  for (const dir of ["dist", "node_modules/.cache", "node_modules/.modern-js"]) {
    rmSync(join(ROOT, app.name, dir), { recursive: true, force: true });
    console.log(`  removed ${app.name}/${dir}`);
  }
}
