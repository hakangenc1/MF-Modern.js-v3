export type AccountType = "checking" | "savings" | "credit" | "investment";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
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

export interface Card {
  id: string;
  accountId: string;
  name: string;
  network: "Visa" | "Mastercard";
  mask: string;
  expiry: string;
  frozen: boolean;
  contactless: boolean;
  monthlyLimit: number; // cents
  monthlySpent: number; // cents
  color: "graphite" | "sapphire" | "emerald";
}
