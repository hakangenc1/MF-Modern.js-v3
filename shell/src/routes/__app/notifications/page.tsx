import { useFetcher, useLoaderData } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import { Check, CreditCard, FileText, Server, ShieldAlert } from "lucide-react";
import { relativeTime, type NotificationItem, type NotificationKind } from "@/mock";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionCard } from "@/components/patterns/kit";
import type { NotificationsData } from "./page.data";

const ICON: Record<NotificationKind, React.ComponentType<{ className?: string }>> = {
  payment: CreditCard,
  security: ShieldAlert,
  statement: FileText,
  system: Server,
};

export default function NotificationsPage() {
  const { notifications } = useLoaderData() as NotificationsData;
  const fetcher = useFetcher<{ notifications?: NotificationItem[] }>();
  const list = fetcher.data?.notifications ?? notifications;
  const unread = list.filter((n) => !n.read).length;
  const pendingId =
    fetcher.state !== "idle" ? (fetcher.formData?.get("id") as string | null) : null;
  const clearingAll =
    fetcher.state !== "idle" && fetcher.formData?.get("intent") === "read-all";

  return (
    <>
      <Helmet>
        <title>Notifications · Northwind Bank</title>
      </Helmet>
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : "You're all caught up."}
        actions={
          unread ? (
            <Button
              variant="outline"
              size="sm"
              disabled={clearingAll}
              onClick={() => fetcher.submit({ intent: "read-all" }, { method: "post" })}
            >
              <Check className="size-4" /> Mark all read
            </Button>
          ) : null
        }
      />

      <SectionCard className="mt-6" bodyClassName="p-0">
        <ul className="divide-y">
          {list.map((n) => {
            const Icon = ICON[n.kind];
            return (
              <li
                key={n.id}
                className={cn(
                  "flex items-start gap-3 px-5 py-4 transition-colors",
                  !n.read && "bg-muted/40",
                )}
              >
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.detail}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{relativeTime(n.at)}</p>
                </div>
                {!n.read ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pendingId === n.id}
                    onClick={() => fetcher.submit({ id: n.id }, { method: "post" })}
                  >
                    Mark read
                  </Button>
                ) : (
                  <span className="pt-1 text-xs text-muted-foreground">Read</span>
                )}
              </li>
            );
          })}
        </ul>
      </SectionCard>
    </>
  );
}
