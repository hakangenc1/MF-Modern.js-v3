import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
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

const cashflowConfig = {
  income: { label: "Income", color: "var(--chart-1)" },
  spending: { label: "Spending", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function CashflowChart({ data }: { data: CashflowPoint[] }) {
  return (
    <ChartContainer id="cashflow" config={cashflowConfig} className="aspect-auto h-[240px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fill-income" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-income)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-income)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fill-spending" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-spending)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-spending)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
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

const balanceConfig = {
  balance: { label: "Balance", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function BalanceSparkline({ history }: { history: number[] }) {
  const data = history.map((v, i) => ({ i, balance: v }));
  return (
    <ChartContainer id="balance" config={balanceConfig} className="aspect-auto h-14 w-full">
      <LineChart data={data} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
        <Line
          dataKey="balance"
          type="monotone"
          stroke="var(--color-balance)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
