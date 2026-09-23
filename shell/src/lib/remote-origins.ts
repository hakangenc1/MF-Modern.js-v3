/**
 * The browser-reachable origin of each remote — the same resolution the Module
 * Federation config uses (`<NAME>_ORIGIN` env, else the local dev port).
 */
const REMOTES: Record<string, number> = {
  accounts: 3001,
  payments: 3002,
  security: 3003,
  twofactor: 3004,
};

export function remoteList(): { name: string; origin: string }[] {
  return Object.entries(REMOTES).map(([name, port]) => ({
    name,
    origin: process.env[`${name.toUpperCase()}_ORIGIN`] ?? `http://localhost:${port}`,
  }));
}
