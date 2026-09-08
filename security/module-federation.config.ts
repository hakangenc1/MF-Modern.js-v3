import { createModuleFederationConfig } from "@module-federation/modern-js-v3";

// security composes the twofactor widget on its /security/two-factor page.
const twofactorOrigin = process.env.TWOFACTOR_ORIGIN ?? "http://localhost:3004";

export default createModuleFederationConfig({
  name: "security",
  dts: false,
  filename: "static/remoteEntry.js",
  manifest: { filePath: "static" },
  exposes: {
    "./SecurityView": "./src/federation/SecurityView.tsx",
    "./TwoFactorView": "./src/federation/TwoFactorView.tsx",
    "./DevicesView": "./src/federation/DevicesView.tsx",
    "./SessionsView": "./src/federation/SessionsView.tsx",
    "./SecurityStatusCard": "./src/federation/SecurityStatusCard.tsx",
    "./data": "./src/federation/data.ts",
  },
  remotes: {
    twofactor: `twofactor@${twofactorOrigin}/static/mf-manifest.json`,
  },
  shared: {
    react: { singleton: true, requiredVersion: false },
    "react-dom": { singleton: true, requiredVersion: false },
  },
});
