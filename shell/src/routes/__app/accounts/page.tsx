import { useLoaderData } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import AccountsView from "accounts/AccountsView";

export default function AccountsPage() {
  const data = useLoaderData();
  return (
    <>
      <Helmet>
        <title>Accounts · Northwind Bank</title>
      </Helmet>
      <AccountsView data={data} />
    </>
  );
}
