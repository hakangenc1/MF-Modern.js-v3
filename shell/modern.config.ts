import { appTools, defineConfig } from "@modern-js/app-tools";
import { moduleFederationPlugin } from "@module-federation/modern-js-v3";

const PORT = Number(process.env.PORT || 3000);
// Set SHELL_ORIGIN to a CDN/base URL in production so hashed assets are served
// from there (see README → Deploy). Defaults to same-origin.
const ASSET_PREFIX = process.env.SHELL_ORIGIN ?? process.env.RENDER_EXTERNAL_URL ?? "/";

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  server: {
    port: PORT,
    // Streaming SSR: flush the shell first, stream <Suspense> content as it resolves.
    ssr: { mode: "stream" },
  },
  output: {
    assetPrefix: ASSET_PREFIX,
    // No injected polyfills — the browserslist in package.json is evergreen only.
    // Widen the browserslist and switch to "usage" if you need older browsers.
    polyfill: "off",
    // No client source maps in the production bundle.
    sourceMap: { js: false, css: false },
  },
  performance: {
    // Strip console.* from the production bundles.
    removeConsole: true,
    // Persistent build cache for faster rebuilds.
    buildCache: true,
    // Preload only the font (not every route chunk) so it downloads in parallel
    // with the first CSS/JS instead of being discovered after the CSS parses.
    preload: { type: "all-chunks", include: [/\.woff2$/] },
  },
  html: {
    title: "Northwind Bank",
    // <html lang> is set at runtime by a Helmet tag in the root layout (this
    // Modern.js version's html config has no `lang` key).
    // Replace Modern.js's default mobile viewport (it sets user-scalable=no).
    meta: {
      viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
      "color-scheme": "light dark",
      "theme-color": "#0b0b0f",
      description:
        "Northwind Bank — accounts, transfers, payees, cards and two-factor security in one dashboard.",
    },
  },
  plugins: [appTools(), moduleFederationPlugin()],
});
