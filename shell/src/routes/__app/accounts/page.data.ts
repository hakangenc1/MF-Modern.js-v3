import { defer, type LoaderFunctionArgs } from "@modern-js/runtime/router";
import { loadAccountsList, loadRecentActivity } from "accounts/data";
import { getSession } from "@/mock/session";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  getSession(request);
  const list = await loadAccountsList();
  return defer({ ...list, activity: loadRecentActivity(8) });
};
