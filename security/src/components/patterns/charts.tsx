import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { CashflowPoint, SpendingSlice } from "@/mock";
import { formatCurrency } from "@/mock";

const money = (v: number) => formatCurrency(v, { compact: true });

/* ------------------------------------------------ cashflow (income vs spend) */

// Income and spending are literally +/- flows, so they carry the money ink
// (muted green / red) — everything else in the chart is greyscale.
const cashflowConfig = {
  income: { label: "Income", color: "var(--pos)" },
  spending: { label: "Spending", color: "var(--neg)" },
} satisfies ChartConfig;

export function CashflowChart({ data }: { data: CashflowPoint[] }) {
  return (
    <ChartContainer id="cashflow" config={cashflowConfig} className="aspect-auto h-[240px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fill-income" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-income)" stopOpacity={0.12} />
            <stop offset="100%" stopColor="var(--color-income)" stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="fill-spending" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-spending)" stopOpacity={0.12} />
            <stop offset="100%" stopColor="var(--color-spending)" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.5} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          width={48}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => money(Number(v))}
        />
        <ChartTooltip
          content={<ChartTooltipContent formatter={(value, name) => (
            <div className="flex w-full items-center justify-between gap-3">
              <span className="text-muted-foreground capitalize">{name}</span>
              <span className="font-mono font-medium tabular-nums">{formatCurrency(Number(value))}</span>
            </div>
          )} />}
        />
        <Area
          dataKey="income"
          type="monotone"
          stroke="var(--color-income)"
          fill="url(#fill-income)"
          strokeWidth={2}
        />
        <Area
          dataKey="spending"
          type="monotone"
          stroke="var(--color-spending)"
          fill="url(#fill-spending)"
          strokeWidth={2}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}

/* ------------------------------------------------ spending by category (bar) */

const spendingConfig = {
  amount: { label: "Spent", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function SpendingBars({ data }: { data: SpendingSlice[] }) {
  const rows = data.slice(0, 7);
  return (
    <ChartContainer id="spending" config={spendingConfig} className="aspect-auto h-[240px] w-full">
      <BarChart data={rows} layout="vertical" margin={{ left: 12, right: 16 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" strokeOpacity={0.5} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="category"
          width={110}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <span className="font-mono font-medium tabular-nums">
                  {formatCurrency(Number(value))}
                </span>
              )}
            />
          }
        />
        <Bar dataKey="amount" fill="var(--color-amount)" radius={4} barSize={18} />
      </BarChart>
    </ChartContainer>
  );
}

/* ------------------------------------------------ balance history sparkline */

/**
 * Hand-authored inline SVG — no recharts. Keeps the accounts list / detail
 * header / dashboard account cards off the recharts chunk entirely. Inherits
 * `currentColor`, so it themes for free.
 */
export function BalanceSparkline({
  history,
  className,
  height = 56,
}: {
  history: number[];
  className?: string;
  height?: number;
}) {
  if (!history || history.length < 2) return null;
  const W = 300;
  const H = height;
  const pad = 2;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const span = max - min || 1;
  const step = (W - pad * 2) / (history.length - 1);
  const pts = history.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (H - pad * 2) * (1 - (v - min) / span);
    return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  const up = history[history.length - 1]! >= history[0]!;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className ?? "h-14 w-full"}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Balance trend, ${up ? "up" : "down"} over the last ${history.length} points`}
    >
      <path
        d={pts.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.55}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ------------------------------------------------------ net-worth area trend */

/**
 * A larger filled trend for the dashboard net-worth panel — line + soft area,
 * hand-authored SVG (no recharts). Stretches to fill its container; inherits
 * `currentColor` so it themes for free.
 */
export function NetWorthTrend({
  history,
  className,
}: {
  history: number[];
  className?: string;
}) {
  if (!history || history.length < 2) return null;
  const W = 600;
  const H = 200;
  const padY = 8;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const span = max - min || 1;
  const step = W / (history.length - 1);
  const pts = history.map((v, i) => {
    const x = i * step;
    const y = padY + (H - padY * 2) * (1 - (v - min) / span);
    return { x, y };
  });
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const up = history[history.length - 1]! >= history[0]!;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className ?? "h-full w-full"}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Net worth trend, ${up ? "up" : "down"} over the last ${history.length} months`}
    >
      <path d={area} fill="currentColor" fillOpacity={0.07} stroke="none" />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.7}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
