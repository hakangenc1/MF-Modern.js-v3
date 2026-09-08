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

const LABEL: Record<AccountType, string> = {
  checking: "Cash",
  savings: "Savings",
  credit: "Credit",
  investment: "Investment",
};

// Display order — same-type accounts stay adjacent in the flat grid.
const ORDER: AccountType[] = ["checking", "savings", "credit", "investment"];

/**
 * Accounts list — a presentational component owned by the Accounts
 * micro-frontend. Router-free (plain anchors) so it renders identically whether
 * mounted standalone or federated into the shell's SSR stream. `children` is an
 * optional streamed slot (the shell puts recent activity here).
 */
export default function AccountsView({
  data,
  children,
}: {
  data: AccountsListData;
  children?: React.ReactNode;
}) {
  const { accounts, netWorth } = data;
  const sorted = [...accounts].sort(
    (a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type),
  );

  return (
    <>
      <PageHeader
        origin={{ name: "accounts", port: 3001 }}
        title="Accounts"
        description="Every balance across your Northwind relationship, updated in real time."
      />

      {/* Container queries, not viewport breakpoints: this view is federated into
          the shell (content area ~945px, beside a sidebar) and also runs
          standalone (full width). @-variants respond to the actual space we get
          so both render identically. */}
      <div className="@container">
        <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border bg-card p-5 @xl:grid-cols-4">
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

        <div className="mt-6 grid grid-cols-1 gap-4 @lg:grid-cols-2 @4xl:grid-cols-4">
          {sorted.map((account) => (
            <AccountTile key={account.id} account={account} />
          ))}
        </div>

        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </>
  );
}

function secondaryLine(account: Account): string {
  if (account.type === "credit") {
    const limit = account.creditLimit ? ` of ${formatCurrency(account.creditLimit)}` : "";
    return `${formatCurrency(account.available)} available${limit}`;
  }
  if (account.apy) {
    return `${formatPercent(account.apy)} APY · ${formatCurrency(account.available)} available`;
  }
  return `${formatCurrency(account.available)} available`;
}

function AccountTile({ account }: { account: Account }) {
  const Icon = ICON[account.type];
  const isCredit = account.type === "credit";
  return (
    <a href={`/accounts/${account.id}`} className="group block">
      <div className="flex h-full flex-col gap-3 rounded-xl border bg-card p-4 transition-colors group-hover:border-foreground/25">
        <div className="flex items-center justify-between">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-4" />
          </div>
          <Badge variant="outline" className="text-[10px] uppercase">
            {LABEL[account.type]}
          </Badge>
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{account.nickname || account.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{account.mask}</p>
        </div>

        <div>
          <Money
            cents={isCredit ? account.balance : account.available}
            colorize={isCredit}
            className="block text-xl font-semibold tracking-tight"
          />
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{secondaryLine(account)}</p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 border-t pt-3 text-muted-foreground">
          <div className="min-w-0 flex-1">
            <BalanceSparkline history={account.history} height={32} />
          </div>
          <ArrowUpRight className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </a>
  );
}
