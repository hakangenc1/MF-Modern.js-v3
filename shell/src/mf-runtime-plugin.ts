import type { ModuleFederationRuntimePlugin } from "@module-federation/modern-js-v3";

/**
 * Resilience for the SSR host.
 *
 * On free hosting the remotes spin down after ~15 min idle. When the shell then
 * SSR-loads a cold remote, the platform returns an HTML "waking up" page instead
 * of the manifest JSON; Module Federation's manifest fetch rejects, and because
 * that rejection happens in `asyncLoadProcess` (the eager remote preload) with no
 * catch above it, an *unhandled rejection* takes down the whole Node process —
 * turning a slow cold start into a 502 crash loop.
 *
 * Two guards:
 *  1. a process-level `unhandledRejection` handler so a failed remote never kills
 *     the server — routes that don't touch that remote keep working;
 *  2. `errorLoadRemote` logs which remote failed and lets the error surface to the
 *     consuming route's error boundary instead of bubbling further.
 */
if (typeof process !== "undefined" && typeof process.on === "function") {
  process.on("unhandledRejection", (reason) => {
    console.error("[shell] unhandledRejection (a remote is likely cold/unreachable):", reason);
  });
}

export default function resilientRemotes(): ModuleFederationRuntimePlugin {
  return {
    name: "resilient-remotes",
    errorLoadRemote(args) {
      console.error(
        `[shell] federation: remote "${args.id}" failed to load (${args.from}):`,
        (args.error as Error)?.message ?? args.error,
      );
      // Re-throw: the consuming loader/component handles its own fallback.
      return undefined;
    },
  };
}
