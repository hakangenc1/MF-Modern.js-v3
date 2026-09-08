import { useLoaderData } from "@modern-js/runtime/router";
import type { Account, Statement } from "@/mock";
import StatementsView from "@/federation/StatementsView";

export default function Page() {
  const { accounts, statements } = useLoaderData() as {
    accounts: Account[];
    statements: Statement[];
  };
  return <StatementsView accounts={accounts} statements={statements} />;
}
