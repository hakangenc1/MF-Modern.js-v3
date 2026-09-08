import { useLoaderData } from "@modern-js/runtime/router";
import AccountsView from "@/federation/AccountsView";
import type { AccountsListData } from "@/federation/data";

export default function Page() {
  return <AccountsView data={useLoaderData() as AccountsListData} />;
}
