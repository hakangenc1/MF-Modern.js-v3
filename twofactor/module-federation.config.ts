import { createModuleFederationConfig } from "@module-federation/modern-js-v3";

export default createModuleFederationConfig({
  name: "twofactor",
  dts: false,
  filename: "static/remoteEntry.js",
  manifest: { filePath: "static" },
  exposes: {
    "./TwoFactorChallenge": "./src/federation/TwoFactorChallenge.tsx",
    "./TwoFactorDialog": "./src/federation/TwoFactorDialog.tsx",
    "./TwoFactorGate": "./src/federation/TwoFactorGate.tsx",
    "./data": "./src/federation/data.ts",
  },
  shared: {
    react: { singleton: true, requiredVersion: false },
    "react-dom": { singleton: true, requiredVersion: false },
  },
});
