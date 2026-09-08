import { useEffect, useState } from "react";
import { useFetcher } from "@modern-js/runtime/router";
import { RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  ALL_ENTITLEMENTS,
  ENTITLEMENT_META,
  type Entitlement,
} from "@/lib/entitlements";

const sameSet = (a: Set<string>, b: Set<string>) =>
  a.size === b.size && [...a].every((x) => b.has(x));

/**
 * The entitlement switches. Used in the top-bar popover and on the Settings
 * page. Every change POSTs the full list to the `/entitlements` resource route;
 * React Router then revalidates the app layout loader so the shell + every
 * federated view re-render with the new grants.
 *
 * Local optimistic state (not `fetcher.formData`) is the source of truth while
 * writes are in flight, so toggling several switches quickly chains correctly
 * instead of racing the server round-trips.
 */
export function EntitlementToggles({
  current,
  personaLabel,
  personaDefaults,
}: {
  current: Entitlement[];
  personaLabel: string;
  personaDefaults: Entitlement[];
}) {
  const fetcher = useFetcher();
  const [optimistic, setOptimistic] = useState<Set<string> | null>(null);
  const active = optimistic ?? new Set<string>(current);

  // Drop the optimistic layer once the revalidated loader agrees.
  const currentKey = [...current].sort().join(",");
  useEffect(() => {
    if (optimistic && sameSet(optimistic, new Set(currentKey.split(",").filter(Boolean)))) {
      setOptimistic(null);
    }
  }, [currentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (next: Set<string>) => {
    setOptimistic(next);
    const value = ALL_ENTITLEMENTS.filter((e) => next.has(e)).join(",");
    fetcher.submit({ value }, { method: "post", action: "/entitlements" });
  };

  const toggle = (e: Entitlement) => {
    const next = new Set(active);
    if (next.has(e)) next.delete(e);
    else next.add(e);
    commit(next);
  };

  const isDefault = sameSet(active, new Set(personaDefaults));

  return (
    <div className="space-y-3">
      <ul className="divide-y">
        {ALL_ENTITLEMENTS.map((e) => (
          <li key={e} className="flex items-start justify-between gap-3 py-2.5 first:pt-0">
            <div className="min-w-0">
              <p className="text-sm font-medium">{ENTITLEMENT_META[e].label}</p>
              <p className="text-xs text-muted-foreground">{ENTITLEMENT_META[e].description}</p>
            </div>
            <Switch
              checked={active.has(e)}
              onCheckedChange={() => toggle(e)}
              aria-label={ENTITLEMENT_META[e].label}
            />
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full"
        disabled={isDefault}
        onClick={() => commit(new Set(personaDefaults))}
      >
        <RotateCcw className="size-3.5" />
        Reset to {personaLabel} defaults
      </Button>
    </div>
  );
}
