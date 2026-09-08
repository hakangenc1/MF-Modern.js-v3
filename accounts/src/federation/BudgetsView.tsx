import { useState } from "react";
import { Check, Loader2, Pencil } from "lucide-react";
import {
  formatCurrency,
  type BudgetProgress,
  type SavingsGoal,
  type TransactionCategory,
} from "@/mock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionCard, StatTile } from "@/components/patterns/kit";

export interface BudgetsViewProps {
  rows: BudgetProgress[];
  totalLimit: number;
  totalSpent: number;
  goals: SavingsGoal[];
  /** category currently being saved (spinner on that row). */
  savingCategory?: string | null;
  savingGoalId?: string | null;
  onSaveBudget: (category: TransactionCategory, dollars: number) => void;
  onContribute: (goalId: string, dollars: number) => void;
}

export default function BudgetsView({
  rows,
  totalLimit,
  totalSpent,
  goals,
  savingCategory = null,
  savingGoalId = null,
  onSaveBudget,
  onContribute,
}: BudgetsViewProps) {
  const overallPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  return (
    <>
      <PageHeader
        origin={{ name: "accounts", port: 3001 }}
        title="Budgets"
        description="Monthly targets by category, tracked against your last 30 days of spending."
      />

      <div className="mt-6 grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-3">
        <StatTile label="Budgeted" value={formatCurrency(totalLimit)} />
        <StatTile
          label="Spent (30d)"
          value={
            <span style={{ color: totalSpent > totalLimit ? "var(--neg)" : undefined }}>
              {formatCurrency(totalSpent)}
            </span>
          }
        />
        <StatTile label="Used" value={`${overallPct}%`} hint={`${formatCurrency(Math.max(0, totalLimit - totalSpent))} left`} />
      </div>

      <SectionCard className="mt-4" title="Category budgets" bodyClassName="p-0">
        <ul className="divide-y">
          {rows.map((r) => (
            <BudgetRow
              key={r.category}
              row={r}
              saving={savingCategory === r.category}
              onSave={(d) => onSaveBudget(r.category, d)}
            />
          ))}
        </ul>
      </SectionCard>

      <SectionCard className="mt-4" title="Savings goals" bodyClassName="space-y-4">
        {goals.map((g) => (
          <GoalRow
            key={g.id}
            goal={g}
            saving={savingGoalId === g.id}
            onContribute={(d) => onContribute(g.id, d)}
          />
        ))}
      </SectionCard>
    </>
  );
}

function BudgetRow({
  row,
  saving,
  onSave,
}: {
  row: BudgetProgress;
  saving: boolean;
  onSave: (dollars: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(Math.round(row.monthlyLimit / 100)));
  const over = row.spent > row.monthlyLimit;

  return (
    <li className="px-5 py-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{row.category}</span>
        {editing ? (
          <span className="flex items-center gap-1.5">
            <Input
              value={val}
              inputMode="numeric"
              onChange={(e) => setVal(e.target.value.replace(/[^0-9]/g, ""))}
              className="h-8 w-24"
            />
            <Button
              size="sm"
              disabled={saving}
              onClick={() => {
                onSave(Number(val || "0"));
                setEditing(false);
              }}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            </Button>
          </span>
        ) : (
          <button
            type="button"
            className="flex items-center gap-1.5 tabular-nums text-muted-foreground hover:text-foreground"
            onClick={() => {
              setVal(String(Math.round(row.monthlyLimit / 100)));
              setEditing(true);
            }}
          >
            {formatCurrency(row.spent)} / {formatCurrency(row.monthlyLimit)}
            <Pencil className="size-3.5" />
          </button>
        )}
      </div>
      <Progress
        value={Math.min(100, row.pct)}
        className="mt-2"
        aria-label={`${row.category} budget: ${row.pct}% of limit spent`}
      />
      {over ? (
        <p className="mt-1 text-xs text-[color:var(--neg)]">
          {formatCurrency(row.spent - row.monthlyLimit)} over budget
        </p>
      ) : null}
    </li>
  );
}

function GoalRow({
  goal,
  saving,
  onContribute,
}: {
  goal: SavingsGoal;
  saving: boolean;
  onContribute: (dollars: number) => void;
}) {
  const [val, setVal] = useState("");
  const pct = Math.round((goal.saved / goal.target) * 100);
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{goal.name}</p>
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatCurrency(goal.saved)} / {formatCurrency(goal.target)}
        </span>
      </div>
      <Progress value={pct} className="mt-2" aria-label={`${goal.name}: ${pct}% funded`} />
      <div className="mt-3 flex items-end gap-2">
        <div className="grid flex-1 gap-1.5">
          <label className="text-xs text-muted-foreground" htmlFor={`add-${goal.id}`}>
            Add to this goal (USD)
          </label>
          <Input
            id={`add-${goal.id}`}
            value={val}
            inputMode="numeric"
            placeholder="0"
            onChange={(e) => setVal(e.target.value.replace(/[^0-9]/g, ""))}
            className="h-8"
          />
        </div>
        <Button
          size="sm"
          disabled={saving || !val}
          onClick={() => {
            onContribute(Number(val || "0"));
            setVal("");
          }}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Add
        </Button>
      </div>
    </div>
  );
}
