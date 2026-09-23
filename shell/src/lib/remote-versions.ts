/**
 * Which build of each remote is actually live right now, read the same way
 * Module Federation's own runtime discovers a remote: fetch its
 * `mf-manifest.json` and read `metaData.buildInfo.buildVersion` — a value
 * that comes straight from that remote's own `package.json` "version" at
 * build time, with nothing to wire up.
 *
 * `mf-manifest.json` is served `Cache-Control: no-cache` (see deploy/caddy/
 * Caddyfile) so this is a genuine network round trip every time, not a
 * memory-cache hit — deliberately: called client-side, on demand, only when
 * someone actually opens the "How this page was rendered" popover, instead
 * of on every server render. It has no server-only dependency (takes plain
 * origin strings, already public and CORS-enabled) so it runs identically
 * in the browser or in a loader.
 */
export interface RemoteVersion {
  name: string;
  version: string | null; // null = unreachable (cold start, deploy in progress, etc.)
}

export async function fetchRemoteVersions(
  remotes: { name: string; origin: string }[],
): Promise<RemoteVersion[]> {
  return Promise.all(
    remotes.map(async ({ name, origin }): Promise<RemoteVersion> => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`${origin}/static/mf-manifest.json`, {
          signal: controller.signal,
        }).finally(() => clearTimeout(timer));
        if (!res.ok) return { name, version: null };
        const manifest = (await res.json()) as {
          metaData?: { buildInfo?: { buildVersion?: string } };
        };
        return { name, version: manifest.metaData?.buildInfo?.buildVersion ?? null };
      } catch {
        return { name, version: null };
      }
    }),
  );
}
