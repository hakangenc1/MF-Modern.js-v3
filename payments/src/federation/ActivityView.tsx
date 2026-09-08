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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function ActivityView({ data }: { data: TransfersData }) {
  return (
    <>
      <PageHeader
        title="Payment activity"
        description="Scheduled and past transfers."
        origin={{ name: "payments", port: 3002 }}
      />

      <Tabs defaultValue="scheduled" className="mt-2">
        <TabsList>
          <TabsTrigger value="scheduled" className="gap-1.5">
            <CalendarClock className="size-4" /> Scheduled ({data.scheduled.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <CheckCircle2 className="size-4" /> History ({data.history.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="scheduled">
          <TransferTable rows={data.scheduled} dateLabel="Executes" emptyText="Nothing scheduled." />
        </TabsContent>
        <TabsContent value="history">
          <TransferTable rows={data.history} dateLabel="Date" emptyText="No past transfers." />
        </TabsContent>
      </Tabs>
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
