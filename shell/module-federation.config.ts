import { createModuleFederationConfig } from "@module-federation/modern-js-v3";

const origin = (name: string, fallbackPort: number) =>
  process.env[`${name.toUpperCase()}_ORIGIN`] ?? `http://localhost:${fallbackPort}`;

export default createModuleFederationConfig({
  name: "shell",
  dts: false,
  remotes: {
    accounts: `accounts@${origin("accounts", 3001)}/static/mf-manifest.json`,
    payments: `payments@${origin("payments", 3002)}/static/mf-manifest.json`,
    security: `security@${origin("security", 3003)}/static/mf-manifest.json`,
  },
  shared: {
    react: { singleton: true, requiredVersion: false },
    "react-dom": { singleton: true, requiredVersion: false },
  },
});
