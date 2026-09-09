/**
 * The browser-reachable origin of each remote — the same resolution the Module
 * Federation config uses (`<NAME>_ORIGIN` env, else the local dev port). Used to
 * emit `<link rel="preconnect">` so the client-side federation manifest / entry
 * fetches don't pay a fresh TLS handshake mid-navigation.
 */
const REMOTES: Record<string, number> = {
  accounts: 3001,
  payments: 3002,
  security: 3003,
  twofactor: 3004,
};

export function remoteOrigins(): string[] {
  return Object.entries(REMOTES).map(
    ([name, port]) =>
      process.env[`${name.toUpperCase()}_ORIGIN`] ?? `http://localhost:${port}`,
  );
}
