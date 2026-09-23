/**
 * Which build of each remote is actually live right now, read the same way
 * Module Federation's own runtime discovers a remote: fetch its
 * `mf-manifest.json` and read `metaData.buildInfo.buildVersion` — a value
 * that comes straight from that remote's own `package.json` "version" at
 * build time, with nothing to wire up.
 *
 * This is a *second*, UI-only fetch of the same tiny JSON file MF's runtime
 * already fetches to resolve the remote — cheap (a few KB), and it's what
 * lets the "How this page was rendered" popover show real, live proof that
 * accounts/payments/security/twofactor each ship independently.
 */
import { remoteList } from "./remote-origins";

export interface RemoteVersion {
  name: string;
  version: string | null; // null = unreachable (cold start, deploy in progress, etc.)
}

export async function fetchRemoteVersions(): Promise<RemoteVersion[]> {
  return Promise.all(
    remoteList().map(async ({ name, origin }): Promise<RemoteVersion> => {
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
