import { ArrowRight } from "lucide-react";
import { type Payee } from "@/mock";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SectionCard } from "@/components/patterns/kit";

/** Compact "pay someone quickly" card for the shell dashboard. */
export function QuickTransferCard({ payees }: { payees: Payee[] }) {
  const top = payees.slice(0, 4);
  return (
    <SectionCard title="Quick transfer" description="Pay a saved payee" bodyClassName="space-y-2">
      {top.map((p) => (
        <a
          key={p.id}
          href="/payments"
          className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:border-foreground/20"
        >
          <Avatar className="size-8">
            <AvatarFallback className="text-[11px]">
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
      <Button asChild variant="outline" size="sm" className="w-full">
        <a href="/payments/payees">All payees · {payees.length}</a>
      </Button>
    </SectionCard>
  );
}
