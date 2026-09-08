import type { ActionFunctionArgs, LoaderFunctionArgs } from "@modern-js/runtime/router";
import { getSession } from "@/mock/session";
import { loadSessions, revokeSessionById } from "security/data";
export const loader = async ({ request }: LoaderFunctionArgs) => {
  getSession(request);
  return { sessions: await loadSessions() };
};
export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  return { sessions: await revokeSessionById(String(form.get("id") ?? "")) };
};
