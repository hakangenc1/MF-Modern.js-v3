import { CalendarClock, CheckCircle2, Loader2, Repeat, XCircle } from "lucide-react";
import {
  formatCurrency,
  formatDate,
  type RecurringRule,
  type Transfer,
  type TransferStatus,
} from "@/mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Money, PageHeader, SectionCard } from "@/components/patterns/kit";
import type { TransfersData } from "./data";

const STATUS: Record<TransferStatus, { label: string; variant: "secondary" | "outline" | "destructive" }> = {
  scheduled: { label: "Scheduled", variant: "outline" },
  processing: { label: "Processing", variant: "secondary" },
  completed: { label: "Completed", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
};

export default function ActivityView({
  data,
  pendingId = null,
  allowRecurring = true,
  onCancel,
  onToggleRecurring,
}: {
  data: TransfersData;
  pendingId?: string | null;
  /** `payments.advanced` entitlement — the shell passes this; standalone = true. */
  allowRecurring?: boolean;
  onCancel?: (id: string) => void;
  onToggleRecurring?: (id: string, active: boolean) => void;
}) {
  return (
    <>
      <PageHeader
        title="Payment activity"
        description="Scheduled, recurring and past transfers."
        origin={{ name: "payments", port: 3002 }}
      />

      <Tabs defaultValue="scheduled" className="mt-4">
        <TabsList>
          <TabsTrigger value="scheduled" className="gap-1.5">
            <CalendarClock className="size-4" /> Scheduled ({data.scheduled.length})
          </TabsTrigger>
          {allowRecurring ? (
            <TabsTrigger value="recurring" className="gap-1.5">
              <Repeat className="size-4" /> Recurring ({data.recurring.length})
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="history" className="gap-1.5">
            <CheckCircle2 className="size-4" /> History ({data.history.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled">
          <TransferTable
            rows={data.scheduled}
            dateLabel="Executes"
            emptyText="Nothing scheduled."
            pendingId={pendingId}
            onCancel={onCancel}
          />
        </TabsContent>

        <TabsContent value="recurring">
          <SectionCard bodyClassName="p-0">
            {data.recurring.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No recurring rules.</p>
            ) : (
              <ul className="divide-y">
                {data.recurring.map((r) => (
                  <RecurringRow
                    key={r.id}
                    rule={r}
                    pending={pendingId === r.id}
                    onToggle={onToggleRecurring}
                  />
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="history">
          <TransferTable rows={data.history} dateLabel="Date" emptyText="No past transfers." />
        </TabsContent>
      </Tabs>
    </>
  );
}

function RecurringRow({
  rule,
  pending,
  onToggle,
}: {
  rule: RecurringRule;
  pending: boolean;
  onToggle?: (id: string, active: boolean) => void;
}) {
  return (
    <li className="flex items-center gap-4 px-5 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{rule.toName}</p>
        <p className="text-xs text-muted-foreground">
          {formatCurrency(rule.amount)} · {rule.cadence} · next {formatDate(rule.nextRun, "medium")}
        </p>
      </div>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      <Switch
        checked={rule.active}
        disabled={pending || !onToggle}
        onCheckedChange={(v) => onToggle?.(rule.id, v)}
      />
    </li>
  );
}

function TransferTable({
  rows,
  dateLabel,
  emptyText,
  pendingId = null,
  onCancel,
}: {
  rows: Transfer[];
  dateLabel: string;
  emptyText: string;
  pendingId?: string | null;
  onCancel?: (id: string) => void;
}) {
  return (
    <SectionCard bodyClassName="p-0">
      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payee</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>{dateLabel}</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              {onCancel ? <TableHead className="text-right">Action</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => {
              const s = STATUS[t.status];
              const cancellable = onCancel && (t.status === "scheduled" || t.status === "processing");
              return (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">
                    {t.toName}
                    {t.kind === "internal" ? (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        Own account
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.reference}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(t.executeAt, "medium")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.variant} className="gap-1">
                      {t.status === "failed" ? <XCircle className="size-3" /> : null}
                      {s.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Money cents={-t.amount} />
                  </TableCell>
                  {onCancel ? (
                    <TableCell className="text-right">
                      {cancellable ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pendingId === t.id}
                          onClick={() => onCancel(t.id)}
                        >
                          {pendingId === t.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : null}
                          Cancel
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </SectionCard>
  );
}
