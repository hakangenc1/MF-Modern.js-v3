import { createModuleFederationConfig } from "@module-federation/modern-js-v3";

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
    "./TwoFactorChallenge": "./src/federation/TwoFactorChallenge.tsx",
    "./SecurityStatusCard": "./src/federation/SecurityStatusCard.tsx",
    "./data": "./src/federation/data.ts",
  },
  shared: {
    react: { singleton: true, requiredVersion: false },
    "react-dom": { singleton: true, requiredVersion: false },
  },
});
