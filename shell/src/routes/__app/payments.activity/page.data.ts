import type { ActionFunctionArgs } from "@modern-js/runtime/router";
import { cancelScheduledTransfer, loadTransfers, toggleRecurring } from "payments/data";

export const loader = async () => loadTransfers();

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  if (intent === "cancel") await cancelScheduledTransfer(String(form.get("id")));
  if (intent === "recurring")
    await toggleRecurring(String(form.get("id")), form.get("active") === "true");
  return loadTransfers();
};
