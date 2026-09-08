import { delay, LATENCY } from "./delay";
import {
  ACCOUNTS,
  CARDS,
  CASHFLOW,
  DEMO_2FA_CODE,
  DEVICES,
  NOW,
  PAYEES,
  SECURITY,
  SESSIONS,
  SPENDING_BY_CATEGORY,
  TRANSACTIONS,
  TRANSFERS,
  USER,
} from "./seed";
import type {
  Account,
  Card,
  CashflowPoint,
  Device,
  Page,
  Payee,
  SecurityOverview,
  SessionEntry,
  SpendingSlice,
  Transaction,
  Transfer,
  User,
} from "./types";

export * from "./types";
export { delay, LATENCY } from "./delay";
export * from "./format";
export { NOW, DEMO_2FA_CODE } from "./seed";

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

export interface TransactionQuery {
  accountId?: string;
  cursor?: string | null;
  category?: string;
  search?: string;
  limit?: number;
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

export async function getPayees(): Promise<Payee[]> {
  await delay(LATENCY.normal);
  return clone(
    [...PAYEES].sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name)),
  );
}

export async function getPayee(id: string): Promise<Payee | null> {
  await delay(LATENCY.fast);
  return clone(PAYEES.find((p) => p.id === id) ?? null);
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

export async function setCardFrozen(id: string, frozen: boolean): Promise<Card | null> {
  await delay(LATENCY.fast);
  const card = cards.find((c) => c.id === id);
  if (!card) return null;
  card.frozen = frozen;
  return clone(card);
}
