import { useState } from "react";
import { Building2, Loader2, MoreHorizontal, Pencil, Plus, Send, Star, Trash2 } from "lucide-react";
import { formatDate, relativeTime, type Payee } from "@/mock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/patterns/kit";

export interface PayeeFormValues {
  name: string;
  bank: string;
  accountMask: string;
  reference: string;
}

export interface PayeesViewProps {
  payees: Payee[];
  pendingId?: string | null;
  creating?: boolean;
  onCreate?: (input: PayeeFormValues) => void;
  onUpdate?: (id: string, input: PayeeFormValues) => void;
  onFavorite?: (id: string, favorite: boolean) => void;
  onDelete?: (id: string) => void;
}

const EMPTY: PayeeFormValues = { name: "", bank: "", accountMask: "", reference: "" };

export default function PayeesView({
  payees,
  pendingId = null,
  creating = false,
  onCreate = () => {},
  onUpdate = () => {},
  onFavorite = () => {},
  onDelete = () => {},
}: PayeesViewProps) {
  const [dialog, setDialog] = useState<{ mode: "new" } | { mode: "edit"; payee: Payee } | null>(
    null,
  );
  const favorites = payees.filter((p) => p.favorite);
  const others = payees.filter((p) => !p.favorite);

  return (
    <>
      <PageHeader
        origin={{ name: "payments", port: 3002 }}
        title="Payees"
        description="People and businesses you can pay in a couple of taps."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialog({ mode: "new" })}>
              <Plus className="size-4" /> New payee
            </Button>
            <Button asChild size="sm">
              <a href="/payments">
                <Send className="size-4" /> Send money
              </a>
            </Button>
          </>
        }
      />

      {favorites.length ? (
        <Section title="Favorites">
          {favorites.map((p) => (
            <PayeeCard
              key={p.id}
              payee={p}
              pending={pendingId === p.id}
              onEdit={() => setDialog({ mode: "edit", payee: p })}
              onFavorite={onFavorite}
              onDelete={onDelete}
            />
          ))}
        </Section>
      ) : null}

      <Section title="All payees" className="mt-8">
        {others.map((p) => (
          <PayeeCard
            key={p.id}
            payee={p}
            pending={pendingId === p.id}
            onEdit={() => setDialog({ mode: "edit", payee: p })}
            onFavorite={onFavorite}
            onDelete={onDelete}
          />
        ))}
      </Section>

      <PayeeDialog
        open={!!dialog}
        creating={creating}
        initial={dialog?.mode === "edit" ? dialog.payee : undefined}
        onClose={() => setDialog(null)}
        onSubmit={(values) => {
          if (dialog?.mode === "edit") onUpdate(dialog.payee.id, values);
          else onCreate(values);
          setDialog(null);
        }}
      />
    </>
  );
}

function Section({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={className ?? "mt-6"}>
      <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

function PayeeCard({
  payee,
  pending,
  onEdit,
  onFavorite,
  onDelete,
}: {
  payee: Payee;
  pending: boolean;
  onEdit: () => void;
  onFavorite: (id: string, favorite: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Building2 className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <span className="truncate">{payee.name}</span>
              {payee.favorite ? (
                <Star className="size-3 shrink-0 fill-[color:var(--warning)] text-[color:var(--warning)]" />
              ) : null}
            </p>
            <p className="text-xs text-muted-foreground">
              {payee.bank} · <span className="font-mono">{payee.accountMask}</span>
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 shrink-0">
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MoreHorizontal className="size-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onFavorite(payee.id, !payee.favorite)}>
              <Star className="size-4" />
              {payee.favorite ? "Remove favorite" : "Add favorite"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-[color:var(--neg)] focus:text-[color:var(--neg)]"
              onClick={() => onDelete(payee.id)}
            >
              <Trash2 className="size-4" /> Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3 space-y-3">
        {payee.reference ? (
          <Badge variant="outline" className="font-normal">
            {payee.reference}
          </Badge>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {payee.lastPaidAt
            ? `Last paid ${relativeTime(payee.lastPaidAt)} · ${formatDate(payee.lastPaidAt, "short")}`
            : "Not paid yet"}
        </p>
        <Button asChild variant="outline" size="sm" className="w-full">
          <a href="/payments">Pay {payee.name.split(" ")[0]}</a>
        </Button>
      </div>
    </div>
  );
}

function PayeeDialog({
  open,
  creating,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  creating: boolean;
  initial?: Payee;
  onClose: () => void;
  onSubmit: (values: PayeeFormValues) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit payee" : "New payee"}</DialogTitle>
          <DialogDescription>
            {initial ? "Update this payee's details." : "Add someone you can pay."}
          </DialogDescription>
        </DialogHeader>
        {/* keyed so the fields reset whenever the target payee changes */}
        <PayeeForm
          key={initial?.id ?? "new"}
          creating={creating}
          initial={initial}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

function PayeeForm({
  creating,
  initial,
  onCancel,
  onSubmit,
}: {
  creating: boolean;
  initial?: Payee;
  onCancel: () => void;
  onSubmit: (values: PayeeFormValues) => void;
}) {
  const [v, setV] = useState<PayeeFormValues>(
    initial
      ? {
          name: initial.name,
          bank: initial.bank,
          accountMask: initial.accountMask,
          reference: initial.reference ?? "",
        }
      : EMPTY,
  );
  const set = (patch: Partial<PayeeFormValues>) => setV((prev) => ({ ...prev, ...patch }));

  return (
    <>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="p-name">Name</Label>
          <Input id="p-name" value={v.name} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="p-bank">Bank</Label>
            <Input id="p-bank" value={v.bank} onChange={(e) => set({ bank: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-mask">Account (last 4)</Label>
            <Input
              id="p-mask"
              placeholder="•••• 1234"
              value={v.accountMask}
              onChange={(e) => set({ accountMask: e.target.value })}
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="p-ref">Reference (optional)</Label>
          <Input
            id="p-ref"
            value={v.reference}
            onChange={(e) => set({ reference: e.target.value })}
          />
        </div>
      </div>
      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={creating || !v.name.trim() || !v.bank.trim()}
          onClick={() => onSubmit(v)}
        >
          {creating ? <Loader2 className="size-4 animate-spin" /> : null}
          {initial ? "Save" : "Add payee"}
        </Button>
      </DialogFooter>
    </>
  );
}
