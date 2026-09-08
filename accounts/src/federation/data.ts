/**
 * Federated data layer for the Accounts micro-frontend. Plain async functions
 * (no framework coupling) so the shell can call them from its route loaders over
 * Module Federation and still stream the results.
 */
import {
  getAccount,
  getAccounts,
  getCashflow,
  getNetWorth,
  getRecentActivity,
  getSpendingByCategory,
  getTransactions,
  type Account,
  type CashflowPoint,
  type NetWorth,
  type Page,
  type SpendingSlice,
  type Transaction,
} from "@/mock";

export interface AccountsListData {
  accounts: Account[];
  netWorth: NetWorth;
}

export async function loadAccountsList(): Promise<AccountsListData> {
  const [accounts, netWorth] = await Promise.all([getAccounts(), getNetWorth()]);
  return { accounts, netWorth };
}

export async function loadAccountHeader(accountId: string): Promise<Account | null> {
  return getAccount(accountId);
}

export interface AccountDetailParams {
  category: string;
  search: string;
  transactions: Promise<Page<Transaction>>;
}

/** Parse filters from the request and kick off (but don't await) the query. */
export function loadAccountDetail(accountId: string, request: Request): AccountDetailParams {
  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? "all";
  const search = url.searchParams.get("q") ?? "";
  const cursor = url.searchParams.get("cursor");
  return {
    category,
    search,
    transactions: getTransactions({ accountId, cursor, category, search }),
  };
}

export interface DashboardWidgetData {
  cashflow: Promise<CashflowPoint[]>;
  spending: Promise<{ slices: SpendingSlice[]; total: number }>;
  activity: Promise<Transaction[]>;
}

export function loadDashboardWidgets(): DashboardWidgetData {
  return {
    cashflow: getCashflow(),
    spending: getSpendingByCategory(),
    activity: getRecentActivity(6),
  };
}
