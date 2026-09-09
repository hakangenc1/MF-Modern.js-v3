// One-off: writes a standalone package.json into each app.
import { writeFileSync, copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Vendored dependency patches (see patches/ for the diffs):
//
//  - @module-federation/modern-js-v3 2.8.2: its production SSR static middleware
//    used path.join("/", "/bundles") (→ "\bundles" on Windows, so the SSR remote
//    entry is never matched) and set Content-Length from the JS string length
//    instead of the UTF-8 byte length (→ truncated chunks → "Unexpected token"
//    when the shell evaluates a remote).
//  - @modern-js/runtime 3.5.0: a leftover `console.info("args", …)` debug call in
//    the streamed deferred-loader-data inline script — logs on every navigation
//    with deferred data. Removed.
const PATCHES = {
  "@module-federation/modern-js-v3@2.8.2": "@module-federation__modern-js-v3@2.8.2.patch",
  "@modern-js/runtime@3.5.0": "@modern-js__runtime@3.5.0.patch",
};
const patchedDependencies = Object.fromEntries(
  Object.entries(PATCHES).map(([dep, file]) => [dep, `patches/${file}`]),
);

const common = {
  "@modern-js/runtime": "3.5.0",
  "@module-federation/modern-js-v3": "2.8.2",
  "@hookform/resolvers": "3.10.0",
  "@radix-ui/react-avatar": "1.1.10",
  "@radix-ui/react-checkbox": "1.3.3",
  "@radix-ui/react-collapsible": "1.1.12",
  "@radix-ui/react-dialog": "1.1.15",
  "@radix-ui/react-dropdown-menu": "2.1.16",
  "@radix-ui/react-label": "2.1.8",
  "@radix-ui/react-popover": "1.1.15",
  "@radix-ui/react-progress": "1.1.7",
  "@radix-ui/react-scroll-area": "1.2.10",
  "@radix-ui/react-select": "2.2.6",
  "@radix-ui/react-separator": "1.1.7",
  "@radix-ui/react-slot": "1.2.3",
  "@radix-ui/react-switch": "1.2.6",
  "@radix-ui/react-tabs": "1.1.13",
  "@radix-ui/react-tooltip": "1.2.8",
  "class-variance-authority": "0.7.1",
  clsx: "2.1.1",
  cmdk: "1.1.1",
  "input-otp": "1.4.2",
  "lucide-react": "0.469.0",
  "next-themes": "0.4.6",
  react: "18.3.1",
  "react-dom": "18.3.1",
  "react-hook-form": "7.54.2",
  recharts: "2.15.4",
  sonner: "1.7.4",
  "tailwind-merge": "2.6.0",
  zod: "3.24.1",
};

const devCommon = {
  "@modern-js/app-tools": "3.5.0",
  "@modern-js/tsconfig": "3.5.0",
  "@tailwindcss/postcss": "4.3.3",
  "@types/node": "22.13.0",
  "@types/react": "18.3.12",
  "@types/react-dom": "18.3.1",
  tailwindcss: "4.3.3",
  "tw-animate-css": "1.4.0",
  typescript: "5.9.3",
};

const overrides = {
  "@rspack/core": "2.1.8",
  "react-server-dom-rspack": "0.0.2",
  "@module-federation/runtime-tools": "2.8.2",
  "@module-federation/runtime": "2.8.2",
  "@module-federation/sdk": "2.8.2",
  "@module-federation/enhanced": "2.8.2",
  "@module-federation/node": "2.7.36",
  "@module-federation/bridge-react": "2.8.2",
  "@module-federation/bridge-shared": "2.8.2",
  "@module-federation/dts-plugin": "2.8.2",
  "@module-federation/managers": "2.8.2",
  "@module-federation/manifest": "2.8.2",
  "@module-federation/rspack": "2.8.2",
  react: "18.3.1",
  "react-dom": "18.3.1",
};

const sortObj = (o) =>
  Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));

for (const app of ["shell", "accounts", "payments", "security", "twofactor"]) {
  const pkg = {
    name: `northwind-${app}`,
    version: "1.0.0",
    private: true,
    // Pin the exact pnpm so corepack never resolves `pnpm@latest`.
    packageManager: "pnpm@9.15.4",
    scripts: {
      dev: "modern dev",
      build: "modern build",
      serve: "modern serve",
      deploy: "modern deploy",
      start: "node .output/index",
      typecheck: "tsc --noEmit",
      lint: "tsc --noEmit",
    },
    dependencies: sortObj(common),
    devDependencies: sortObj(devCommon),
    pnpm: { overrides, patchedDependencies },
    // Modern evergreen target — lets Rspack/SWC skip legacy transpilation.
    browserslist: [
      "chrome >= 100",
      "edge >= 100",
      "firefox >= 100",
      "safari >= 15.4",
      "ios_saf >= 15.4",
    ],
  };
  writeFileSync(join(root, app, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
  mkdirSync(join(root, app, "patches"), { recursive: true });
  for (const file of Object.values(PATCHES)) {
    copyFileSync(join(root, "patches", file), join(root, app, "patches", file));
  }
  console.log(`wrote ${app}/package.json + ${Object.keys(PATCHES).length} patch(es)`);
}
