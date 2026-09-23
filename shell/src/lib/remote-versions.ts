/**
 * Which build of each remote is actually live right now, read the same way
 * Module Federation's own runtime discovers a remote: fetch its
 * `mf-manifest.json` and read `metaData.buildInfo.buildVersion` — a value
 * that comes straight from that remote's own `package.json` "version" at
 * build time, with nothing to wire up.
 *
 * `mf-manifest.json` is served `Cache-Control: no-cache` (see deploy/caddy/
 * Caddyfile), so every call here is a genuine network round trip, not a
 * cache hit — that's the price of it always being live and never stale.
 * Called from `__app/layout.data.ts`'s loader (server-side, on every
 * navigation) because the result is shown *persistently* in the sidebar
 * footer, not tucked behind a click — if it's always on screen, it's worth
 * fetching eagerly so it's part of the first HTML, not a post-hydration
 * flash. Takes plain origin strings (no server-only dependency), so it would
 * also run fine client-side if a future caller needed that.
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
