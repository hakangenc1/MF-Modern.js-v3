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

/** Small tag showing which micro-frontend owns a piece of UI. Router-free. */
export function RemoteTag({ name, port }: { name: string; port: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
      <span className="size-1.5 rounded-full bg-[color:var(--chart-1)]" />
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
    <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {origin ? <RemoteTag {...origin} /> : null}
        </div>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
      {children}
    </h2>
  );
}
