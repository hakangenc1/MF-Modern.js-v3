import { createModuleFederationConfig } from "@module-federation/modern-js-v3";

// payments composes the twofactor widget in its transfer flow (remote → remote).
const twofactorOrigin = process.env.TWOFACTOR_ORIGIN ?? "http://localhost:3004";

export default createModuleFederationConfig({
  name: "payments",
  dts: false,
  filename: "static/remoteEntry.js",
  manifest: { filePath: "static" },
  exposes: {
    "./TransferView": "./src/federation/TransferView.tsx",
    "./PayeesView": "./src/federation/PayeesView.tsx",
    "./ActivityView": "./src/federation/ActivityView.tsx",
    "./QuickTransferCard": "./src/federation/QuickTransferCard.tsx",
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
