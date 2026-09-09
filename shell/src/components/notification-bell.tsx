import { startTransition, useEffect, useState } from "react";
import { Link, useFetcher } from "@modern-js/runtime/router";
import { Bell, CreditCard, FileText, Server, ShieldAlert } from "lucide-react";
import { relativeTime, type NotificationItem, type NotificationKind } from "@/mock";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const ICON: Record<NotificationKind, React.ComponentType<{ className?: string }>> = {
  payment: CreditCard,
  security: ShieldAlert,
  statement: FileText,
  system: Server,
};

/**
 * Header notification popover. The list + unread count come from the app-layout
 * loader; "mark all read" posts to that layout's action via a fetcher. Rendered
 * client-only (after hydration) — relative timestamps use `Date.now()`.
 */
export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const [mounted, setMounted] = useState(false);
  // Defer this post-hydration flip so it can't interrupt a still-streaming
  // Suspense boundary (React #421).
  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);
  const fetcher = useFetcher();

  const list = (fetcher.data as { notifications?: NotificationItem[] })?.notifications ?? notifications;
  const unread = fetcher.state !== "idle" ? 0 : (fetcher.data ? list.filter((n) => !n.read).length : unreadCount);

  const button = (
    <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
      <Bell className="size-4" />
      {unread > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
          {unread}
        </span>
      ) : null}
    </Button>
  );

  if (!mounted) return button;

  return (
    <Popover>
      <PopoverTrigger asChild>{button}</PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 ? (
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => fetcher.submit({ intent: "read-all" }, { method: "post", action: "/" })}
            >
              Mark all read
            </button>
          ) : (
            <Badge variant="secondary">All caught up</Badge>
          )}
        </div>
        <ul className="max-h-80 divide-y overflow-auto">
          {list.slice(0, 8).map((n) => {
            const Icon = ICON[n.kind];
            return (
              <li key={n.id} className={cn("flex gap-3 px-4 py-3", !n.read && "bg-muted/40")}>
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.detail}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{relativeTime(n.at)}</p>
                </div>
                {!n.read ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" /> : null}
              </li>
            );
          })}
        </ul>
        <div className="border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link to="/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
