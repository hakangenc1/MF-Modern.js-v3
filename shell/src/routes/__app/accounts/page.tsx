import { Suspense } from "react";
import { Await, Link, useLoaderData } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import { formatDate, type Transaction } from "@/mock";
import AccountsView from "accounts/AccountsView";
import { Button } from "@/components/ui/button";
import { Money, SectionCard } from "@/components/patterns/kit";
import { ActivityListSkeleton } from "@/components/patterns/skeletons";

interface Data {
  accounts: unknown[];
  netWorth: unknown;
  activity: Promise<Transaction[]>;
}

export default function AccountsPage() {
  const data = useLoaderData() as Data;
  return (
    <>
      <Helmet>
        <title>Accounts · Northwind Bank</title>
      </Helmet>
      <AccountsView data={data}>
        <SectionCard
          title="Recent activity"
          description="Across every account"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/statements">Statements</Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          <Suspense fallback={<div className="p-5"><ActivityListSkeleton rows={8} /></div>}>
            <Await resolve={data.activity}>
              {(rows: Transaction[]) => (
                <ul className="divide-y">
                  {rows.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 px-5 py-2.5">
                      <div className="flex size-8 items-center justify-center rounded-full bg-muted text-[11px] font-medium">
                        {t.merchant.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.merchant}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.category} · {formatDate(t.date, "short")}
                        </p>
                      </div>
                      <Money cents={t.amount} colorize showSign className="text-sm font-medium" />
                    </li>
                  ))}
                </ul>
              )}
            </Await>
          </Suspense>
        </SectionCard>
      </AccountsView>
    </>
  );
}
