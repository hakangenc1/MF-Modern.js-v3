import { useFetcher, useLoaderData } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import { Nfc, Snowflake, Wifi } from "lucide-react";
import { formatCurrency, type Card as BankCard } from "@/mock";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/patterns/kit";
import type { CardsData } from "./page.data";

const FACE: Record<BankCard["color"], string> = {
  graphite: "from-zinc-800 to-zinc-950 text-white",
  sapphire: "from-primary to-indigo-900 text-white",
  emerald: "from-emerald-700 to-emerald-950 text-white",
};

export default function CardsRoute() {
  const { cards } = useLoaderData() as CardsData;
  return (
    <>
      <Helmet>
        <title>Cards · Northwind Bank</title>
      </Helmet>
      <PageHeader
        title="Cards"
        description="Freeze a card instantly, set monthly limits, and manage contactless."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {cards.map((card) => (
          <CardPanel key={card.id} card={card} />
        ))}
      </div>
    </>
  );
}

function CardPanel({ card: initial }: { card: BankCard }) {
  const fetcher = useFetcher<{ card: BankCard | null }>();
  const card = fetcher.data?.card ?? initial;
  const pct = Math.min(100, Math.round((card.monthlySpent / card.monthlyLimit) * 100));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{card.name}</CardTitle>
          <Badge variant={card.frozen ? "destructive" : "secondary"}>
            {card.frozen ? "Frozen" : "Active"}
          </Badge>
        </div>
        <CardDescription>
          {card.network} · expires {card.expiry}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
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
          <div className="absolute bottom-5 left-5 right-5">
            <p className="font-mono text-lg tracking-widest">{card.mask}</p>
            <p className="mt-1 text-xs uppercase tracking-wide opacity-80">{card.network}</p>
          </div>
          {card.frozen ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Snowflake className="size-10 opacity-80" />
            </div>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monthly spend</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(card.monthlySpent)} / {formatCurrency(card.monthlyLimit)}
            </span>
          </div>
          <Progress value={pct} />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Snowflake className="size-4 text-muted-foreground" />
            <Label htmlFor={`freeze-${card.id}`} className="cursor-pointer">
              Freeze card
            </Label>
          </div>
          <Switch
            id={`freeze-${card.id}`}
            checked={card.frozen}
            onCheckedChange={(next) =>
              fetcher.submit({ id: card.id, frozen: String(next) }, { method: "post" })
            }
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Nfc className="size-4 text-muted-foreground" />
            <span className="text-sm">Contactless payments</span>
          </div>
          <Switch checked={card.contactless} disabled />
        </div>
      </CardContent>
    </Card>
  );
}
