import { useFetcher, useLoaderData } from "@modern-js/runtime/router";
import type { BudgetProgress, SavingsGoal, TransactionCategory } from "@/mock";
import BudgetsView from "@/federation/BudgetsView";

interface Data {
  rows: BudgetProgress[];
  totalLimit: number;
  totalSpent: number;
  goals: SavingsGoal[];
}

export default function Page() {
  const data = useLoaderData() as Data;
  const fetcher = useFetcher<Data>();
  const current = fetcher.data ?? data;
  return (
    <BudgetsView
      rows={current.rows}
      totalLimit={current.totalLimit}
      totalSpent={current.totalSpent}
      goals={current.goals}
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
  );
}
