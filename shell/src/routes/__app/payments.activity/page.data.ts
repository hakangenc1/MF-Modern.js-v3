import type { ActionFunctionArgs, LoaderFunctionArgs } from "@modern-js/runtime/router";
import { getSession } from "@/mock/session";
import { cancelScheduledTransfer, loadTransfers, toggleRecurring } from "payments/data";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  getSession(request);
  return loadTransfers();
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  if (intent === "cancel") await cancelScheduledTransfer(String(form.get("id")));
  if (intent === "recurring")
    await toggleRecurring(String(form.get("id")), form.get("active") === "true");
  return loadTransfers();
};
