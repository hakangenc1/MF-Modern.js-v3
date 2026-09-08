import {
  ArrowLeftRight,
  ArrowUpRight,
  CreditCard,
  PiggyBank,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, formatPercent, type Account, type AccountType } from "@/mock";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Money, PageHeader } from "@/components/patterns/kit";
import { BalanceSparkline } from "@/components/patterns/charts";
import type { AccountsListData } from "./data";

const ICON: Record<AccountType, React.ComponentType<{ className?: string }>> = {
  checking: ArrowLeftRight,
  savings: PiggyBank,
  credit: CreditCard,
  investment: TrendingUp,
};

const GROUPS: { type: AccountType; label: string }[] = [
  { type: "checking", label: "Cash" },
  { type: "savings", label: "Savings" },
  { type: "credit", label: "Credit" },
  { type: "investment", label: "Investments" },
];

/**
 * Accounts list — a presentational component owned by the Accounts
 * micro-frontend. Router-free (plain anchors) so it renders identically whether
 * mounted standalone or federated into the shell's SSR stream.
 */
export default function AccountsView({ data }: { data: AccountsListData }) {
  const { accounts, netWorth } = data;

  return (
    <>
      <PageHeader
        origin={{ name: "accounts", port: 3001 }}
        title="Accounts"
        description="Every balance across your Northwind relationship, updated in real time."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Net worth" value={formatCurrency(netWorth.total)} accent />
        <SummaryCard label="Total assets" value={formatCurrency(netWorth.assets)} />
        <SummaryCard label="Total liabilities" value={formatCurrency(netWorth.liabilities)} />
      </div>

      <div className="mt-8 space-y-8">
        {GROUPS.map(({ type, label }) => {
          const group = accounts.filter((a) => a.type === type);
          if (!group.length) return null;
          return (
            <section key={type} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </h2>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {formatCurrency(group.reduce((s, a) => s + a.balance, 0))}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.map((account) => (
                  <AccountTile key={account.id} account={account} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className={accent ? "border-primary/30 bg-primary/[0.03]" : undefined}>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function AccountTile({ account }: { account: Account }) {
  const Icon = ICON[account.type];
  const isCredit = account.type === "credit";
  return (
    <a href={`/accounts/${account.id}`} className="group block">
      <Card className="h-full transition-colors group-hover:border-primary/40">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
                <CardDescription className="font-mono text-xs">{account.mask}</CardDescription>
              </div>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                {isCredit ? "Current balance" : "Available"}
              </p>
              <Money
                cents={isCredit ? account.balance : account.available}
                colorize={isCredit}
                className="text-xl font-semibold"
              />
            </div>
            {account.apy ? (
              <Badge variant="secondary">{formatPercent(account.apy)} APY</Badge>
            ) : isCredit && account.creditLimit ? (
              <Badge variant="outline">{formatCurrency(account.creditLimit)} limit</Badge>
            ) : null}
          </div>
          <Separator />
          <BalanceSparkline history={account.history} />
        </CardContent>
      </Card>
    </a>
  );
}
