import { ArrowLeft, Search } from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatPercent,
  type Account,
  type Page,
  type Transaction,
  type TransactionCategory,
} from "@/mock";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Money } from "@/components/patterns/kit";
import { BalanceSparkline } from "@/components/patterns/charts";

const CATEGORIES: (TransactionCategory | "all")[] = [
  "all",
  "Income",
  "Groceries",
  "Dining",
  "Transport",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Health",
  "Travel",
  "Transfers",
  "Fees",
];

/**
 * Account detail — presentational and router-free. The shell (which owns
 * routing) drives navigation via the plain links / GET form here, and streams
 * the transaction table into `children`.
 */
export default function AccountDetailView({
  account,
  category,
  search,
  children,
}: {
  account: Account;
  category: string;
  search: string;
  children: React.ReactNode;
}) {
  const isCredit = account.type === "credit";
  const base = `/accounts/${account.id}`;
  const hrefFor = (cat: string) => {
    const p = new URLSearchParams();
    if (cat && cat !== "all") p.set("category", cat);
    if (search) p.set("q", search);
    const qs = p.toString();
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <a href="/accounts">
          <ArrowLeft className="size-4" /> All accounts
        </a>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{account.name}</CardTitle>
                <CardDescription className="font-mono">{account.mask}</CardDescription>
              </div>
              <Badge variant="outline" className="uppercase">
                {account.type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-x-10 gap-y-3">
              <Figure
                label={isCredit ? "Current balance" : "Balance"}
                value={
                  <Money
                    cents={account.balance}
                    colorize={isCredit}
                    className="text-2xl font-semibold"
                  />
                }
              />
              <Figure
                label="Available"
                value={
                  <span className="text-2xl font-semibold tabular-nums">
                    {formatCurrency(account.available)}
                  </span>
                }
              />
              {account.apy ? (
                <Figure
                  label="Interest rate"
                  value={
                    <span className="text-2xl font-semibold">{formatPercent(account.apy)}</span>
                  }
                />
              ) : null}
              {isCredit && account.creditLimit ? (
                <Figure
                  label="Credit limit"
                  value={
                    <span className="text-2xl font-semibold tabular-nums">
                      {formatCurrency(account.creditLimit)}
                    </span>
                  }
                />
              ) : null}
            </div>
            <BalanceSparkline history={account.history} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Account name" value={account.name} />
            <Row label="Type" value={account.type} />
            <Row label="Opened" value={formatDate(account.openedAt, "long")} />
            <Row label="Currency" value={account.currency} />
            <Row label="Routing" value="•••• •••• 021" />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="gap-4">
          <div>
            <CardTitle className="text-base">Transactions</CardTitle>
            <CardDescription>Filter by category or search a merchant</CardDescription>
          </div>
          <form method="get" action={base} className="relative max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            {category && category !== "all" ? (
              <input type="hidden" name="category" value={category} />
            ) : null}
            <Input
              name="q"
              defaultValue={search}
              placeholder="Search merchant, then Enter…"
              className="pl-8"
            />
          </form>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <a key={c} href={hrefFor(c)}>
                <Badge variant={category === c ? "default" : "outline"} className="cursor-pointer">
                  {c === "all" ? "All" : c}
                </Badge>
              </a>
            ))}
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </>
  );
}

/** Resolved transaction table — rendered by the parent inside a Suspense/Await. */
export function TransactionsTable({
  page,
  base,
  category,
  search,
}: {
  page: Page<Transaction>;
  base: string;
  category: string;
  search: string;
}) {
  if (!page.items.length) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No transactions match these filters.
      </p>
    );
  }
  const more = new URLSearchParams();
  if (category && category !== "all") more.set("category", category);
  if (search) more.set("q", search);
  if (page.nextCursor) more.set("cursor", page.nextCursor);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Merchant</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {page.items.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-medium">
                {t.merchant}
                {t.status === "pending" ? (
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    Pending
                  </Badge>
                ) : null}
              </TableCell>
              <TableCell className="text-muted-foreground">{t.category}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(t.date, "short")}</TableCell>
              <TableCell className="text-right">
                <Money cents={t.amount} colorize showSign />
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatCurrency(t.runningBalance)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {page.items.length} of {page.total}
        </span>
        {page.nextCursor ? (
          <Button asChild variant="outline" size="sm">
            <a href={`${base}?${more}`}>Load more</a>
          </Button>
        ) : null}
      </div>
    </>
  );
}

function Figure({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {value}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}
