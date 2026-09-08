import { useState } from "react";
import { useFetcher, useLoaderData } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import { Loader2, Nfc, Plus, Snowflake, Trash2, Wifi } from "lucide-react";
import { formatCurrency, type Card as BankCard, type TransactionCategory } from "@/mock";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader, SectionCard } from "@/components/patterns/kit";
import { useCan } from "@/lib/entitlements";
import type { CardsData } from "./page.data";

const FACE: Record<BankCard["color"], string> = {
  graphite: "from-zinc-700 to-zinc-950 text-white",
  sapphire: "from-zinc-800 to-black text-white",
  emerald: "from-zinc-600 to-zinc-900 text-white",
};

const LOCKABLE: TransactionCategory[] = [
  "Dining",
  "Shopping",
  "Travel",
  "Entertainment",
  "Transport",
  "Groceries",
];

export default function CardsRoute() {
  const { cards } = useLoaderData() as CardsData;
  const allowVirtual = useCan("cards.virtual");
  return (
    <>
      <Helmet>
        <title>Cards · Northwind Bank</title>
        <meta
          name="description"
          content="Freeze a card, set spending limits, lock categories, and create virtual card numbers."
        />
      </Helmet>
      <PageHeader
        title="Cards"
        description={
          allowVirtual
            ? "Freeze instantly, set limits, lock categories, and spin up virtual card numbers."
            : "Freeze instantly, set spending limits, and lock spend categories."
        }
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {cards.map((card) => (
          <CardPanel key={card.id} card={card} allowVirtual={allowVirtual} />
        ))}
      </div>
    </>
  );
}

function CardPanel({ card: initial, allowVirtual }: { card: BankCard; allowVirtual: boolean }) {
  const fetcher = useFetcher<{ card: BankCard | null }>();
  const card = fetcher.data?.card ?? initial;
  const busyIntent =
    fetcher.state !== "idle" ? (fetcher.formData?.get("intent") as string | null) : null;
  const pct = Math.min(100, Math.round((card.monthlySpent / card.monthlyLimit) * 100));

  const [limitOpen, setLimitOpen] = useState(false);
  const [virtualOpen, setVirtualOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [limitVal, setLimitVal] = useState(String(Math.round(card.monthlyLimit / 100)));
  const [vcLabel, setVcLabel] = useState("");

  const submit = (data: Record<string, string>) =>
    fetcher.submit({ id: card.id, ...data }, { method: "post" });

  return (
    <SectionCard
      title={card.name}
      description={`${card.network} · expires ${card.expiry}`}
      action={
        <Badge variant={card.frozen ? "destructive" : "secondary"}>
          {card.frozen ? "Frozen" : "Active"}
        </Badge>
      }
      bodyClassName="space-y-5"
    >
      <div
        className={cn(
          "relative aspect-[16/10] w-full rounded-xl bg-gradient-to-br p-5 shadow-lg",
          FACE[card.color],
          card.frozen && "opacity-60 grayscale",
        )}
      >
        <div className="flex items-start justify-between">
          <span className="text-sm font-medium opacity-90">Northwind</span>
          {card.contactless ? <Wifi className="size-5 rotate-90 opacity-90" /> : null}
        </div>
        <div className="absolute inset-x-5 bottom-5">
          <p className="font-mono text-lg tracking-widest">{card.mask}</p>
          <p className="mt-1 text-xs uppercase tracking-wide opacity-80">{card.network}</p>
        </div>
        {card.frozen ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Snowflake className="size-10 opacity-80" />
          </div>
        ) : null}
      </div>

      {card.replacedAt ? (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Reissued with a new number. The old card is permanently blocked.
        </p>
      ) : null}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Monthly spend</span>
          <button
            type="button"
            className="font-medium tabular-nums underline-offset-4 hover:underline"
            onClick={() => {
              setLimitVal(String(Math.round(card.monthlyLimit / 100)));
              setLimitOpen(true);
            }}
          >
            {formatCurrency(card.monthlySpent)} / {formatCurrency(card.monthlyLimit)}
          </button>
        </div>
        <Progress value={pct} aria-label={`${card.name} monthly spend: ${pct}% of limit`} />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <Snowflake className="size-4 text-muted-foreground" />
          <Label htmlFor={`freeze-${card.id}`} className="cursor-pointer">
            Freeze card
          </Label>
          {busyIntent === "freeze" ? <Loader2 className="size-3.5 animate-spin" /> : null}
        </div>
        <Switch
          id={`freeze-${card.id}`}
          checked={card.frozen}
          disabled={busyIntent === "freeze"}
          onCheckedChange={(next) => submit({ intent: "freeze", frozen: String(next) })}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <Nfc className="size-4 text-muted-foreground" />
          <span className="text-sm">Contactless payments</span>
        </div>
        <Switch checked={card.contactless} disabled />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Category locks</p>
          {busyIntent === "lock" ? <Loader2 className="size-3.5 animate-spin" /> : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {LOCKABLE.map((c) => {
            const locked = card.categoryLocks.includes(c);
            return (
              <button
                key={c}
                type="button"
                disabled={busyIntent === "lock"}
                onClick={() => submit({ intent: "lock", category: c })}
              >
                <Badge variant={locked ? "default" : "outline"} className="cursor-pointer">
                  {c}
                </Badge>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Locked categories are declined on this card.
        </p>
      </div>

      {allowVirtual ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Virtual cards</p>
            <Button variant="outline" size="sm" onClick={() => setVirtualOpen(true)}>
              <Plus className="size-4" /> New
            </Button>
          </div>
          {card.virtualCards.length ? (
            <ul className="divide-y rounded-lg border">
              {card.virtualCards.map((v) => (
                <li key={v.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>
                    <span className="font-medium">{v.label}</span>{" "}
                    <span className="font-mono text-muted-foreground">{v.mask}</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busyIntent === "del-virtual"}
                    onClick={() => submit({ intent: "del-virtual", vid: v.id })}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              No virtual cards. Create one for a single merchant or subscription.
            </p>
          )}
        </div>
      ) : null}

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-[color:var(--neg)] hover:text-[color:var(--neg)]"
        onClick={() => setLostOpen(true)}
      >
        Report lost &amp; replace
      </Button>

      {/* limit */}
      <Dialog open={limitOpen} onOpenChange={setLimitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Monthly spending limit</DialogTitle>
            <DialogDescription>
              Purchases over this limit in a calendar month are declined.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor={`limit-${card.id}`}>Limit (USD)</Label>
            <Input
              id={`limit-${card.id}`}
              inputMode="numeric"
              value={limitVal}
              onChange={(e) => setLimitVal(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLimitOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={busyIntent === "limit"}
              onClick={() => {
                submit({ intent: "limit", limit: limitVal || "0" });
                setLimitOpen(false);
              }}
            >
              {busyIntent === "limit" ? <Loader2 className="size-4 animate-spin" /> : null}
              Save limit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* virtual card */}
      <Dialog open={virtualOpen} onOpenChange={setVirtualOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New virtual card</DialogTitle>
            <DialogDescription>
              A separate number linked to {card.name}. Delete it any time without touching the
              physical card.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor={`vc-${card.id}`}>Label</Label>
            <Input
              id={`vc-${card.id}`}
              placeholder="e.g. Netflix, Amazon"
              value={vcLabel}
              onChange={(e) => setVcLabel(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVirtualOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!vcLabel.trim() || busyIntent === "add-virtual"}
              onClick={() => {
                submit({ intent: "add-virtual", label: vcLabel });
                setVcLabel("");
                setVirtualOpen(false);
              }}
            >
              {busyIntent === "add-virtual" ? <Loader2 className="size-4 animate-spin" /> : null}
              Create card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* report lost */}
      <Dialog open={lostOpen} onOpenChange={setLostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report {card.name} lost?</DialogTitle>
            <DialogDescription>
              The current number is blocked immediately and a replacement is issued with a new
              number. This can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLostOpen(false)}>
              Keep card
            </Button>
            <Button
              variant="destructive"
              disabled={busyIntent === "replace"}
              onClick={() => {
                submit({ intent: "replace" });
                setLostOpen(false);
              }}
            >
              {busyIntent === "replace" ? <Loader2 className="size-4 animate-spin" /> : null}
              Block &amp; replace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}
