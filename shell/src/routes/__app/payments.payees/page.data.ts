import type { ActionFunctionArgs, LoaderFunctionArgs } from "@modern-js/runtime/router";
import { getSession } from "@/mock/session";
import { addPayee, editPayee, loadPayees, removePayee } from "payments/data";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  getSession(request);
  return { payees: await loadPayees() };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  const input = {
    name: String(form.get("name") ?? ""),
    bank: String(form.get("bank") ?? ""),
    accountMask: String(form.get("accountMask") ?? ""),
    reference: String(form.get("reference") ?? ""),
  };
  if (intent === "create") return { payees: await addPayee(input) };
  if (intent === "update") return { payees: await editPayee(String(form.get("id")), input) };
  if (intent === "favorite")
    return {
      payees: await editPayee(String(form.get("id")), { favorite: form.get("favorite") === "true" }),
    };
  if (intent === "delete") return { payees: await removePayee(String(form.get("id"))) };
  return { payees: await loadPayees() };
};
