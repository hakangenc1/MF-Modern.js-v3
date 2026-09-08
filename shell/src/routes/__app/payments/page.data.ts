import type { ActionFunctionArgs, LoaderFunctionArgs } from "@modern-js/runtime/router";
import { getSession } from "@/mock/session";
import { loadTransferContext, submitTransfer } from "payments/data";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  getSession(request);
  return loadTransferContext();
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const amount = Math.round(Number(form.get("amount") ?? "0") * 100);
  const result = await submitTransfer({
    fromAccountId: String(form.get("fromAccountId") ?? ""),
    toPayeeId: String(form.get("toPayeeId") ?? ""),
    amount,
    reference: String(form.get("reference") ?? ""),
    when: String(form.get("when") ?? "now"),
  });
  return result.ok ? { result } : { error: result.error };
};
