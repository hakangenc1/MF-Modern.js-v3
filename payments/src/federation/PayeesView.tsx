import { Building2, Send, Star } from "lucide-react";
import { formatDate, relativeTime, type Payee } from "@/mock";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/patterns/kit";

export default function PayeesView({ payees }: { payees: Payee[] }) {
  const favorites = payees.filter((p) => p.favorite);
  const others = payees.filter((p) => !p.favorite);

  return (
    <>
      <PageHeader
        origin={{ name: "payments", port: 3002 }}
        title="Payees"
        description="People and businesses you can pay in a couple of taps."
        actions={
          <Button asChild>
            <a href="/payments">
              <Send className="size-4" /> Send money
            </a>
          </Button>
        }
      />

      {favorites.length ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Favorites
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {favorites.map((p) => (
              <PayeeCard key={p.id} payee={p} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          All payees
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {others.map((p) => (
            <PayeeCard key={p.id} payee={p} />
          ))}
        </div>
      </section>
    </>
  );
}

function PayeeCard({ payee }: { payee: Payee }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <Building2 className="size-4" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
                {payee.name}
                {payee.favorite ? (
                  <Star className="size-3 fill-[color:var(--warning)] text-[color:var(--warning)]" />
                ) : null}
              </CardTitle>
              <CardDescription className="text-xs">
                {payee.bank} · <span className="font-mono">{payee.accountMask}</span>
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
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
      </CardContent>
    </Card>
  );
}
