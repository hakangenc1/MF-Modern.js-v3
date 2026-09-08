/**
 * Artificial latency so server-side streaming (Suspense/Await) and skeleton
 * loaders are visibly demonstrated. Set MOCK_LATENCY=0 to disable.
 */
const scale = (() => {
  const raw = typeof process !== "undefined" ? process.env?.MOCK_LATENCY : undefined;
  if (raw === undefined || raw === "") return 1;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 1;
})();

export function delay(ms: number): Promise<void> {
  const wait = Math.round(ms * scale);
  if (wait <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, wait));
}

/** Latency presets (ms) used across the mock API. */
export const LATENCY = {
  instant: 60,
  fast: 250,
  normal: 550,
  slow: 900,
  heavy: 1400,
} as const;
