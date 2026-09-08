import {
  formatCurrency,
  formatDate,
  type BudgetProgress,
  type CashflowPoint,
  type SavingsGoal,
  type SpendingSlice,
  type Transaction,
} from "@/mock";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Money, SectionCard } from "@/components/patterns/kit";
import { CashflowChart, SpendingBars } from "@/components/patterns/charts";

/**
 * Dashboard cards owned by the Accounts micro-frontend. Router-free and given
 * already-resolved data — the shell wraps each in <Suspense>/<Await> to stream.
 */

export function CashflowCard({ data }: { data: CashflowPoint[] }) {
  return (
    <SectionCard title="Cash flow" description="Income vs. spending, last 6 months">
      <CashflowChart data={data} />
    </SectionCard>
  );
}

export function SpendingCard({ data }: { data: { slices: SpendingSlice[]; total: number } }) {
  return (
    <SectionCard title="Spending by category" description="Last 30 days">
      <SpendingBars data={data.slices} />
    </SectionCard>
  );
}

export function BudgetSummaryCard({
  rows,
  totalLimit,
  totalSpent,
}: {
  rows: BudgetProgress[];
  totalLimit: number;
  totalSpent: number;
}) {
  const pct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
  const top = [...rows].sort((a, b) => b.pct - a.pct).slice(0, 3);
  return (
    <SectionCard
      title="Budgets"
      description="This month"
      action={
        <Button asChild variant="ghost" size="sm">
          <a href="/budgets">Manage</a>
        </Button>
      }
      bodyClassName="space-y-3"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-semibold tabular-nums">{formatCurrency(totalSpent)}</span>
        <span className="text-sm text-muted-foreground">of {formatCurrency(totalLimit)}</span>
      </div>
      <Progress
        value={Math.min(100, pct)}
        aria-label={`Monthly budget used: ${pct}% of ${formatCurrency(totalLimit)}`}
      />
      <ul className="space-y-1.5 text-sm">
        {top.map((r) => (
          <li key={r.category} className="flex items-center justify-between">
            <span className="text-muted-foreground">{r.category}</span>
            <span
              className="tabular-nums"
              style={{ color: r.spent > r.monthlyLimit ? "var(--neg)" : undefined }}
            >
              {r.pct}%
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

export function SavingsGoalCard({ goal }: { goal: SavingsGoal }) {
  const pct = Math.round((goal.saved / goal.target) * 100);
  return (
    <SectionCard title="Savings goal" description={goal.name} bodyClassName="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-semibold tabular-nums">{formatCurrency(goal.saved)}</span>
        <span className="text-sm text-muted-foreground">of {formatCurrency(goal.target)}</span>
      </div>
      <Progress value={pct} aria-label={`${goal.name} savings goal: ${pct}% funded`} />
      <p className="text-xs text-muted-foreground">{pct}% funded · target {goal.targetDate}</p>
      <Button asChild variant="outline" size="sm" className="w-full">
        <a href="/budgets">Add to goal</a>
      </Button>
    </SectionCard>
  );
}

export function RecentActivityCard({ data }: { data: Transaction[] }) {
  return (
    <SectionCard
      title="Recent activity"
      description="Across all accounts"
      action={
        <Button asChild variant="ghost" size="sm">
          <a href="/accounts">View all</a>
        </Button>
      }
      bodyClassName="p-0"
    >
      <ul className="divide-y">
        {data.map((t) => (
          <li key={t.id} className="flex items-center gap-3 px-5 py-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-[11px] font-medium">
              {t.merchant.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{t.merchant}</p>
              <p className="text-xs text-muted-foreground">
                {t.category} · {formatDate(t.date, "short")}
              </p>
            </div>
            <Money cents={t.amount} colorize showSign className="text-sm font-medium" />
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
