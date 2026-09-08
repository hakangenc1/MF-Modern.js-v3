import { useState } from "react";
import { CalendarClock, CheckCircle2, XCircle } from "lucide-react";
import { formatCurrency, formatDate, type Transfer, type TransferStatus } from "@/mock";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Money, PageHeader } from "@/components/patterns/kit";
import type { TransfersData } from "./data";

const STATUS: Record<TransferStatus, { label: string; variant: "secondary" | "outline" | "destructive" }> = {
  scheduled: { label: "Scheduled", variant: "outline" },
  processing: { label: "Processing", variant: "secondary" },
  completed: { label: "Completed", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
};

// A plain state toggle rather than Radix <Tabs>: the tab triggers get a
// `useId`-derived `aria-controls`, and Modern.js streamed SSR numbers `useId`
// differently on the server than the client (see README). Both panels render
// server-side; only visibility flips.
export default function ActivityView({ data }: { data: TransfersData }) {
  const [tab, setTab] = useState<"scheduled" | "history">("scheduled");
  return (
    <>
      <PageHeader
        title="Payment activity"
        description="Scheduled and past transfers."
        origin={{ name: "payments", port: 3002 }}
      />

      <div className="inline-flex gap-1 rounded-lg bg-muted p-1">
        <Button
          type="button"
          size="sm"
          variant={tab === "scheduled" ? "secondary" : "ghost"}
          className="gap-1.5"
          aria-pressed={tab === "scheduled"}
          onClick={() => setTab("scheduled")}
        >
          <CalendarClock className="size-4" /> Scheduled ({data.scheduled.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "history" ? "secondary" : "ghost"}
          className="gap-1.5"
          aria-pressed={tab === "history"}
          onClick={() => setTab("history")}
        >
          <CheckCircle2 className="size-4" /> History ({data.history.length})
        </Button>
      </div>

      <div className="mt-4" hidden={tab !== "scheduled"}>
        <TransferTable rows={data.scheduled} dateLabel="Executes" emptyText="Nothing scheduled." />
      </div>
      <div className="mt-4" hidden={tab !== "history"}>
        <TransferTable rows={data.history} dateLabel="Date" emptyText="No past transfers." />
      </div>
    </>
  );
}

function TransferTable({
  rows,
  dateLabel,
  emptyText,
}: {
  rows: Transfer[];
  dateLabel: string;
  emptyText: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{rows.length} transfer{rows.length === 1 ? "" : "s"}</CardTitle>
        <CardDescription>Most recent first</CardDescription>
      </CardHeader>
      <CardContent>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => {
                const s = STATUS[t.status];
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.toName}</TableCell>
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
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
