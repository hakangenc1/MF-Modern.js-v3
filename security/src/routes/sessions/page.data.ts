import type { ActionFunctionArgs } from "@modern-js/runtime/router";
import { loadSessions, revokeSessionById } from "@/federation/data";
export const loader = async () => ({ sessions: await loadSessions() });
export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  return { sessions: await revokeSessionById(String(form.get("id") ?? "")) };
};
