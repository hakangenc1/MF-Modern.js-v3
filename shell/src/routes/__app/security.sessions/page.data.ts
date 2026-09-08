import type { ActionFunctionArgs, LoaderFunctionArgs } from "@modern-js/runtime/router";
import { requireEntitlement } from "@/mock/session";
import { loadSessions, revokeSessionById } from "security/data";
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const denied = requireEntitlement(request, "security.advanced");
  if (denied) return denied;
  return { sessions: await loadSessions() };
};
export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  return { sessions: await revokeSessionById(String(form.get("id") ?? "")) };
};
