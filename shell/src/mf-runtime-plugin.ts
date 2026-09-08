import type { ModuleFederationRuntimePlugin } from "@module-federation/modern-js-v3";

/**
 * Resilience for the SSR host.
 *
 * On free hosting the remotes spin down after ~15 min idle. When the shell then
 * SSR-loads a cold remote, the platform returns an HTML "waking up" page instead
 * of the manifest JSON. Two things go wrong without guards:
 *
 *  1. Module Federation's manifest fetch parses that HTML as JSON, throws, and
 *     because the rejection happens in `asyncLoadProcess` (the eager remote
 *     preload) with no catch above it, an *unhandled rejection* can take down the
 *     Node process — a slow cold start becomes a crash loop.
 *  2. Worse: if a bad response is ever accepted, MF caches it as the manifest and
 *     the host keeps 500-ing even after the remote is warm, until it restarts.
 *
 * Guards here:
 *  - a process-level `unhandledRejection` handler so a failed remote never kills
 *    the server;
 *  - a `fetch` hook that retries the manifest/entry a few times (covering a brief
 *    cold start) and refuses any response that isn't JSON, so a wake-up page is
 *    never cached as a manifest;
 *  - `errorLoadRemote` logs which remote failed and lets the route's own error
 *    boundary / fallback take over instead of the error bubbling further.
 */
if (typeof process !== "undefined" && typeof process.on === "function") {
  process.on("unhandledRejection", (reason) => {
    console.error("[shell] unhandledRejection (a remote is likely cold/unreachable):", reason);
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Free-tier remotes cold-start in ~20-40s. Retry across ~40s so the first
// request after an idle period is slow but succeeds, rather than 500-ing.
const RETRY_DELAYS = [0, 1500, 3000, 5000, 6000, 8000, 8000, 8000];

async function resilientFetch(url: string, init?: RequestInit): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < RETRY_DELAYS.length; i++) {
    if (RETRY_DELAYS[i]) await sleep(RETRY_DELAYS[i]!);
    try {
      const res = await fetch(url, init);
      const text = await res.clone().text();
      const looksJson =
        text.trimStart().startsWith("{") || text.trimStart().startsWith("[");
      if (res.ok && looksJson) return res;
      lastErr = new Error(
        `fetch ${url} → ${res.status} / ${
          looksJson ? "json" : "non-json (remote cold, retrying)"
        }`,
      );
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export default function resilientRemotes(): ModuleFederationRuntimePlugin {
  return {
    name: "resilient-remotes",
    // Intercept every manifest / remote-entry fetch MF makes.
    fetch(url: string, options: RequestInit) {
      if (typeof url === "string" && /mf-manifest\.json|remoteEntry\.js/.test(url)) {
        return resilientFetch(url, options);
      }
      return undefined as unknown as Promise<Response>;
    },
    errorLoadRemote(args) {
      console.error(
        `[shell] federation: remote "${args.id}" failed to load (${args.from}):`,
        (args.error as Error)?.message ?? args.error,
      );
      // Let the consuming loader/component handle its own fallback.
      return undefined;
    },
  };
}
