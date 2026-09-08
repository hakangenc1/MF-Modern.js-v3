import { createModuleFederationConfig } from "@module-federation/modern-js-v3";

export default createModuleFederationConfig({
  name: "accounts",
  dts: false,
  filename: "static/remoteEntry.js",
  manifest: { filePath: "static" },
  exposes: {
    "./AccountsView": "./src/federation/AccountsView.tsx",
    "./AccountDetailView": "./src/federation/AccountDetailView.tsx",
    "./BudgetsView": "./src/federation/BudgetsView.tsx",
    "./StatementsView": "./src/federation/StatementsView.tsx",
    "./TransactionDetail": "./src/federation/TransactionDetail.tsx",
    "./widgets": "./src/federation/widgets.tsx",
    "./data": "./src/federation/data.ts",
  },
  shared: {
    react: { singleton: true, requiredVersion: false },
    "react-dom": { singleton: true, requiredVersion: false },
  },
});
