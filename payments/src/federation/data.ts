/**
 * Federated data layer for the Payments micro-frontend. Framework-agnostic
 * async functions the shell drives from its route loaders/actions over MF.
 */
import {
  createTransfer,
  getAccounts,
  getPayees,
  getTransfers,
  type Account,
  type CreateTransferInput,
  type Payee,
  type Transfer,
  type TransferResult,
} from "@/mock";

export interface TransferContext {
  accounts: Account[];
  payees: Payee[];
}

export async function loadTransferContext(): Promise<TransferContext> {
  const [accounts, payees] = await Promise.all([getAccounts(), getPayees()]);
  return { accounts: accounts.filter((a) => a.type !== "investment"), payees };
}

export async function loadPayees(): Promise<Payee[]> {
  return getPayees();
}

export interface TransfersData {
  scheduled: Transfer[];
  history: Transfer[];
}

export async function loadTransfers(): Promise<TransfersData> {
  return getTransfers();
}

export async function submitTransfer(input: CreateTransferInput): Promise<TransferResult> {
  return createTransfer(input);
}

export type { Account, Payee, Transfer, TransferResult, CreateTransferInput };
