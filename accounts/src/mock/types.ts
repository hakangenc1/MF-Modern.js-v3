export type AccountType = "checking" | "savings" | "credit" | "investment";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  /** User-set nickname, shown in place of `name` when present. */
  nickname?: string;
  /** Masked account/card number, e.g. "•••• 4821". */
  mask: string;
  /** Current balance in minor units (cents). Negative = owed (credit). */
  balance: number;
  /** Available balance in cents (may differ from balance for credit/holds). */
  available: number;
  /** Credit limit in cents, for credit accounts. */
  creditLimit?: number;
  currency: "USD";
  /** APY as a decimal fraction, e.g. 0.041 = 4.10%. */
  apy?: number;
  openedAt: string;
  /** 12-point balance history (oldest → newest), cents. */
  history: number[];
}

export type TransactionStatus = "posted" | "pending";
export type TransactionCategory =
  | "Income"
  | "Groceries"
  | "Dining"
  | "Transport"
  | "Shopping"
  | "Bills & Utilities"
  | "Entertainment"
  | "Health"
  | "Travel"
  | "Transfers"
  | "Fees";

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  merchant: string;
  category: TransactionCategory;
  /** Signed amount in cents. Negative = debit, positive = credit. */
  amount: number;
  status: TransactionStatus;
  /** Account balance in cents immediately after this transaction posted. */
  runningBalance: number;
  /** Free-text note the user attached. */
  note?: string;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  total: number;
}

export interface SpendingSlice {
  category: TransactionCategory;
  amount: number; // cents, positive
}

export interface CashflowPoint {
  month: string; // "Jan"
  income: number; // cents
  spending: number; // cents
}

export interface Payee {
  id: string;
  name: string;
  bank: string;
  accountMask: string;
  reference?: string;
  lastPaidAt?: string;
  favorite: boolean;
}

export type TransferStatus = "scheduled" | "processing" | "completed" | "failed";

export interface Transfer {
  id: string;
  fromAccountId: string;
  toPayeeId: string;
  toName: string;
  amount: number; // cents
  currency: "USD";
  reference: string;
  status: TransferStatus;
  createdAt: string;
  executeAt: string;
  /** "internal" = between the user's own accounts (toPayeeId is an account id). */
  kind?: "external" | "internal";
}

export type RecurringCadence = "weekly" | "monthly";

export interface RecurringRule {
  id: string;
  fromAccountId: string;
  toPayeeId: string;
  toName: string;
  amount: number; // cents
  reference: string;
  cadence: RecurringCadence;
  nextRun: string;
  active: boolean;
}

export interface User {
  id: string;
  name: string;
  firstName: string;
  email: string;
  initials: string;
  memberSince: string;
  plan: "Personal" | "Premier" | "Private";
}

/**
 * Feature grants. In a real host-provided micro-frontend the portal resolves
 * these for the signed-in user and hands them to the shell; here the persona
 * carries the defaults and the shell threads the effective set down to every
 * remote as props. See docs/ARCHITECTURE.md §05a.
 */
export type Entitlement =
  | "budgets" // Budgets + savings goals: nav, /budgets, dashboard cards
  | "insights" // Insights analytics page + nav
  | "cards.virtual" // Create / list virtual cards on /cards
  | "payments.advanced" // "Between my accounts" transfer mode + Recurring tab
  | "statements.export" // Statement CSV download
  | "security.advanced" // Device + session management (not the overview)
  | "wealth"; // Investment account + net-worth asset breakdown

export const ALL_ENTITLEMENTS: Entitlement[] = [
  "budgets",
  "insights",
  "cards.virtual",
  "payments.advanced",
  "statements.export",
  "security.advanced",
  "wealth",
];

export interface Persona {
  id: "premier" | "personal";
  label: string;
  user: User;
  /** One line shown under the name on the sign-in card. */
  tagline: string;
  /** What this persona sees (2–4 short bullets). */
  can: string[];
  /** What is hidden for this persona (empty for a full-access persona). */
  cannot: string[];
  entitlements: Entitlement[];
}

export interface Device {
  id: string;
  name: string;
  kind: "phone" | "laptop" | "tablet" | "desktop";
  os: string;
  lastActive: string;
  location: string;
  trusted: boolean;
  current: boolean;
}

export interface SessionEntry {
  id: string;
  browser: string;
  ip: string;
  location: string;
  startedAt: string;
  current: boolean;
}

export interface SecurityOverview {
  score: number; // 0-100
  twoFactorEnabled: boolean;
  method: "authenticator" | "sms" | "none";
  recoveryCodesRemaining: number;
  passwordUpdatedAt: string;
  alerts: { id: string; level: "info" | "warning"; title: string; detail: string; at: string }[];
}

export interface VirtualCard {
  id: string;
  label: string;
  mask: string;
  createdAt: string;
}

export interface Card {
  id: string;
  accountId: string;
  name: string;
  network: "Visa" | "Mastercard";
  mask: string;
  expiry: string;
  frozen: boolean;
  /** Reason recorded when the card was frozen (or lost). */
  freezeReason?: string;
  contactless: boolean;
  monthlyLimit: number; // cents
  monthlySpent: number; // cents
  color: "graphite" | "sapphire" | "emerald";
  /** Spend categories currently blocked on this card. */
  categoryLocks: TransactionCategory[];
  virtualCards: VirtualCard[];
  /** Set when the card was reported lost and reissued. */
  replacedAt?: string;
}

/* --------------------------------------------------------- budgets & goals */

export interface Budget {
  category: TransactionCategory;
  monthlyLimit: number; // cents
}

export interface BudgetProgress extends Budget {
  spent: number; // cents, last 30 days
  pct: number; // 0-100+ (over budget can exceed 100)
}

export interface SavingsGoal {
  id: string;
  accountId: string;
  name: string;
  target: number; // cents
  saved: number; // cents
  targetDate: string;
}

/* ------------------------------------------------------ profile & alerts */

export interface Profile {
  name: string;
  email: string;
  phone: string;
  address: string;
  marketingEmails: boolean;
  pushAlerts: boolean;
  /** accountId → nickname. */
  accountNicknames: Record<string, string>;
}

export type NotificationKind = "payment" | "security" | "statement" | "system";

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  at: string;
  read: boolean;
}

export interface Statement {
  id: string;
  accountId: string;
  /** "2026-08" */
  period: string;
  /** "August 2026" */
  label: string;
  opening: number; // cents
  closing: number; // cents
  totalIn: number; // cents
  totalOut: number; // cents
}
