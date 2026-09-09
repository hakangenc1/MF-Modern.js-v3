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

const originOf = (name: string, port: number) =>
  process.env[`${name.toUpperCase()}_ORIGIN`] ?? `http://localhost:${port}`;

export function remoteOrigins(): string[] {
  return Object.entries(REMOTES).map(([name, port]) => originOf(name, port));
}

export interface RemoteEntry {
  name: string;
  origin: string;
  /** The Module Federation manifest URL — what `loadRemote` / `registerRemotes` needs. */
  manifest: string;
}

/** The four remotes as a registry the client can feed to the MF runtime. */
export function remoteRegistry(): RemoteEntry[] {
  return Object.entries(REMOTES).map(([name, port]) => {
    const origin = originOf(name, port);
    return { name, origin, manifest: `${origin}/static/mf-manifest.json` };
  });
}
