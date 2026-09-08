import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Remotes first (hosts depend on them), then the shell. `twofactor` is listed
 * before `payments` because payments composes the twofactor widget.
 */
export const APPS = [
  { name: "accounts", port: 3001, color: "\x1b[36m", remote: true },
  { name: "security", port: 3003, color: "\x1b[33m", remote: true },
  { name: "twofactor", port: 3004, color: "\x1b[34m", remote: true },
  { name: "payments", port: 3002, color: "\x1b[35m", remote: true },
  { name: "shell", port: 3000, color: "\x1b[32m", remote: false },
];

export const RESET = "\x1b[0m";

// pnpm, run through corepack. Each app pins its exact pnpm version via the
// "packageManager" field in its own package.json (pnpm@9.15.4 — matches the
// committed lockfileVersion 9.0), so corepack never falls back to `pnpm@latest`
// (a pnpm 12.x that older corepack builds can't launch: they require pnpm.cjs
// and pnpm 12 ships pnpm.mjs → "Cannot find module .../bin/pnpm.cjs").
export const PM = "corepack pnpm";

// Let a clean machine provision that pnpm build with no interactive prompt.
export const PM_ENV = {
  COREPACK_ENABLE_DOWNLOAD_PROMPT: "0",
  COREPACK_ENABLE_AUTO_PIN: "0",
};
