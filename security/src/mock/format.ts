/** Formatting helpers. Amounts are stored in minor units (cents). */

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const usdNoCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatCurrency(cents: number, opts?: { sign?: boolean; compact?: boolean }): string {
  const value = cents / 100;
  if (opts?.compact) {
    const abs = Math.abs(value);
    const fmt = (n: number, suffix: string) =>
      `${value < 0 ? "-" : ""}$${n.toFixed(n >= 100 ? 0 : 1)}${suffix}`;
    if (abs >= 1_000_000) return fmt(abs / 1_000_000, "M");
    if (abs >= 1_000) return fmt(abs / 1_000, "k");
  }
  const out = usd.format(value);
  if (opts?.sign && cents > 0) return `+${out}`;
  return out;
}

export function formatCurrencyWhole(cents: number): string {
  return usdNoCents.format(cents / 100);
}

export function formatPercent(fraction: number, digits = 2): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

// All date formatting pins `timeZone: "UTC"`. Without it `toLocale*` formats in
// the runtime's zone, so the server (UTC) and the browser render different text
// for the same instant ("Sep 7" vs "Sep 6") and hydration mismatches.
export function formatDate(iso: string, style: "short" | "medium" | "long" = "medium"): string {
  const d = new Date(iso);
  if (style === "short")
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  if (style === "long")
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}
