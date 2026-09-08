import { formatDate, type CashflowPoint, type SpendingSlice, type Transaction } from "@/mock";
import { Button } from "@/components/ui/button";
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
