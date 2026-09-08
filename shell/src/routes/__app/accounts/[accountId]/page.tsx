import { Suspense } from "react";
import { Await, useLoaderData } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import type { Account, Page as MockPage, Transaction } from "@/mock";
import AccountDetailView, { TransactionsTable } from "accounts/AccountDetailView";
import { TableSkeleton } from "@/components/patterns/skeletons";

interface Data {
  account: Account | null;
  category: string;
  search: string;
  transactions: Promise<MockPage<Transaction>>;
}

export default function AccountDetailPage() {
  const data = useLoaderData() as Data;
  const { account, category, search } = data;

  return (
    <>
      <Helmet>
        <title>{account ? `${account.name} · Northwind Bank` : "Account · Northwind Bank"}</title>
      </Helmet>
      {account ? (
        <AccountDetailView account={account} category={category} search={search}>
          <Suspense fallback={<TableSkeleton rows={10} cols={5} />}>
            <Await resolve={data.transactions}>
              {(page: MockPage<Transaction>) => (
                <TransactionsTable
                  page={page}
                  base={`/accounts/${account.id}`}
                  category={category}
                  search={search}
                />
              )}
            </Await>
          </Suspense>
        </AccountDetailView>
      ) : (
        <p className="text-sm text-muted-foreground">Account not found.</p>
      )}
    </>
  );
}
