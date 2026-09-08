import { ShieldAlert, ShieldCheck } from "lucide-react";
import type { SecurityOverview } from "@/mock";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DataList, SectionCard } from "@/components/patterns/kit";

/** Security snapshot card for the shell dashboard. */
export function SecurityStatusCard({ overview }: { overview: SecurityOverview }) {
  const strong = overview.score >= 80;
  return (
    <SectionCard title="Security" description="Account protection status" bodyClassName="space-y-3">
      <div className="flex items-center gap-2">
        {strong ? (
          <ShieldCheck className="size-5 text-[color:var(--pos)]" />
        ) : (
          <ShieldAlert className="size-5 text-[color:var(--warning)]" />
        )}
        <span className="text-2xl font-semibold tabular-nums">{overview.score}</span>
        <span className="text-sm text-muted-foreground">/ 100</span>
      </div>
      <Progress value={overview.score} />
      <DataList
        rows={[
          {
            label: "Two-factor auth",
            value: (
              <span
                className={
                  overview.twoFactorEnabled
                    ? "text-[color:var(--pos)]"
                    : "text-[color:var(--neg)]"
                }
              >
                {overview.twoFactorEnabled ? "On" : "Off"}
              </span>
            ),
          },
          { label: "Recovery codes", value: `${overview.recoveryCodesRemaining} left` },
        ]}
      />
      <Button asChild variant="outline" size="sm" className="w-full">
        <a href="/security">Review security</a>
      </Button>
    </SectionCard>
  );
}
