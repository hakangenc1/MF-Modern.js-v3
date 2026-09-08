import { ShieldCheck, ShieldAlert } from "lucide-react";
import type { SecurityOverview } from "@/mock";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

/** Security snapshot card for the shell dashboard. */
export function SecurityStatusCard({ overview }: { overview: SecurityOverview }) {
  const strong = overview.score >= 80;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Security</CardTitle>
        <CardDescription>Account protection status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
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
        <ul className="space-y-1 text-sm">
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">Two-factor auth</span>
            <span className={overview.twoFactorEnabled ? "text-[color:var(--pos)]" : "text-[color:var(--neg)]"}>
              {overview.twoFactorEnabled ? "On" : "Off"}
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-muted-foreground">Recovery codes</span>
            <span>{overview.recoveryCodesRemaining} left</span>
          </li>
        </ul>
        <Button asChild variant="outline" className="w-full">
          <a href="/security">Review security</a>
        </Button>
      </CardContent>
    </Card>
  );
}
