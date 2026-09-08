import { useState, type SelectHTMLAttributes } from "react";
import { ArrowRight, CheckCircle2, Loader2, Send } from "lucide-react";
import { formatCurrency, type Transfer } from "@/mock";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Money } from "@/components/patterns/kit";
import type { TransferContext } from "./data";

export interface TransferValues {
  fromAccountId: string;
  toPayeeId: string;
  amount: string;
  reference: string;
  when: "now" | "scheduled";
}

export default function TransferView({
  context,
  onSubmit,
  pending = false,
  result,
  error,
}: {
  context: TransferContext;
  onSubmit: (values: TransferValues) => void;
  pending?: boolean;
  result?: { ok: boolean; transfer?: Transfer } | null;
  error?: string | null;
}) {
  const { accounts, payees } = context;
  const [values, setValues] = useState<TransferValues>({
    fromAccountId: accounts[0]?.id ?? "",
    toPayeeId: payees[0]?.id ?? "",
    amount: "",
    reference: "",
    when: "now",
  });
  const [reviewing, setReviewing] = useState(false);

  const from = accounts.find((a) => a.id === values.fromAccountId);
  const payee = payees.find((p) => p.id === values.toPayeeId);
  const amountCents = Math.round(Number(values.amount || "0") * 100);
  const valid = amountCents > 0 && from && payee && amountCents <= (from?.available ?? 0);

  if (result?.ok && result.transfer) {
    return <Confirmation transfer={result.transfer} fromName={from?.name ?? ""} />;
  }

  const set = (patch: Partial<TransferValues>) => setValues((v) => ({ ...v, ...patch }));

  return (
    <>
      <PageHeader title="Send money" description="Move money to a saved payee, now or scheduled." origin={{ name: "payments", port: 3002 }} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Transfer details</CardTitle>
            <CardDescription>Review before confirming — transfers are final.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="fromAccountId">From account</Label>
              <NativeSelect
                id="fromAccountId"
                value={values.fromAccountId}
                onChange={(e) => set({ fromAccountId: e.target.value })}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {formatCurrency(a.available)} available
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="toPayeeId">To payee</Label>
              <NativeSelect
                id="toPayeeId"
                value={values.toPayeeId}
                onChange={(e) => set({ toPayeeId: e.target.value })}
              >
                {payees.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.bank} {p.accountMask}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={values.amount}
                  onChange={(e) => set({ amount: e.target.value.replace(/[^0-9.]/g, "") })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  placeholder="e.g. Rent, invoice #"
                  value={values.reference}
                  onChange={(e) => set({ reference: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>When</Label>
              <div className="flex gap-2">
                {(["now", "scheduled"] as const).map((w) => (
                  <Button
                    key={w}
                    type="button"
                    variant={values.when === w ? "default" : "outline"}
                    size="sm"
                    onClick={() => set({ when: w })}
                  >
                    {w === "now" ? "Send now" : "Schedule for later"}
                  </Button>
                ))}
              </div>
            </div>

            <Button disabled={!valid} onClick={() => setReviewing(true)} className="w-full">
              Review transfer <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="From" value={from?.name ?? "—"} />
            <Row label="To" value={payee?.name ?? "—"} />
            <Row label="Amount" value={amountCents > 0 ? formatCurrency(amountCents) : "—"} />
            <Row label="When" value={values.when === "now" ? "Immediately" : "Scheduled"} />
            {from && amountCents > 0 ? (
              <p className="pt-2 text-xs text-muted-foreground">
                Balance after: {formatCurrency(from.available - amountCents)}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={reviewing} onOpenChange={setReviewing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm transfer</DialogTitle>
            <DialogDescription>Double-check the details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-lg border p-4 text-sm">
            <Row label="From" value={from?.name ?? ""} />
            <Row label="To" value={`${payee?.name ?? ""} · ${payee?.accountMask ?? ""}`} />
            <Row label="Reference" value={values.reference || "Transfer"} />
            <div className="flex items-center justify-between pt-1">
              <span className="text-muted-foreground">Amount</span>
              <Money cents={amountCents} className="text-lg font-semibold" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewing(false)}>
              Back
            </Button>
            <Button
              disabled={pending}
              onClick={() => {
                setReviewing(false);
                onSubmit(values);
              }}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Confirm &amp; send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Confirmation({ transfer, fromName }: { transfer: Transfer; fromName: string }) {
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[color:var(--pos)]/10">
        <CheckCircle2 className="size-7 text-[color:var(--pos)]" />
      </div>
      <h1 className="text-xl font-semibold">Transfer {transfer.status}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatCurrency(transfer.amount)} to {transfer.toName}
      </p>
      <Card className="mt-6 text-left">
        <CardContent className="space-y-2 pt-6 text-sm">
          <Row label="From" value={fromName} />
          <Row label="Reference" value={transfer.reference} />
          <Row label="Reference ID" value={transfer.id} />
          <div className="flex items-center justify-between pt-1">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="secondary" className="capitalize">
              {transfer.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
      <div className="mt-6 flex justify-center gap-2">
        <Button asChild variant="outline">
          <a href="/payments/activity">View activity</a>
        </Button>
        <Button asChild>
          <a href="/payments">New transfer</a>
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}

// Native <select> instead of the Radix one: it renders and works identically on
// the server (no `useId`, so nothing to mismatch under Modern.js streamed SSR).
// Only classes that the host shell's Tailwind already emits are used here — a
// federated remote's own utility classes aren't in the host stylesheet — so the
// browser's default select chevron is kept rather than a custom-positioned one.
function NativeSelect({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
