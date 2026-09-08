import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  formatCurrency,
  formatDate,
  type Transaction,
  type TransactionCategory,
} from "@/mock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Money } from "@/components/patterns/kit";

const CATEGORIES: TransactionCategory[] = [
  "Income",
  "Groceries",
  "Dining",
  "Transport",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Health",
  "Travel",
  "Transfers",
  "Fees",
];

/**
 * Body of the transaction detail sheet — router-free. The shell owns the
 * <Sheet> and routing; this drives re-categorise / note through callbacks and
 * shows per-field spinners via `savingField`.
 */
export default function TransactionDetail({
  txn,
  savingField = null,
  onCategory,
  onNote,
}: {
  txn: Transaction;
  savingField?: "category" | "note" | null;
  onCategory: (category: TransactionCategory) => void;
  onNote: (note: string) => void;
}) {
  const [note, setNote] = useState(txn.note ?? "");

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold">{txn.merchant}</p>
          {txn.status === "pending" ? (
            <Badge variant="outline" className="text-[10px]">
              Pending
            </Badge>
          ) : null}
        </div>
        <Money
          cents={txn.amount}
          colorize
          showSign
          className="mt-1 block text-2xl font-semibold"
        />
      </div>

      <dl className="divide-y text-sm">
        {[
          { label: "Date", value: formatDate(txn.date, "long") },
          { label: "Description", value: txn.description },
          { label: "Running balance", value: formatCurrency(txn.runningBalance) },
          { label: "Status", value: txn.status === "pending" ? "Pending" : "Posted" },
        ].map((r) => (
          <div key={r.label} className="flex justify-between gap-4 py-2 first:pt-0">
            <dt className="text-muted-foreground">{r.label}</dt>
            <dd className="text-right font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          Category
          {savingField === "category" ? <Loader2 className="size-3.5 animate-spin" /> : null}
        </label>
        <Select
          value={txn.category}
          onValueChange={(v) => onCategory(v as TransactionCategory)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Re-categorising updates your spending charts and budgets.
        </p>
      </div>

      <div className="grid gap-2">
        <label htmlFor="txn-note" className="text-sm font-medium">
          Note
        </label>
        <Textarea
          id="txn-note"
          value={note}
          placeholder="Add a note for your records…"
          onChange={(e) => setNote(e.target.value)}
        />
        <Button
          size="sm"
          className="justify-self-start"
          disabled={savingField === "note" || note === (txn.note ?? "")}
          onClick={() => onNote(note)}
        >
          {savingField === "note" ? <Loader2 className="size-4 animate-spin" /> : null}
          Save note
        </Button>
      </div>
    </div>
  );
}
