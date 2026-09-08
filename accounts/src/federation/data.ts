/**
 * Federated data layer for the Accounts micro-frontend. Plain async functions
 * (no framework coupling) so the shell can call them from its route loaders over
 * Module Federation and still stream the results.
 */
import {
  contributeToGoal,
  getAccount,
  getAccounts,
  getBudgetProgress,
  getBudgets,
  getCashflow,
  getNetWorth,
  getRecentActivity,
  getSavingsGoals,
  getSpendingByCategory,
  getStatement,
  getStatements,
  getTransaction,
  getTransactions,
  setAccountNickname,
  setBudget,
  setTransactionCategory,
  setTransactionNote,
  type Account,
  type Budget,
  type BudgetProgress,
  type CashflowPoint,
  type NetWorth,
  type Page,
  type SavingsGoal,
  type SpendingSlice,
  type Statement,
  type Transaction,
  type TransactionCategory,
  type TransactionSort,
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
  sort: TransactionSort;
  dir: "asc" | "desc";
  transactions: Promise<Page<Transaction>>;
}

/** Parse filters from the request and kick off (but don't await) the query. */
export function loadAccountDetail(accountId: string, request: Request): AccountDetailParams {
  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? "all";
  const search = url.searchParams.get("q") ?? "";
  const cursor = url.searchParams.get("cursor");
  const sortParam = url.searchParams.get("sort");
  const sort: TransactionSort =
    sortParam === "amount" || sortParam === "merchant" ? sortParam : "date";
  const dir = url.searchParams.get("dir") === "asc" ? "asc" : "desc";
  return {
    category,
    search,
    sort,
    dir,
    transactions: getTransactions({ accountId, cursor, category, search, sort, dir }),
  };
}

/* -------------------------------------------------- transaction detail (C1) */

export function loadTransaction(id: string): Promise<Transaction | null> {
  return getTransaction(id);
}

export function updateTransactionCategory(
  id: string,
  category: TransactionCategory,
): Promise<Transaction | null> {
  return setTransactionCategory(id, category);
}

export function updateTransactionNote(id: string, note: string): Promise<Transaction | null> {
  return setTransactionNote(id, note);
}

/* -------------------------------------------------------------- statements */

export function loadStatements(accountId?: string): Promise<Statement[]> {
  return getStatements(accountId);
}

export function loadStatement(id: string): Promise<Statement | null> {
  return getStatement(id);
}

/* --------------------------------------------------------- budgets & goals */

export function loadBudgetProgress(): ReturnType<typeof getBudgetProgress> {
  return getBudgetProgress();
}

export function loadBudgets(): Promise<Budget[]> {
  return getBudgets();
}

export function saveBudget(category: TransactionCategory, limitCents: number): Promise<Budget[]> {
  return setBudget(category, limitCents);
}

export function loadSavingsGoals(): Promise<SavingsGoal[]> {
  return getSavingsGoals();
}

export function contributeGoal(id: string, amountCents: number): Promise<SavingsGoal[]> {
  return contributeToGoal(id, amountCents);
}

export type { BudgetProgress };

/* ------------------------------------------------------------- nicknames */

export function setNickname(accountId: string, nickname: string) {
  return setAccountNickname(accountId, nickname);
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

/** Recent transactions across every account — the /accounts page streams this. */
export function loadRecentActivity(limit = 8): Promise<Transaction[]> {
  return getRecentActivity(limit);
}
