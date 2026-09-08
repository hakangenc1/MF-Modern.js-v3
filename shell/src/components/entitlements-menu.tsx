import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ALL_ENTITLEMENTS, type Entitlement } from "@/lib/entitlements";
import { EntitlementToggles } from "./entitlement-toggles";

/**
 * Top-bar control for flipping entitlements live during a demo. Mirrors the
 * card on the Settings page. Radix Popover is mounted only after hydration
 * (same reason as render-stamp.tsx: streaming SSR id-space mismatch).
 */
export function EntitlementsMenu({
  current,
  personaLabel,
  personaDefaults,
}: {
  current: Entitlement[];
  personaLabel: string;
  personaDefaults: Entitlement[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const count = `${current.length}/${ALL_ENTITLEMENTS.length}`;
  const badgeClass =
    "inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";
  const inner = (
    <>
      <SlidersHorizontal className="size-3" />
      <span className="hidden sm:inline">Entitlements</span>
      <span className="font-mono">{count}</span>
    </>
  );

  if (!mounted) {
    return (
      <span className={badgeClass} title="Entitlements">
        {inner}
      </span>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={badgeClass} title="Entitlements">
          {inner}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[24rem]">
        <p className="text-sm font-semibold">Entitlements</p>
        <p className="mt-1 text-xs text-muted-foreground">
          The host normally hands these to the shell. Toggle one and the shell re-renders and
          re-passes the grants to the remote apps — no reload.
        </p>
        <div className="mt-3">
          <EntitlementToggles
            current={current}
            personaLabel={personaLabel}
            personaDefaults={personaDefaults}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
