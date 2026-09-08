/**
 * Federated data layer for the Payments micro-frontend. Framework-agnostic
 * async functions the shell drives from its route loaders/actions over MF.
 */
import {
  cancelTransfer,
  createInternalTransfer,
  createPayee,
  createTransfer,
  deletePayee,
  getAccounts,
  getPayees,
  getRecurringRules,
  getTransfers,
  setRecurringActive,
  updatePayee,
  type Account,
  type CreateTransferInput,
  type InternalTransferInput,
  type Payee,
  type PayeeInput,
  type RecurringRule,
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
  recurring: RecurringRule[];
}

export async function loadTransfers(): Promise<TransfersData> {
  const [t, recurring] = await Promise.all([getTransfers(), getRecurringRules()]);
  return { ...t, recurring };
}

export async function submitTransfer(input: CreateTransferInput): Promise<TransferResult> {
  return createTransfer(input);
}

export async function submitInternalTransfer(
  input: InternalTransferInput,
): Promise<TransferResult> {
  return createInternalTransfer(input);
}

export async function cancelScheduledTransfer(id: string): Promise<Transfer[]> {
  return cancelTransfer(id);
}

export async function toggleRecurring(id: string, active: boolean): Promise<RecurringRule[]> {
  return setRecurringActive(id, active);
}

export async function addPayee(input: PayeeInput): Promise<Payee[]> {
  return createPayee(input);
}

export async function editPayee(
  id: string,
  input: Partial<PayeeInput & { favorite: boolean }>,
): Promise<Payee[]> {
  return updatePayee(id, input);
}

export async function removePayee(id: string): Promise<Payee[]> {
  return deletePayee(id);
}

export type {
  Account,
  Payee,
  Transfer,
  TransferResult,
  CreateTransferInput,
  InternalTransferInput,
  PayeeInput,
  RecurringRule,
};
