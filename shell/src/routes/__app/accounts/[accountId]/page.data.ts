import { defer, type ActionFunctionArgs, type LoaderFunctionArgs } from "@modern-js/runtime/router";
import type { TransactionCategory } from "@/mock";
import {
  loadAccountDetail,
  loadAccountHeader,
  loadTransaction,
  updateTransactionCategory,
  updateTransactionNote,
} from "accounts/data";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const accountId = params.accountId!;
  const url = new URL(request.url);
  const txnId = url.searchParams.get("txn");
  const account = await loadAccountHeader(accountId);
  const detail = loadAccountDetail(accountId, request);
  return defer({
    account,
    category: detail.category,
    search: detail.search,
    sort: detail.sort,
    dir: detail.dir,
    transactions: detail.transactions,
    txn: txnId ? loadTransaction(txnId) : Promise.resolve(null),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const id = String(form.get("id"));
  const intent = String(form.get("intent") ?? "");
  if (intent === "category") {
    return { txn: await updateTransactionCategory(id, String(form.get("category")) as TransactionCategory) };
  }
  if (intent === "note") {
    return { txn: await updateTransactionNote(id, String(form.get("note") ?? "")) };
  }
  return {};
};
