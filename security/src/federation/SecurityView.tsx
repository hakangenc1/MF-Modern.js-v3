import { AlertTriangle, Info, KeyRound, Laptop, ShieldCheck, Smartphone } from "lucide-react";
import { formatDate, relativeTime, type Device, type SecurityOverview, type SessionEntry } from "@/mock";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/patterns/kit";

export default function SecurityView({
  overview,
  devices,
  sessions,
}: {
  overview: SecurityOverview;
  devices: Device[];
  sessions: SessionEntry[];
}) {
  const tone = overview.score >= 80 ? "var(--pos)" : overview.score >= 60 ? "var(--warning)" : "var(--neg)";

  return (
    <>
      <PageHeader
        origin={{ name: "security", port: 3003 }}
        title="Security"
        description="Protect your account with two-factor authentication and device controls."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Security score</CardTitle>
            <CardDescription>Based on 2FA, password age, and recent activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-3">
              <span className="text-4xl font-semibold tabular-nums" style={{ color: `var(--color-foreground)` }}>
                {overview.score}
              </span>
              <span className="pb-1 text-sm text-muted-foreground">/ 100</span>
              <Badge className="mb-1.5 ml-auto" style={{ backgroundColor: tone, color: "white" }}>
                {overview.score >= 80 ? "Strong" : overview.score >= 60 ? "Fair" : "At risk"}
              </Badge>
            </div>
            <Progress value={overview.score} />
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric
                label="Two-factor"
                value={overview.twoFactorEnabled ? "On" : "Off"}
                ok={overview.twoFactorEnabled}
              />
              <Metric
                label="Password age"
                value={`${Math.round(
                  (Date.now() - new Date(overview.passwordUpdatedAt).getTime()) / 86_400_000,
                )}d`}
                ok={Date.now() - new Date(overview.passwordUpdatedAt).getTime() < 120 * 86_400_000}
              />
              <Metric
                label="Recovery codes"
                value={String(overview.recoveryCodesRemaining)}
                ok={overview.recoveryCodesRemaining >= 5}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Two-factor auth</CardTitle>
            <CardDescription className="capitalize">{overview.method}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck
                className="size-4"
                style={{ color: overview.twoFactorEnabled ? "var(--pos)" : "var(--muted-foreground)" }}
              />
              {overview.twoFactorEnabled ? "Enabled on this account" : "Not enabled"}
            </div>
            <Button asChild variant="outline" className="w-full">
              <a href="/security/two-factor">
                <KeyRound className="size-4" /> Manage 2FA
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Recent security alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {overview.alerts.map((a) => (
              <li key={a.id} className="flex items-start gap-3 py-3">
                {a.level === "warning" ? (
                  <AlertTriangle className="mt-0.5 size-4 text-[color:var(--warning)]" />
                ) : (
                  <Info className="mt-0.5 size-4 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground">{relativeTime(a.at)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SummaryList
          title="Trusted devices"
          href="/security/devices"
          items={devices.slice(0, 3).map((d) => ({
            id: d.id,
            icon: d.kind === "phone" ? Smartphone : Laptop,
            primary: d.name,
            secondary: `${d.location} · ${relativeTime(d.lastActive)}`,
            tag: d.current ? "This device" : d.trusted ? "Trusted" : "Unverified",
          }))}
          total={devices.length}
        />
        <SummaryList
          title="Active sessions"
          href="/security/sessions"
          items={sessions.slice(0, 3).map((s) => ({
            id: s.id,
            icon: Laptop,
            primary: s.browser,
            secondary: `${s.location} · since ${formatDate(s.startedAt, "short")}`,
            tag: s.current ? "Current" : "Active",
          }))}
          total={sessions.length}
        />
      </div>
    </>
  );
}

function Metric({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className="text-lg font-semibold"
        style={{ color: ok ? "var(--pos)" : "var(--neg)" }}
      >
        {value}
      </p>
    </div>
  );
}

function SummaryList({
  title,
  href,
  items,
  total,
}: {
  title: string;
  href: string;
  items: {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    primary: string;
    secondary: string;
    tag: string;
  }[];
  total: number;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <a href={href}>View all ({total})</a>
        </Button>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 py-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                <it.icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{it.primary}</p>
                <p className="truncate text-xs text-muted-foreground">{it.secondary}</p>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {it.tag}
              </Badge>
            </li>
          ))}
        </ul>
        <Separator className="my-2" />
      </CardContent>
    </Card>
  );
}
