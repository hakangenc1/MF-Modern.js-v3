import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Send } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { TwoFactorChallenge } from "twofactor/TwoFactorChallenge";
import { verifyCode } from "twofactor/data";
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
  // The review dialog has two steps: confirm the details, then pass 2FA.
  const [step, setStep] = useState<"review" | "verify">("review");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const from = accounts.find((a) => a.id === values.fromAccountId);
  const payee = payees.find((p) => p.id === values.toPayeeId);
  const amountCents = Math.round(Number(values.amount || "0") * 100);
  const valid = amountCents > 0 && from && payee && amountCents <= (from?.available ?? 0);

  // Reset the dialog to step one whenever it closes.
  useEffect(() => {
    if (!reviewing) {
      setStep("review");
      setVerifyError(null);
      setVerifying(false);
    }
  }, [reviewing]);

  if (result?.ok && result.transfer) {
    return <Confirmation transfer={result.transfer} fromName={from?.name ?? ""} />;
  }

  const set = (patch: Partial<TransferValues>) => setValues((v) => ({ ...v, ...patch }));

  const handleVerify = async (code: string) => {
    setVerifying(true);
    setVerifyError(null);
    const res = await verifyCode(code);
    setVerifying(false);
    if (res.ok) {
      setReviewing(false);
      onSubmit(values);
    } else {
      setVerifyError(res.error ?? "Verification failed.");
    }
  };

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
              <Select value={values.fromAccountId} onValueChange={(v) => set({ fromAccountId: v })}>
                <SelectTrigger id="fromAccountId">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} — {formatCurrency(a.available)} available
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="toPayeeId">To payee</Label>
              <Select value={values.toPayeeId} onValueChange={(v) => set({ toPayeeId: v })}>
                <SelectTrigger id="toPayeeId">
                  <SelectValue placeholder="Select a payee" />
                </SelectTrigger>
                <SelectContent>
                  {payees.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {p.bank} {p.accountMask}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Tabs value={values.when} onValueChange={(v) => set({ when: v as TransferValues["when"] })}>
                <TabsList>
                  <TabsTrigger value="now">Send now</TabsTrigger>
                  <TabsTrigger value="scheduled">Schedule for later</TabsTrigger>
                </TabsList>
              </Tabs>
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
          {step === "review" ? (
            <>
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
                <Button disabled={pending} onClick={() => setStep("verify")}>
                  <Send className="size-4" />
                  Confirm &amp; send
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Verify this transfer</DialogTitle>
                <DialogDescription>
                  Sending {formatCurrency(amountCents)} to {payee?.name ?? "your payee"} needs a code
                  from your authenticator.
                </DialogDescription>
              </DialogHeader>
              <TwoFactorChallenge
                title="Authorize transfer"
                description="Enter your 6-digit authenticator code to send this payment."
                pending={verifying || pending}
                error={verifyError}
                onSubmit={handleVerify}
              />
              <DialogFooter>
                <Button
                  variant="ghost"
                  disabled={verifying}
                  onClick={() => {
                    setStep("review");
                    setVerifyError(null);
                  }}
                >
                  Back to review
                </Button>
              </DialogFooter>
            </>
          )}
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
