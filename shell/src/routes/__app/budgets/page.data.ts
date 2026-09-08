import type { ActionFunctionArgs, LoaderFunctionArgs } from "@modern-js/runtime/router";
import type { TransactionCategory } from "@/mock";
import { getSession } from "@/mock/session";
import { serverStamp, type ServerStamp } from "@/lib/ssr";
import { contributeGoal, loadBudgetProgress, loadSavingsGoals, saveBudget } from "accounts/data";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  getSession(request);
  const [progress, goals] = await Promise.all([loadBudgetProgress(), loadSavingsGoals()]);
  return { ...progress, goals, render: serverStamp("shell") as ServerStamp };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  if (intent === "budget") {
    await saveBudget(
      String(form.get("category")) as TransactionCategory,
      Math.round(Number(form.get("dollars") ?? "0") * 100),
    );
  } else if (intent === "goal") {
    await contributeGoal(
      String(form.get("goalId")),
      Math.round(Number(form.get("dollars") ?? "0") * 100),
    );
  }
  const [progress, goals] = await Promise.all([loadBudgetProgress(), loadSavingsGoals()]);
  return { ...progress, goals };
};
