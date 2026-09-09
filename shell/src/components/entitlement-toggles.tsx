import { useFetcher } from "@modern-js/runtime/router";
import { RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ALL_ENTITLEMENTS, ENTITLEMENT_META, type Entitlement } from "@/lib/entitlements";

const same = (a: Entitlement[], b: Entitlement[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

/**
 * The entitlement switches on the Settings page. Toggling posts the full list to
 * the Settings action (`intent=entitlements`), which rewrites the signed cookie
 * and redirects back — a normal navigation re-runs every loader, so the shell
 * and all the federated views re-render with the new grants.
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
  const busy = fetcher.state !== "idle";

  const submit = (next: Entitlement[]) =>
    fetcher.submit({ intent: "entitlements", value: next.join(",") }, { method: "post" });

  const toggle = (e: Entitlement) =>
    submit(current.includes(e) ? current.filter((x) => x !== e) : [...current, e]);

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
              checked={current.includes(e)}
              disabled={busy}
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
        disabled={busy || same(current, personaDefaults)}
        onClick={() => submit(personaDefaults)}
      >
        <RotateCcw className="size-3.5" />
        Reset to {personaLabel} defaults
      </Button>
    </div>
  );
}
