import { Download } from "lucide-react";
import { formatCurrency, type Account, type Statement } from "@/mock";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionCard } from "@/components/patterns/kit";

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function downloadStatementCsv(account: Account, s: Statement) {
  const rows = [
    ["Field", "Value"],
    ["Account", account.nickname || account.name],
    ["Account number", account.mask],
    ["Statement period", s.label],
    ["Opening balance", (s.opening / 100).toFixed(2)],
    ["Total in", (s.totalIn / 100).toFixed(2)],
    ["Total out", (s.totalOut / 100).toFixed(2)],
    ["Closing balance", (s.closing / 100).toFixed(2)],
  ];
  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${s.period}-${account.mask.replace(/\D/g, "")}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Monthly statements, grouped by account. Router-free — CSV is generated in the
 * browser from the loaded data (no server round-trip, no routing puzzle).
 */
export default function StatementsView({
  accounts,
  statements,
  allowExport = true,
}: {
  accounts: Account[];
  statements: Statement[];
  /** `statements.export` entitlement — the shell passes this; standalone = true. */
  allowExport?: boolean;
}) {
  return (
    <>
      <PageHeader
        origin={{ name: "accounts", port: 3001 }}
        title="Statements"
        description={
          allowExport
            ? "Monthly account statements. Download any month as CSV."
            : "Monthly account statements."
        }
      />

      <div className="mt-6 space-y-4">
        {accounts.map((account) => {
          const rows = statements.filter((s) => s.accountId === account.id);
          if (!rows.length) return null;
          return (
            <SectionCard
              key={account.id}
              title={account.nickname || account.name}
              description={account.mask}
              bodyClassName="p-0"
            >
              <ul className="divide-y">
                {rows.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Closing balance {formatCurrency(s.closing)} ·{" "}
                        <span className="text-[color:var(--pos)]">
                          +{formatCurrency(s.totalIn)}
                        </span>{" "}
                        /{" "}
                        <span className="text-[color:var(--neg)]">
                          −{formatCurrency(s.totalOut)}
                        </span>
                      </p>
                    </div>
                    {allowExport ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadStatementCsv(account, s)}
                      >
                        <Download className="size-4" /> CSV
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </SectionCard>
          );
        })}
      </div>
    </>
  );
}
