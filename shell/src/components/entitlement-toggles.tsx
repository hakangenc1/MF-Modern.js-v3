import { useFetcher } from "@modern-js/runtime/router";
import { RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  ALL_ENTITLEMENTS,
  ENTITLEMENT_META,
  type Entitlement,
} from "@/lib/entitlements";

/**
 * The entitlement switches. Used in the top-bar popover and on the Settings
 * page. Every change POSTs the full list to the `/entitlements` resource route;
 * React Router then revalidates the app layout loader so the shell + every
 * federated view re-render with the new grants.
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

  // Optimistic: reflect the in-flight submission immediately.
  const pendingValue = fetcher.formData?.get("value");
  const active =
    typeof pendingValue === "string"
      ? new Set(pendingValue.split(",").filter(Boolean))
      : new Set(current);

  const commit = (next: Set<string>) => {
    const value = ALL_ENTITLEMENTS.filter((e) => next.has(e)).join(",");
    fetcher.submit({ value }, { method: "post", action: "/entitlements" });
  };

  const toggle = (e: Entitlement) => {
    const next = new Set(active);
    if (next.has(e)) next.delete(e);
    else next.add(e);
    commit(next);
  };

  const isDefault =
    active.size === personaDefaults.length && personaDefaults.every((e) => active.has(e));

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
