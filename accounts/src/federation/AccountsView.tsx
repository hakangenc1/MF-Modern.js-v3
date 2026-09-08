import {
  ArrowLeftRight,
  ArrowUpRight,
  CreditCard,
  PiggyBank,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, formatPercent, type Account, type AccountType } from "@/mock";
import { Badge } from "@/components/ui/badge";
import { Money, PageHeader, StatTile } from "@/components/patterns/kit";
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

      <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border bg-card p-5 sm:grid-cols-4">
        <StatTile label="Net worth" value={formatCurrency(netWorth.total)} />
        <StatTile label="Total assets" value={formatCurrency(netWorth.assets)} />
        <StatTile label="Total liabilities" value={formatCurrency(netWorth.liabilities)} />
        <StatTile
          label="This quarter"
          value={
            <span style={{ color: netWorth.change >= 0 ? "var(--pos)" : "var(--neg)" }}>
              {formatCurrency(netWorth.change, { sign: true, compact: true })}
            </span>
          }
          hint={`${formatPercent(netWorth.changePct)} change`}
        />
      </div>

      <div className="mt-8 space-y-8">
        {GROUPS.map(({ type, label }) => {
          const group = accounts.filter((a) => a.type === type);
          if (!group.length) return null;
          return (
            <section key={type} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </h2>
                <span className="text-sm tabular-nums text-muted-foreground">
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

function AccountTile({ account }: { account: Account }) {
  const Icon = ICON[account.type];
  const isCredit = account.type === "credit";
  return (
    <a href={`/accounts/${account.id}`} className="group block">
      <div className="h-full rounded-xl border bg-card p-4 transition-colors group-hover:border-foreground/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{account.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{account.mask}</p>
            </div>
          </div>
          <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="mt-3 flex items-end justify-between">
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
        <div className="mt-3 border-t pt-3 text-muted-foreground">
          <BalanceSparkline history={account.history} height={40} />
        </div>
      </div>
    </a>
  );
}
