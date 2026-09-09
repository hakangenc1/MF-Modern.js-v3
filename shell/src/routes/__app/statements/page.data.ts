import { serverStamp, type ServerStamp } from "@/lib/ssr";
import { loadAccountsList, loadStatements } from "accounts/data";

export const loader = async () => {
  const [{ accounts }, statements] = await Promise.all([loadAccountsList(), loadStatements()]);
  return { accounts, statements, render: serverStamp("shell") as ServerStamp };
};
