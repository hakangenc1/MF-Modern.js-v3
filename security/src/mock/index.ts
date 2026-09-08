import { delay, LATENCY } from "./delay";
import {
  ACCOUNTS,
  BUDGETS,
  CARDS,
  CASHFLOW,
  DEMO_2FA_CODE,
  DEVICES,
  NOTIFICATIONS,
  NOW,
  PAYEES,
  PROFILE,
  RECURRING,
  SAVINGS_GOALS,
  SECURITY,
  SESSIONS,
  SPENDING_BY_CATEGORY,
  STATEMENTS,
  TRANSACTIONS,
  TRANSFERS,
  USER,
} from "./seed";
import type {
  Account,
  Budget,
  BudgetProgress,
  Card,
  CashflowPoint,
  Device,
  NotificationItem,
  Page,
  Payee,
  Profile,
  RecurringRule,
  SavingsGoal,
  SecurityOverview,
  SessionEntry,
  SpendingSlice,
  Statement,
  Transaction,
  TransactionCategory,
  Transfer,
  User,
} from "./types";

export * from "./types";
export { delay, LATENCY } from "./delay";
export * from "./format";
export { NOW, DEMO_2FA_CODE, PERSONAS, USER, USER_PERSONAL } from "./seed";

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/* ------------------------------------------------------------------ identity */

export async function getUser(): Promise<User> {
  await delay(LATENCY.fast);
  return clone(USER);
}

/* ------------------------------------------------------------------ accounts */

export async function getAccounts(): Promise<Account[]> {
  await delay(LATENCY.normal);
  return clone(ACCOUNTS);
}

export async function getAccount(id: string): Promise<Account | null> {
  await delay(LATENCY.fast);
  return clone(ACCOUNTS.find((a) => a.id === id) ?? null);
}

export interface NetWorth {
  total: number;
  assets: number;
  liabilities: number;
  /** Change vs. the start of the balance history window, in cents. */
  change: number;
  changePct: number;
}

export async function getNetWorth(): Promise<NetWorth> {
  await delay(LATENCY.fast);
  let assets = 0;
  let liabilities = 0;
  let startTotal = 0;
  for (const a of ACCOUNTS) {
    if (a.balance >= 0) assets += a.balance;
    else liabilities += -a.balance;
    startTotal += a.history[0] ?? a.balance;
  }
  const total = assets - liabilities;
  const change = total - startTotal;
  return {
    total,
    assets,
    liabilities,
    change,
    changePct: startTotal !== 0 ? change / Math.abs(startTotal) : 0,
  };
}

/* -------------------------------------------------------------- transactions */

const PAGE_SIZE = 12;

export type TransactionSort = "date" | "amount" | "merchant";

export interface TransactionQuery {
  accountId?: string;
  cursor?: string | null;
  category?: string;
  search?: string;
  limit?: number;
  sort?: TransactionSort;
  dir?: "asc" | "desc";
}

export async function getTransactions(query: TransactionQuery = {}): Promise<Page<Transaction>> {
  await delay(query.cursor ? LATENCY.normal : LATENCY.slow);
  const limit = query.limit ?? PAGE_SIZE;
  let rows = TRANSACTIONS;
  if (query.accountId) rows = rows.filter((t) => t.accountId === query.accountId);
  if (query.category && query.category !== "all")
    rows = rows.filter((t) => t.category === query.category);
  if (query.search) {
    const q = query.search.toLowerCase();
    rows = rows.filter(
      (t) => t.merchant.toLowerCase().includes(q) || t.category.toLowerCase().includes(q),
    );
  }
  if (query.sort) {
    const dir = query.dir === "asc" ? 1 : -1;
    const cmp: Record<TransactionSort, (a: Transaction, b: Transaction) => number> = {
      date: (a, b) => (+new Date(a.date) - +new Date(b.date)) * dir,
      amount: (a, b) => (a.amount - b.amount) * dir,
      merchant: (a, b) => a.merchant.localeCompare(b.merchant) * dir,
    };
    rows = [...rows].sort(cmp[query.sort]);
  }
  const start = query.cursor ? Number(query.cursor) : 0;
  const slice = rows.slice(start, start + limit);
  const nextStart = start + limit;
  return {
    items: clone(slice),
    nextCursor: nextStart < rows.length ? String(nextStart) : null,
    total: rows.length,
  };
}

export async function getRecentActivity(limit = 6): Promise<Transaction[]> {
  await delay(LATENCY.slow);
  return clone(TRANSACTIONS.slice(0, limit));
}

/* --------------------------------------------------------------- analytics */

export async function getSpendingByCategory(): Promise<{ slices: SpendingSlice[]; total: number }> {
  await delay(LATENCY.heavy);
  const slices = clone(SPENDING_BY_CATEGORY);
  return { slices, total: slices.reduce((s, x) => s + x.amount, 0) };
}

export async function getCashflow(): Promise<CashflowPoint[]> {
  await delay(LATENCY.slow);
  return clone(CASHFLOW);
}

/* ---------------------------------------------------------------- payments */

const transfers: Transfer[] = clone(TRANSFERS);
// Mutable payee book (create / update / delete operate on this).
const payees: Payee[] = clone(PAYEES);

function sortPayees(list: Payee[]): Payee[] {
  return [...list].sort(
    (a, b) => Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name),
  );
}

export async function getPayees(): Promise<Payee[]> {
  await delay(LATENCY.normal);
  return clone(sortPayees(payees));
}

export async function getPayee(id: string): Promise<Payee | null> {
  await delay(LATENCY.fast);
  return clone(payees.find((p) => p.id === id) ?? null);
}

export async function getTransfers(): Promise<{ scheduled: Transfer[]; history: Transfer[] }> {
  await delay(LATENCY.normal);
  const sorted = [...transfers].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return {
    scheduled: clone(sorted.filter((t) => t.status === "scheduled" || t.status === "processing")),
    history: clone(sorted.filter((t) => t.status === "completed" || t.status === "failed")),
  };
}

export interface CreateTransferInput {
  fromAccountId: string;
  toPayeeId: string;
  amount: number; // cents
  reference?: string;
  when: "now" | "scheduled";
  executeAt?: string;
}

export interface TransferResult {
  ok: boolean;
  transfer?: Transfer;
  error?: string;
}

export async function createTransfer(input: CreateTransferInput): Promise<TransferResult> {
  await delay(LATENCY.slow);
  const from = ACCOUNTS.find((a) => a.id === input.fromAccountId);
  const payee = PAYEES.find((p) => p.id === input.toPayeeId);
  if (!from || !payee) return { ok: false, error: "Account or payee not found." };
  if (input.amount <= 0) return { ok: false, error: "Enter an amount greater than zero." };
  if (input.amount > from.available)
    return { ok: false, error: "This transfer exceeds your available balance." };

  const transfer: Transfer = {
    id: `trf_${Math.floor(NOW.getTime() / 1000) + transfers.length}`,
    fromAccountId: from.id,
    toPayeeId: payee.id,
    toName: payee.name,
    amount: input.amount,
    currency: "USD",
    reference: input.reference?.trim() || "Transfer",
    status: input.when === "now" ? "processing" : "scheduled",
    createdAt: NOW.toISOString(),
    executeAt: input.when === "now" ? NOW.toISOString() : (input.executeAt ?? NOW.toISOString()),
  };
  transfers.unshift(transfer);
  return { ok: true, transfer };
}

/* ---------------------------------------------------------------- security */

const security: SecurityOverview = clone(SECURITY);
let devices: Device[] = clone(DEVICES);
let sessions: SessionEntry[] = clone(SESSIONS);

export async function getSecurityOverview(): Promise<SecurityOverview> {
  await delay(LATENCY.normal);
  return clone(security);
}

export async function getDevices(): Promise<Device[]> {
  await delay(LATENCY.slow);
  return clone(devices);
}

export async function getSessions(): Promise<SessionEntry[]> {
  await delay(LATENCY.slow);
  return clone(sessions);
}

export async function verifyTwoFactorCode(code: string): Promise<{ ok: boolean; error?: string }> {
  await delay(LATENCY.normal);
  if (code.trim() === DEMO_2FA_CODE) return { ok: true };
  return { ok: false, error: "That code isn't right. For this demo, use 123456." };
}

export async function setTwoFactor(enabled: boolean): Promise<SecurityOverview> {
  await delay(LATENCY.normal);
  security.twoFactorEnabled = enabled;
  security.method = enabled ? "authenticator" : "none";
  security.score = enabled ? 82 : 54;
  return clone(security);
}

export async function regenerateRecoveryCodes(): Promise<string[]> {
  await delay(LATENCY.slow);
  security.recoveryCodesRemaining = 10;
  const seg = () => Math.random().toString(36).slice(2, 7).toUpperCase();
  return Array.from({ length: 10 }, () => `${seg()}-${seg()}`);
}

export async function revokeDevice(id: string): Promise<Device[]> {
  await delay(LATENCY.fast);
  devices = devices.filter((d) => d.id !== id || d.current);
  return clone(devices);
}

export async function revokeSession(id: string): Promise<SessionEntry[]> {
  await delay(LATENCY.fast);
  sessions = sessions.filter((s) => s.id !== id || s.current);
  return clone(sessions);
}

/* ------------------------------------------------------------------- cards */

const cards: Card[] = clone(CARDS);

export async function getCards(): Promise<Card[]> {
  await delay(LATENCY.normal);
  return clone(cards);
}

export async function setCardFrozen(
  id: string,
  frozen: boolean,
  reason?: string,
): Promise<Card | null> {
  await delay(LATENCY.fast);
  const card = cards.find((c) => c.id === id);
  if (!card) return null;
  card.frozen = frozen;
  card.freezeReason = frozen ? reason || "Frozen by you" : undefined;
  return clone(card);
}

export async function setCardLimit(id: string, limitCents: number): Promise<Card | null> {
  await delay(LATENCY.fast);
  const card = cards.find((c) => c.id === id);
  if (!card) return null;
  card.monthlyLimit = Math.max(0, Math.round(limitCents));
  return clone(card);
}

export async function toggleCategoryLock(
  id: string,
  category: TransactionCategory,
): Promise<Card | null> {
  await delay(LATENCY.fast);
  const card = cards.find((c) => c.id === id);
  if (!card) return null;
  card.categoryLocks = card.categoryLocks.includes(category)
    ? card.categoryLocks.filter((c) => c !== category)
    : [...card.categoryLocks, category];
  return clone(card);
}

export async function addVirtualCard(id: string, label: string): Promise<Card | null> {
  await delay(LATENCY.normal);
  const card = cards.find((c) => c.id === id);
  if (!card) return null;
  const n = Math.floor(1000 + Math.random() * 9000);
  card.virtualCards = [
    ...card.virtualCards,
    {
      id: `vc_${Date.now()}`,
      label: label.trim() || "Virtual card",
      mask: `•••• ${n}`,
      createdAt: NOW.toISOString(),
    },
  ];
  return clone(card);
}

export async function deleteVirtualCard(id: string, vid: string): Promise<Card | null> {
  await delay(LATENCY.fast);
  const card = cards.find((c) => c.id === id);
  if (!card) return null;
  card.virtualCards = card.virtualCards.filter((v) => v.id !== vid);
  return clone(card);
}

export async function replaceCard(id: string): Promise<Card | null> {
  await delay(LATENCY.slow);
  const card = cards.find((c) => c.id === id);
  if (!card) return null;
  const n = Math.floor(1000 + Math.random() * 9000);
  card.mask = `•••• ${n}`;
  card.frozen = false;
  card.freezeReason = undefined;
  card.replacedAt = NOW.toISOString();
  return clone(card);
}

/* ---------------------------------------------------------------- statements */

export async function getStatements(accountId?: string): Promise<Statement[]> {
  await delay(LATENCY.normal);
  const rows = accountId
    ? STATEMENTS.filter((s) => s.accountId === accountId)
    : STATEMENTS;
  return clone(rows);
}

export async function getStatement(id: string): Promise<Statement | null> {
  await delay(LATENCY.fast);
  return clone(STATEMENTS.find((s) => s.id === id) ?? null);
}

/* ------------------------------------------------------- transaction detail */

export async function getTransaction(id: string): Promise<Transaction | null> {
  await delay(LATENCY.fast);
  return clone(TRANSACTIONS.find((t) => t.id === id) ?? null);
}

export async function setTransactionCategory(
  id: string,
  category: TransactionCategory,
): Promise<Transaction | null> {
  await delay(LATENCY.fast);
  const t = TRANSACTIONS.find((x) => x.id === id);
  if (!t) return null;
  t.category = category;
  return clone(t);
}

export async function setTransactionNote(id: string, note: string): Promise<Transaction | null> {
  await delay(LATENCY.fast);
  const t = TRANSACTIONS.find((x) => x.id === id);
  if (!t) return null;
  t.note = note.trim() || undefined;
  return clone(t);
}

/* -------------------------------------------------------- recurring rules */

const recurring: RecurringRule[] = clone(RECURRING);

export async function getRecurringRules(): Promise<RecurringRule[]> {
  await delay(LATENCY.normal);
  return clone(recurring);
}

export async function setRecurringActive(id: string, active: boolean): Promise<RecurringRule[]> {
  await delay(LATENCY.fast);
  const rule = recurring.find((r) => r.id === id);
  if (rule) rule.active = active;
  return clone(recurring);
}

export async function cancelTransfer(id: string): Promise<Transfer[]> {
  await delay(LATENCY.fast);
  const t = transfers.find((x) => x.id === id);
  if (t && (t.status === "scheduled" || t.status === "processing")) t.status = "failed";
  const sorted = [...transfers].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return clone(sorted);
}

/* ------------------------------------------------- internal (own-account) move */

export interface InternalTransferInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number; // cents
  reference?: string;
}

export async function createInternalTransfer(
  input: InternalTransferInput,
): Promise<TransferResult> {
  await delay(LATENCY.slow);
  const from = ACCOUNTS.find((a) => a.id === input.fromAccountId);
  const to = ACCOUNTS.find((a) => a.id === input.toAccountId);
  if (!from || !to) return { ok: false, error: "Account not found." };
  if (from.id === to.id) return { ok: false, error: "Choose two different accounts." };
  if (input.amount <= 0) return { ok: false, error: "Enter an amount greater than zero." };
  if (input.amount > from.available)
    return { ok: false, error: "This transfer exceeds your available balance." };

  const transfer: Transfer = {
    id: `trf_${Math.floor(NOW.getTime() / 1000) + transfers.length}`,
    fromAccountId: from.id,
    toPayeeId: to.id,
    toName: to.name,
    amount: input.amount,
    currency: "USD",
    reference: input.reference?.trim() || "Transfer between accounts",
    status: "completed",
    createdAt: NOW.toISOString(),
    executeAt: NOW.toISOString(),
    kind: "internal",
  };
  transfers.unshift(transfer);
  return { ok: true, transfer };
}

/* ---------------------------------------------------------- payee management */

export interface PayeeInput {
  name: string;
  bank: string;
  accountMask: string;
  reference?: string;
}

export async function createPayee(input: PayeeInput): Promise<Payee[]> {
  await delay(LATENCY.normal);
  payees.push({
    id: `pay_${Date.now()}`,
    name: input.name.trim(),
    bank: input.bank.trim(),
    accountMask: input.accountMask.trim(),
    reference: input.reference?.trim() || undefined,
    favorite: false,
  });
  return clone(sortPayees(payees));
}

export async function updatePayee(id: string, input: Partial<PayeeInput & { favorite: boolean }>): Promise<Payee[]> {
  await delay(LATENCY.fast);
  const p = payees.find((x) => x.id === id);
  if (p) {
    if (input.name !== undefined) p.name = input.name.trim();
    if (input.bank !== undefined) p.bank = input.bank.trim();
    if (input.accountMask !== undefined) p.accountMask = input.accountMask.trim();
    if (input.reference !== undefined) p.reference = input.reference.trim() || undefined;
    if (input.favorite !== undefined) p.favorite = input.favorite;
  }
  return clone(sortPayees(payees));
}

export async function deletePayee(id: string): Promise<Payee[]> {
  await delay(LATENCY.fast);
  const i = payees.findIndex((x) => x.id === id);
  if (i >= 0) payees.splice(i, 1);
  return clone(sortPayees(payees));
}

/* ---------------------------------------------------------- budgets & goals */

const budgets: Budget[] = clone(BUDGETS);
const goals: SavingsGoal[] = clone(SAVINGS_GOALS);

export async function getBudgets(): Promise<Budget[]> {
  await delay(LATENCY.fast);
  return clone(budgets);
}

export async function getBudgetProgress(): Promise<{ rows: BudgetProgress[]; totalLimit: number; totalSpent: number }> {
  await delay(LATENCY.normal);
  const cutoff = NOW.getTime() - 30 * 86_400_000;
  const spentByCat = new Map<string, number>();
  for (const t of TRANSACTIONS) {
    if (t.amount >= 0) continue;
    if (new Date(t.date).getTime() < cutoff) continue;
    spentByCat.set(t.category, (spentByCat.get(t.category) ?? 0) + Math.abs(t.amount));
  }
  const rows: BudgetProgress[] = budgets.map((b) => {
    const spent = spentByCat.get(b.category) ?? 0;
    return {
      ...b,
      spent,
      pct: b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0,
    };
  });
  return {
    rows,
    totalLimit: rows.reduce((s, r) => s + r.monthlyLimit, 0),
    totalSpent: rows.reduce((s, r) => s + r.spent, 0),
  };
}

export async function setBudget(
  category: TransactionCategory,
  limitCents: number,
): Promise<Budget[]> {
  await delay(LATENCY.fast);
  const b = budgets.find((x) => x.category === category);
  if (b) b.monthlyLimit = Math.max(0, Math.round(limitCents));
  else budgets.push({ category, monthlyLimit: Math.max(0, Math.round(limitCents)) });
  return clone(budgets);
}

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  await delay(LATENCY.fast);
  return clone(goals);
}

export async function contributeToGoal(id: string, amountCents: number): Promise<SavingsGoal[]> {
  await delay(LATENCY.normal);
  const g = goals.find((x) => x.id === id);
  if (g && amountCents > 0) g.saved = Math.min(g.target, g.saved + Math.round(amountCents));
  return clone(goals);
}

/* ----------------------------------------------------- profile & notifications */

const profile: Profile = clone(PROFILE);
const notifications: NotificationItem[] = clone(NOTIFICATIONS);

export async function getProfile(): Promise<Profile> {
  await delay(LATENCY.fast);
  return clone(profile);
}

export async function updateProfile(patch: Partial<Omit<Profile, "accountNicknames">>): Promise<Profile> {
  await delay(LATENCY.normal);
  Object.assign(profile, patch);
  return clone(profile);
}

export async function setAccountNickname(accountId: string, nickname: string): Promise<Profile> {
  await delay(LATENCY.fast);
  const trimmed = nickname.trim();
  if (trimmed) profile.accountNicknames[accountId] = trimmed;
  else delete profile.accountNicknames[accountId];
  const acc = ACCOUNTS.find((a) => a.id === accountId);
  if (acc) acc.nickname = trimmed || undefined;
  return clone(profile);
}

export async function getNotifications(): Promise<NotificationItem[]> {
  await delay(LATENCY.fast);
  return clone(
    [...notifications].sort((a, b) => +new Date(b.at) - +new Date(a.at)),
  );
}

export async function markNotificationRead(id: string): Promise<NotificationItem[]> {
  await delay(LATENCY.instant);
  const n = notifications.find((x) => x.id === id);
  if (n) n.read = true;
  return getNotifications();
}

export async function markAllNotificationsRead(): Promise<NotificationItem[]> {
  await delay(LATENCY.fast);
  notifications.forEach((n) => (n.read = true));
  return getNotifications();
}
