import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/mock";

/** Signed, tabular currency with semantic color. */
export function Money({
  cents,
  className,
  showSign = false,
  colorize = false,
  compact = false,
}: {
  cents: number;
  className?: string;
  showSign?: boolean;
  colorize?: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "tabular-nums",
        colorize && cents > 0 && "text-[color:var(--pos)]",
        colorize && cents < 0 && "text-[color:var(--neg)]",
        className,
      )}
    >
      {formatCurrency(cents, { sign: showSign, compact })}
    </span>
  );
}

/** Inline spinner. Router-free, sized to match `[&_svg]:size-4` button icons. */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} aria-hidden />;
}

/**
 * A button that shows a spinner (in place of its leading icon) and disables
 * itself while `pending`. Router-free — the host decides what "pending" means
 * (a fetcher state, or a `pendingHref` match).
 */
export function PendingButton({
  pending = false,
  disabled,
  children,
  ...props
}: ButtonProps & { pending?: boolean }) {
  return (
    <Button aria-busy={pending || undefined} disabled={disabled || pending} {...props}>
      {pending ? <Spinner /> : null}
      {children}
    </Button>
  );
}

/** Small tag showing which micro-frontend owns a piece of UI. Router-free. */
export function RemoteTag({ name, port }: { name: string; port: number }) {
  return (
    <span className="font-mono text-[11px] font-normal text-muted-foreground">
      {name}:{port}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  origin,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  origin?: { name: string; port: number };
}) {
  return (
    <div className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {origin ? <RemoteTag {...origin} /> : null}
        </div>
        {description ? (
          <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

/**
 * One figure in a strip of KPIs — a label over a tabular value, no card of its
 * own. Put several in a `grid` / `flex` row inside one panel.
 */
export function StatTile({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums leading-none">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/**
 * Card with an optional header row (title + action) and no forced padding
 * gymnastics. Use instead of assembling Card/CardHeader/CardContent by hand for
 * the common "titled panel" case.
 */
export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={cn("rounded-xl border bg-card text-card-foreground", className)}>
      {title || action ? (
        <div className="flex items-start justify-between gap-3 border-b px-5 py-3.5">
          <div className="min-w-0 space-y-0.5">
            {title ? <p className="text-sm font-semibold leading-none">{title}</p> : null}
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </div>
  );
}

/** Label/value rows sharing a baseline grid — no card per row. */
export function DataList({
  rows,
  className,
}: {
  rows: { label: React.ReactNode; value: React.ReactNode }[];
  className?: string;
}) {
  return (
    <dl className={cn("divide-y text-sm", className)}>
      {rows.map((r, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
          <dt className="text-muted-foreground">{r.label}</dt>
          <dd className="text-right font-medium tabular-nums">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
