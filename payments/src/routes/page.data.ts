import type { ActionFunctionArgs } from "@modern-js/runtime/router";
import { loadTransferContext, submitTransfer } from "@/federation/data";

export const loader = async () => loadTransferContext();

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const amount = Math.round(Number(form.get("amount") ?? "0") * 100);
  const result = await submitTransfer({
    fromAccountId: String(form.get("fromAccountId") ?? ""),
    toPayeeId: String(form.get("toPayeeId") ?? ""),
    amount,
    reference: String(form.get("reference") ?? ""),
    when: (String(form.get("when") ?? "now") as "now" | "scheduled"),
  });
  return result.ok ? { result } : { error: result.error };
};
