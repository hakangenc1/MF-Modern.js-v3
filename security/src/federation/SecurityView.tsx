import { AlertTriangle, Info, KeyRound, Laptop, ShieldCheck, Smartphone } from "lucide-react";
import { formatDate, relativeTime, type Device, type SecurityOverview, type SessionEntry } from "@/mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionCard, StatTile } from "@/components/patterns/kit";

export default function SecurityView({
  overview,
  devices,
  sessions,
  allowAdvanced = true,
}: {
  overview: SecurityOverview;
  devices: Device[];
  sessions: SessionEntry[];
  /** `security.advanced` entitlement — the shell passes this; standalone = true. */
  allowAdvanced?: boolean;
}) {
  const band =
    overview.score >= 80
      ? { label: "Strong", color: "var(--pos)" }
      : overview.score >= 60
        ? { label: "Fair", color: "var(--warning)" }
        : { label: "At risk", color: "var(--neg)" };
  const pwDays = Math.round(
    (Date.now() - new Date(overview.passwordUpdatedAt).getTime()) / 86_400_000,
  );

  return (
    <>
      <PageHeader
        origin={{ name: "security", port: 3003 }}
        title="Security"
        description="Protect your account with two-factor authentication and device controls."
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          title="Security score"
          description="Based on 2FA, password age, and recent activity"
          bodyClassName="space-y-4"
        >
          <div className="flex items-end gap-3">
            <span className="text-4xl font-semibold tabular-nums leading-none">{overview.score}</span>
            <span className="pb-1 text-sm text-muted-foreground">/ 100</span>
            <Badge
              className="mb-1 ml-auto text-white"
              style={{ backgroundColor: band.color }}
            >
              {band.label}
            </Badge>
          </div>
          <Progress value={overview.score} aria-label={`Security score: ${overview.score} out of 100`} />
          <div className="grid gap-4 border-t pt-4 sm:grid-cols-3">
            <StatTile
              label="Two-factor"
              value={
                <span style={{ color: overview.twoFactorEnabled ? "var(--pos)" : "var(--neg)" }}>
                  {overview.twoFactorEnabled ? "On" : "Off"}
                </span>
              }
            />
            <StatTile
              label="Password age"
              value={
                <span style={{ color: pwDays < 120 ? "var(--pos)" : "var(--neg)" }}>{pwDays}d</span>
              }
            />
            <StatTile
              label="Recovery codes"
              value={
                <span
                  style={{
                    color: overview.recoveryCodesRemaining >= 5 ? "var(--pos)" : "var(--neg)",
                  }}
                >
                  {overview.recoveryCodesRemaining}
                </span>
              }
            />
          </div>
        </SectionCard>

        <SectionCard title="Two-factor auth" description={overview.method} bodyClassName="space-y-3">
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
        </SectionCard>
      </div>

      <SectionCard className="mt-4" title="Recent security alerts" bodyClassName="p-0">
        <ul className="divide-y">
          {overview.alerts.map((a) => (
            <li key={a.id} className="flex items-start gap-3 px-5 py-3">
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
      </SectionCard>

      {allowAdvanced ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
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
      ) : null}
    </>
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
    <SectionCard
      title={title}
      action={
        <Button asChild variant="ghost" size="sm">
          <a href={href}>View all ({total})</a>
        </Button>
      }
      bodyClassName="p-0"
    >
      <ul className="divide-y">
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-3 px-5 py-2.5">
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
    </SectionCard>
  );
}
