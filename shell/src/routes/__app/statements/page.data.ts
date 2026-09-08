import type { LoaderFunctionArgs } from "@modern-js/runtime/router";
import { getSession } from "@/mock/session";
import { serverStamp, type ServerStamp } from "@/lib/ssr";
import { loadAccountsList, loadStatements } from "accounts/data";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  getSession(request);
  const [{ accounts }, statements] = await Promise.all([loadAccountsList(), loadStatements()]);
  return { accounts, statements, render: serverStamp("shell") as ServerStamp };
};
