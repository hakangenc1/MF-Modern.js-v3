// Keep the mock data layer identical across the four data-owning apps.
//
// `shell/src/mock/` is the source of truth. `twofactor` is excluded — it only
// has its own tiny `mock/verify.ts`. `session.ts` is shell-only (the remotes
// have no auth), so it is not in the sync set. Run after editing any mock file:
//
//   node scripts/sync-mock.mjs           # copy shell -> accounts, payments, security
//   node scripts/sync-mock.mjs --check   # exit 1 if any target has drifted
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILES = ["types.ts", "seed.ts", "index.ts", "format.ts", "delay.ts"];
const TARGETS = ["accounts", "payments", "security"];
const check = process.argv.includes("--check");

let drift = 0;
for (const file of FILES) {
  const srcPath = join(root, "shell", "src", "mock", file);
  if (!existsSync(srcPath)) continue;
  const src = readFileSync(srcPath, "utf8");
  for (const app of TARGETS) {
    const dst = join(root, app, "src", "mock", file);
    if (!existsSync(dst)) {
      console.warn(`skip: ${app}/src/mock/${file} does not exist`);
      continue;
    }
    const cur = readFileSync(dst, "utf8");
    if (cur === src) continue;
    drift++;
    if (check) {
      console.error(`drift: ${app}/src/mock/${file}`);
    } else {
      writeFileSync(dst, src);
      console.log(`synced: ${app}/src/mock/${file}`);
    }
  }
}

if (check && drift) {
  console.error(`\n${drift} file(s) out of sync — run: node scripts/sync-mock.mjs`);
  process.exit(1);
}
if (!check) console.log(drift ? `\n${drift} file(s) synced.` : "already in sync.");
