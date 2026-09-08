import { useEffect, useState } from "react";
import { Helmet } from "@modern-js/runtime/head";
import { Loader2, MonitorSmartphone, Sparkles } from "lucide-react";
import {
  formatCurrency,
  formatPercent,
  type Account,
  type CashflowPoint,
} from "@/mock";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/patterns/kit";
import { CashflowChart } from "@/components/patterns/charts";
// federated data module — the SAME module the /accounts route uses on the server,
// here called from the browser.
import { loadAccountsList, loadDashboardWidgets } from "accounts/data";

interface Insights {
  netWorth: number;
  monthlyBurn: number;
  monthlyIncome: number;
  savingsRate: number;
  runwayMonths: number;
  projection: CashflowPoint[];
  computedAt: string;
}

async function computeInsights(): Promise<Insights> {
  const [{ accounts, netWorth }, widgets] = await Promise.all([
    loadAccountsList() as Promise<{ accounts: Account[]; netWorth: { total: number } }>,
    Promise.resolve(loadDashboardWidgets()),
  ]);
  const cashflow = (await widgets.cashflow) as CashflowPoint[];

  const monthlyIncome = Math.round(
    cashflow.reduce((s, m) => s + m.income, 0) / cashflow.length,
  );
  const monthlyBurn = Math.round(
    cashflow.reduce((s, m) => s + m.spending, 0) / cashflow.length,
  );
  const liquid = accounts
    .filter((a) => a.type === "checking" || a.type === "savings")
    .reduce((s, a) => s + a.available, 0);

  const projection: CashflowPoint[] = [];
  let running = liquid;
  const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  for (const month of months) {
    running += monthlyIncome - monthlyBurn;
    projection.push({ month, income: running, spending: monthlyBurn });
  }

  return {
    netWorth: netWorth.total,
    monthlyBurn,
    monthlyIncome,
    savingsRate: monthlyIncome > 0 ? (monthlyIncome - monthlyBurn) / monthlyIncome : 0,
    runwayMonths: monthlyBurn > 0 ? liquid / monthlyBurn : 0,
    projection,
    computedAt: new Date().toISOString(),
  };
}

export default function InsightsPage() {
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // small artificial pause so the client-side loading state is visible
    const t = setTimeout(() => {
      computeInsights()
        .then((d) => !cancelled && setData(d))
        .catch((e) => !cancelled && setError(String(e)));
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Insights · Northwind Bank</title>
      </Helmet>
      <PageHeader
        title="Insights"
        description="Personalised projections computed live in your browser."
      />

      <Alert className="mb-6">
        <MonitorSmartphone className="size-4" />
        <AlertTitle>This page is client-rendered (CSR)</AlertTitle>
        <AlertDescription>
          Unlike every other page, the server sends an empty shell here. Open “view source”
          (or the SSR badge in the header) — none of these numbers are in the HTML. They're
          fetched and computed in your browser from the federated{" "}
          <span className="font-mono">accounts/data</span> module.
        </AlertDescription>
      </Alert>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-sm text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          Computing insights in your browser…
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Net worth" value={formatCurrency(data.netWorth, { compact: true })} />
            <Stat label="Avg. monthly income" value={formatCurrency(data.monthlyIncome, { compact: true })} />
            <Stat label="Avg. monthly spend" value={formatCurrency(data.monthlyBurn, { compact: true })} />
            <Stat label="Savings rate" value={formatPercent(data.savingsRate, 0)} tone="pos" />
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">
                <Sparkles className="mr-1.5 inline size-4 text-[color:var(--chart-1)]" />
                Projected liquid balance
              </CardTitle>
              <CardDescription>
                Next 6 months at your current income and spending · runway{" "}
                {data.runwayMonths.toFixed(1)} months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CashflowChart data={data.projection} />
            </CardContent>
          </Card>

          <p className="mt-3 text-right text-[11px] text-muted-foreground">
            computed client-side at{" "}
            {new Date(data.computedAt).toLocaleTimeString("en-US", { hour12: false })}
          </p>
        </>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pos";
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className="text-2xl font-semibold tabular-nums"
          style={tone === "pos" ? { color: "var(--pos)" } : undefined}
        >
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
