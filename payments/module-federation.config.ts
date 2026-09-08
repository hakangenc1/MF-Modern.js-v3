import { createModuleFederationConfig } from "@module-federation/modern-js-v3";

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
  shared: {
    react: { singleton: true, requiredVersion: false },
    "react-dom": { singleton: true, requiredVersion: false },
  },
});
