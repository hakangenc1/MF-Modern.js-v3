import type { LoaderFunctionArgs } from "@modern-js/runtime/router";
import { loadAccountsList, loadStatements } from "@/federation/data";

export const loader = async (_args: LoaderFunctionArgs) => {
  const [{ accounts }, statements] = await Promise.all([loadAccountsList(), loadStatements()]);
  return { accounts, statements };
};
