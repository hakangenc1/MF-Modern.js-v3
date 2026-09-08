import { appTools, defineConfig } from "@modern-js/app-tools";
import { moduleFederationPlugin } from "@module-federation/modern-js-v3";

const PORT = Number(process.env.PORT || 3002);
// A remote's chunks must load from its own origin, so this has to be an absolute
// URL in production (the service's public host or a CDN).
const ASSET_PREFIX = process.env.PAYMENTS_ORIGIN ?? `http://localhost:${PORT}`;

export default defineConfig({
  server: {
    port: PORT,
    ssr: { mode: "stream" },
  },
  dev: {
    assetPrefix: ASSET_PREFIX,
  },
  output: {
    assetPrefix: ASSET_PREFIX,
    polyfill: "off",
    sourceMap: { js: false, css: false },
  },
  performance: {
    removeConsole: true,
    buildCache: true,
    preload: { type: "all-chunks", include: [/\.woff2$/] },
  },
  html: {
    title: "Northwind · Payments",
    meta: {
      viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
    },
  },
  plugins: [appTools(), moduleFederationPlugin()],
});
