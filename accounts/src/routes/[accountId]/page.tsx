import { Suspense } from "react";
import { Await, useLoaderData } from "@modern-js/runtime/router";
import type { Account, Page as MockPage, Transaction } from "@/mock";
import AccountDetailView, { TransactionsTable } from "@/federation/AccountDetailView";
import { TableSkeleton } from "@/components/patterns/skeletons";

interface Data {
  account: Account | null;
  category: string;
  search: string;
  transactions: Promise<MockPage<Transaction>>;
}

export default function Page() {
  const data = useLoaderData() as Data;
  if (!data.account) {
    return <p className="text-sm text-muted-foreground">Account not found.</p>;
  }
  const { account, category, search } = data;
  return (
    <AccountDetailView account={account} category={category} search={search}>
      <Suspense fallback={<TableSkeleton rows={10} cols={5} />}>
        <Await resolve={data.transactions}>
          {(page) => (
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
  );
}
