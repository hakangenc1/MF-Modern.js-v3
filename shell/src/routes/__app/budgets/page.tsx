import { useFetcher, useLoaderData } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import type { BudgetProgress, SavingsGoal, TransactionCategory } from "@/mock";
import BudgetsView from "accounts/BudgetsView";

interface Data {
  rows: BudgetProgress[];
  totalLimit: number;
  totalSpent: number;
  goals: SavingsGoal[];
}

export default function BudgetsPage() {
  const data = useLoaderData() as Data;
  const fetcher = useFetcher<Data>();
  const current = fetcher.data ?? data;
  const savingCategory =
    fetcher.state !== "idle" && fetcher.formData?.get("intent") === "budget"
      ? (fetcher.formData?.get("category") as string | null)
      : null;
  const savingGoalId =
    fetcher.state !== "idle" && fetcher.formData?.get("intent") === "goal"
      ? (fetcher.formData?.get("goalId") as string | null)
      : null;

  return (
    <>
      <Helmet>
        <title>Budgets · Northwind Bank</title>
      </Helmet>
      <BudgetsView
        rows={current.rows}
        totalLimit={current.totalLimit}
        totalSpent={current.totalSpent}
        goals={current.goals}
        savingCategory={savingCategory}
        savingGoalId={savingGoalId}
        onSaveBudget={(category: TransactionCategory, dollars: number) =>
          fetcher.submit(
            { intent: "budget", category, dollars: String(dollars) },
            { method: "post" },
          )
        }
        onContribute={(goalId: string, dollars: number) =>
          fetcher.submit({ intent: "goal", goalId, dollars: String(dollars) }, { method: "post" })
        }
      />
    </>
  );
}
