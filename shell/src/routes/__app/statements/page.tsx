import { useLoaderData } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import type { Account, Statement } from "@/mock";
import StatementsView from "accounts/StatementsView";

export default function StatementsPage() {
  const { accounts, statements } = useLoaderData() as {
    accounts: Account[];
    statements: Statement[];
  };
  return (
    <>
      <Helmet>
        <title>Statements · Northwind Bank</title>
      </Helmet>
      <StatementsView accounts={accounts} statements={statements} />
    </>
  );
}
