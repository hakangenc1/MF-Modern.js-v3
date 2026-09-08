import type { ActionFunctionArgs, LoaderFunctionArgs } from "@modern-js/runtime/router";
import type { TransactionCategory } from "@/mock";
import { contributeGoal, loadBudgetProgress, loadSavingsGoals, saveBudget } from "@/federation/data";

export const loader = async (_args: LoaderFunctionArgs) => {
  const [progress, goals] = await Promise.all([loadBudgetProgress(), loadSavingsGoals()]);
  return { ...progress, goals };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  if (intent === "budget")
    await saveBudget(
      String(form.get("category")) as TransactionCategory,
      Math.round(Number(form.get("dollars") ?? "0") * 100),
    );
  else if (intent === "goal")
    await contributeGoal(
      String(form.get("goalId")),
      Math.round(Number(form.get("dollars") ?? "0") * 100),
    );
  const [progress, goals] = await Promise.all([loadBudgetProgress(), loadSavingsGoals()]);
  return { ...progress, goals };
};
