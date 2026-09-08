import { formatDate, type CashflowPoint, type SpendingSlice, type Transaction } from "@/mock";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/patterns/kit";
import { CashflowChart, SpendingBars } from "@/components/patterns/charts";

/**
 * Dashboard cards owned by the Accounts micro-frontend. Router-free and given
 * already-resolved data — the shell wraps each in <Suspense>/<Await> to stream.
 */

export function CashflowCard({ data }: { data: CashflowPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cash flow</CardTitle>
        <CardDescription>Income vs. spending, last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <CashflowChart data={data} />
      </CardContent>
    </Card>
  );
}

export function SpendingCard({ data }: { data: { slices: SpendingSlice[]; total: number } }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Spending by category</CardTitle>
        <CardDescription>Last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <SpendingBars data={data.slices} />
      </CardContent>
    </Card>
  );
}

export function RecentActivityCard({ data }: { data: Transaction[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Recent activity</CardTitle>
          <CardDescription>Across all accounts</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <a href="/accounts">View all</a>
        </Button>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {data.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
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
      </CardContent>
    </Card>
  );
}
