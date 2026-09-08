import { ArrowRight } from "lucide-react";
import { formatCurrency, type Payee } from "@/mock";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/** Compact "pay someone quickly" card for the shell dashboard. */
export function QuickTransferCard({ payees }: { payees: Payee[] }) {
  const top = payees.slice(0, 4);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick transfer</CardTitle>
        <CardDescription>Pay a saved payee</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {top.map((p) => (
          <a
            key={p.id}
            href="/payments"
            className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:border-primary/40"
          >
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">
                {p.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {p.bank} {p.accountMask}
              </p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </a>
        ))}
        <Button asChild variant="outline" className="w-full">
          <a href="/payments/payees">All payees · {payees.length}</a>
        </Button>
      </CardContent>
    </Card>
  );
}
