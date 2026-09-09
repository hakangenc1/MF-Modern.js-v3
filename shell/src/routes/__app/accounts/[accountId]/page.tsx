import { Suspense } from "react";
import { Await, useFetcher, useLoaderData, useNavigate, useSearchParams } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import type { Account, Page as MockPage, Transaction, TransactionCategory } from "@/mock";
import AccountDetailView, { TransactionsTable } from "accounts/AccountDetailView";
import TransactionDetail from "accounts/TransactionDetail";
import { AwaitError, TableSkeleton } from "@/components/patterns/skeletons";
import { usePendingHref } from "@/components/patterns/pending";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Data {
  account: Account | null;
  category: string;
  search: string;
  sort: "date" | "amount" | "merchant";
  dir: "asc" | "desc";
  transactions: Promise<MockPage<Transaction>>;
  txn: Promise<Transaction | null>;
}

export default function AccountDetailPage() {
  const data = useLoaderData() as Data;
  const { account, category, search, sort, dir } = data;
  const pendingHref = usePendingHref();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const txnId = params.get("txn");

  const fetcher = useFetcher<{ txn: Transaction | null }>();
  const savingField =
    fetcher.state !== "idle"
      ? (fetcher.formData?.get("intent") as "category" | "note" | null)
      : null;

  const closeSheet = () => {
    const next = new URLSearchParams(params);
    next.delete("txn");
    navigate(`/accounts/${account?.id}${next.toString() ? `?${next}` : ""}`, { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>{account ? `${account.name} · Northwind Bank` : "Account · Northwind Bank"}</title>
      </Helmet>
      {account ? (
        <>
          <AccountDetailView
            account={account}
            category={category}
            search={search}
            sort={sort}
            dir={dir}
            pendingHref={pendingHref}
          >
            <Suspense fallback={<TableSkeleton rows={10} cols={5} />}>
              <Await resolve={data.transactions} errorElement={<AwaitError label="transactions" />}>
                {(page: MockPage<Transaction>) => (
                  <TransactionsTable
                    page={page}
                    base={`/accounts/${account.id}`}
                    category={category}
                    search={search}
                    sort={sort}
                    dir={dir}
                    pendingHref={pendingHref}
                  />
                )}
              </Await>
            </Suspense>
          </AccountDetailView>

          {/* Only mount the Sheet (+ its Suspense) when a txn is selected, so a
              fresh SSR render and hydration see the same tree. */}
          {txnId ? (
          <Sheet open onOpenChange={(o) => !o && closeSheet()}>
            <SheetContent className="overflow-y-auto sm:max-w-md">
              <SheetHeader className="mb-4">
                <SheetTitle>Transaction</SheetTitle>
              </SheetHeader>
              <Suspense fallback={<TableSkeleton rows={6} cols={2} />}>
                <Await resolve={data.txn} errorElement={<AwaitError label="this transaction" />}>
                  {(txn: Transaction | null) => {
                    const current = fetcher.data?.txn ?? txn;
                    if (!current) {
                      return <p className="text-sm text-muted-foreground">Transaction not found.</p>;
                    }
                    return (
                      <TransactionDetail
                        txn={current}
                        savingField={savingField}
                        onCategory={(c: TransactionCategory) =>
                          fetcher.submit(
                            { id: current.id, intent: "category", category: c },
                            { method: "post" },
                          )
                        }
                        onNote={(note: string) =>
                          fetcher.submit(
                            { id: current.id, intent: "note", note },
                            { method: "post" },
                          )
                        }
                      />
                    );
                  }}
                </Await>
              </Suspense>
            </SheetContent>
          </Sheet>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Account not found.</p>
      )}
    </>
  );
}
