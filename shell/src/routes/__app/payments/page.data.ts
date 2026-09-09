import type { ActionFunctionArgs } from "@modern-js/runtime/router";
import { loadTransferContext, submitInternalTransfer, submitTransfer } from "payments/data";

export const loader = async () => loadTransferContext();

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const amount = Math.round(Number(form.get("amount") ?? "0") * 100);
  const mode = String(form.get("mode") ?? "payee");

  const result =
    mode === "internal"
      ? await submitInternalTransfer({
          fromAccountId: String(form.get("fromAccountId") ?? ""),
          toAccountId: String(form.get("toAccountId") ?? ""),
          amount,
          reference: String(form.get("reference") ?? ""),
        })
      : await submitTransfer({
          fromAccountId: String(form.get("fromAccountId") ?? ""),
          toPayeeId: String(form.get("toPayeeId") ?? ""),
          amount,
          reference: String(form.get("reference") ?? ""),
          when: String(form.get("when") ?? "now") as "now" | "scheduled",
        });

  return result.ok ? { result } : { error: result.error };
};
