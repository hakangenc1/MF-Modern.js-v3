import { defer, type LoaderFunctionArgs } from "@modern-js/runtime/router";
import type { Transaction } from "@/mock";
import * as accountsData from "accounts/data";
import { getSession } from "@/mock/session";

const { loadAccountsList, loadRecentActivity } = accountsData as typeof accountsData & {
  loadRecentActivity?: (limit?: number) => Promise<Transaction[]>;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  getSession(request);
  const list = await loadAccountsList();
  // Tolerate an older accounts remote that predates loadRecentActivity (can
  // happen briefly if a deploy finishes the shell before the remote).
  const activity =
    typeof loadRecentActivity === "function"
      ? loadRecentActivity(8)
      : Promise.resolve([] as Transaction[]);
  return defer({ ...list, activity });
};
