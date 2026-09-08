import { Suspense } from "react";
import { Await, Link, useLoaderData } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import {
  ArrowLeftRight,
  ArrowUpRight,
  CreditCard,
  PiggyBank,
  Plus,
  TrendingUp,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatPercent,
  type Account,
  type CashflowPoint,
  type NetWorth,
  type Payee,
  type SecurityOverview,
  type SpendingSlice,
  type Transaction,
} from "@/mock";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader, Money } from "@/components/patterns/kit";
import { ActivityListSkeleton, ChartSkeleton } from "@/components/patterns/skeletons";
import { CashflowCard, RecentActivityCard, SpendingCard } from "accounts/widgets";
import { QuickTransferCard } from "payments/QuickTransferCard";
import { SecurityStatusCard } from "security/SecurityStatusCard";

interface DashboardData {
  firstName: string;
  netWorth: NetWorth;
  accounts: Account[];
  payees: Payee[];
  security: SecurityOverview;
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

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Dashboard() {
  const { firstName, netWorth, accounts, payees, security, cashflow, spending, activity } =
    useLoaderData() as DashboardData;

  return (
    <>
      <Helmet>
        <title>Overview · Northwind Bank</title>
      </Helmet>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description={formatDate(new Date().toISOString(), "long")}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/accounts">
                <ArrowUpRight className="size-4" /> All accounts
              </Link>
            </Button>
            <Button asChild>
              <Link to="/payments">
                <Plus className="size-4" /> New transfer
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardDescription>Total net worth</CardDescription>
            <CardTitle className="text-4xl font-semibold tracking-tight">
              <Money cents={netWorth.total} />
            </CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="gap-1 text-[color:var(--pos)]">
                <ArrowUpRight className="size-3" />
                {formatCurrency(netWorth.change, { sign: true, compact: true })}
              </Badge>
              <span className="text-muted-foreground">
                {formatPercent(netWorth.changePct)} this quarter
              </span>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Assets" value={formatCurrency(netWorth.assets, { compact: true })} />
            <Stat
              label="Liabilities"
              value={formatCurrency(netWorth.liabilities, { compact: true })}
            />
            <Stat label="Accounts" value={String(accounts.length)} />
            <Stat label="Payees" value={String(payees.length)} />
          </CardContent>
        </Card>

        <QuickTransferCard payees={payees} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<CardShell title="Cash flow"><ChartSkeleton /></CardShell>}>
            <Await resolve={cashflow}>{(d) => <CashflowCard data={d} />}</Await>
          </Suspense>
        </div>
        <Suspense fallback={<CardShell title="Spending by category"><ChartSkeleton /></CardShell>}>
          <Await resolve={spending}>{(d) => <SpendingCard data={d} />}</Await>
        </Suspense>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense
            fallback={<CardShell title="Recent activity"><ActivityListSkeleton /></CardShell>}
          >
            <Await resolve={activity}>{(d) => <RecentActivityCard data={d} />}</Await>
          </Suspense>
        </div>
        <SecurityStatusCard overview={security} />
      </div>
    </>
  );
}

function CardShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function AccountCard({ account }: { account: Account }) {
  const Icon = ACCOUNT_ICON[account.type];
  return (
    <Link to={`/accounts/${account.id}`} className="group">
      <Card className="transition-colors group-hover:border-primary/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex size-8 items-center justify-center rounded-md bg-muted">
              <Icon className="size-4" />
            </div>
            <Badge variant="outline" className="text-[10px] uppercase">
              {account.type}
            </Badge>
          </div>
          <CardTitle className="pt-2 text-sm font-medium">{account.name}</CardTitle>
          <CardDescription className="font-mono text-xs">{account.mask}</CardDescription>
        </CardHeader>
        <CardContent>
          <Money
            cents={account.balance}
            colorize={account.type === "credit"}
            className="text-xl font-semibold"
          />
          <Separator className="my-2" />
          <p className="text-xs text-muted-foreground">
            {account.type === "credit"
              ? `${formatCurrency(account.available)} available`
              : account.apy
                ? `${formatPercent(account.apy)} APY`
                : `${formatCurrency(account.available)} available`}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
