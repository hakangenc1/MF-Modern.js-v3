import { Suspense } from "react";
import { Await, Link, useLoaderData } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import {
  ArrowLeftRight,
  ArrowUpRight,
  CreditCard,
  PiggyBank,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  formatCurrency,
  formatPercent,
  type Account,
  type BudgetProgress,
  type CashflowPoint,
  type NetWorth,
  type Payee,
  type SavingsGoal,
  type SecurityOverview,
  type SpendingSlice,
  type Transaction,
} from "@/mock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Money, StatTile, SectionCard } from "@/components/patterns/kit";
import { NetWorthTrend } from "@/components/patterns/charts";
import { ActivityListSkeleton, ChartSkeleton } from "@/components/patterns/skeletons";
import {
  BudgetSummaryCard,
  CashflowCard,
  RecentActivityCard,
  SavingsGoalCard,
  SpendingCard,
} from "accounts/widgets";
import { QuickTransferCard } from "payments/QuickTransferCard";
import { SecurityStatusCard } from "security/SecurityStatusCard";

interface DashboardData {
  firstName: string;
  heading: string;
  today: string;
  netWorth: NetWorth;
  accounts: Account[];
  payees: Payee[];
  security: SecurityOverview;
  canBudgets: boolean;
  budget: { rows: BudgetProgress[]; totalLimit: number; totalSpent: number };
  goal: SavingsGoal | null;
  cashflow: Promise<CashflowPoint[]>;
  spending: Promise<{ slices: SpendingSlice[]; total: number }>;
  activity: Promise<Transaction[]>;
}

const ACCOUNT_ICON = {
  checking: ArrowLeftRight,
  savings: PiggyBank,
  credit: CreditCard,
  investment: TrendingUp,
} as const;

export default function Dashboard() {
  const {
    heading,
    today,
    netWorth,
    accounts,
    payees,
    security,
    canBudgets,
    budget,
    goal,
    cashflow,
    spending,
    activity,
  } = useLoaderData() as DashboardData;

  // Net-worth trend: sum every account's balance history point-by-point.
  const len = Math.min(...accounts.map((a) => a.history.length));
  const netWorthHistory = Array.from({ length: len }, (_, i) =>
    accounts.reduce((s, a) => s + (a.history[i] ?? 0), 0),
  );
  const up = netWorth.change >= 0;

  return (
    <>
      <Helmet>
        <title>Overview · Northwind Bank</title>
        <meta
          name="description"
          content="Your Northwind Bank overview — net worth, accounts, recent activity and security status."
        />
      </Helmet>
      <PageHeader
        title={heading}
        description={today}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/accounts">
                <ArrowUpRight className="size-4" /> All accounts
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/payments">
                <Plus className="size-4" /> New transfer
              </Link>
            </Button>
          </>
        }
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="flex h-full flex-col rounded-xl border bg-card p-5 lg:col-span-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total net worth</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <Money
                cents={netWorth.total}
                className="text-3xl font-semibold tracking-tight sm:text-4xl"
              />
              <span
                className="inline-flex items-center gap-1 text-sm font-medium tabular-nums"
                style={{ color: up ? "var(--pos)" : "var(--neg)" }}
              >
                {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {formatCurrency(netWorth.change, { sign: true, compact: true })}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatPercent(netWorth.changePct)} this quarter
              </span>
            </div>
          </div>

          <div className="my-4 flex flex-1 flex-col">
            <div className="min-h-[120px] flex-1 text-foreground">
              <NetWorthTrend history={netWorthHistory} />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
              <span>12 months ago</span>
              <span>Today</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 sm:grid-cols-4">
            <StatTile label="Assets" value={formatCurrency(netWorth.assets, { compact: true })} />
            <StatTile
              label="Liabilities"
              value={formatCurrency(netWorth.liabilities, { compact: true })}
            />
            <StatTile label="Accounts" value={String(accounts.length)} />
            <StatTile label="Payees" value={String(payees.length)} />
          </div>
        </div>

        <QuickTransferCard payees={payees} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3 cv-auto">
        <div className="lg:col-span-2">
          <Suspense fallback={<CardShell title="Cash flow"><ChartSkeleton /></CardShell>}>
            <Await resolve={cashflow}>
              {(d) => <CashflowCard data={d} />}
            </Await>
          </Suspense>
        </div>
        <Suspense fallback={<CardShell title="Spending by category"><ChartSkeleton /></CardShell>}>
          <Await resolve={spending}>
            {(d) => <SpendingCard data={d} />}
          </Await>
        </Suspense>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3 cv-auto">
        <div className="lg:col-span-2">
          <Suspense
            fallback={<CardShell title="Recent activity"><ActivityListSkeleton /></CardShell>}
          >
            <Await resolve={activity}>
              {(d) => <RecentActivityCard data={d} />}
            </Await>
          </Suspense>
        </div>
        <div className="space-y-4">
          <SecurityStatusCard overview={security} />
          {canBudgets ? (
            <>
              <BudgetSummaryCard
                rows={budget.rows}
                totalLimit={budget.totalLimit}
                totalSpent={budget.totalSpent}
              />
              {goal ? <SavingsGoalCard goal={goal} /> : null}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

function CardShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <SectionCard title={title}>
      {children}
    </SectionCard>
  );
}

function AccountCard({ account }: { account: Account }) {
  const Icon = ACCOUNT_ICON[account.type];
  return (
    <Link to={`/accounts/${account.id}`} className="group">
      <div className="h-full rounded-xl border bg-card p-4 transition-colors group-hover:border-foreground/20">
        <div className="flex items-center justify-between">
          <div className="flex size-8 items-center justify-center rounded-md bg-muted">
            <Icon className="size-4" />
          </div>
          <Badge variant="outline" className="text-[10px] uppercase">
            {account.type}
          </Badge>
        </div>
        <p className="mt-3 truncate text-sm font-medium">{account.name}</p>
        <p className="font-mono text-xs text-muted-foreground">{account.mask}</p>
        <Money
          cents={account.balance}
          colorize={account.type === "credit"}
          className="mt-2 block text-lg font-semibold"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {account.type === "credit"
            ? `${formatCurrency(account.available)} available`
            : account.apy
              ? `${formatPercent(account.apy)} APY`
              : `${formatCurrency(account.available)} available`}
        </p>
      </div>
    </Link>
  );
}
