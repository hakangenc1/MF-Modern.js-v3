import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { relativeTime } from "@/mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const NOTIFICATIONS = [
  {
    id: "n1",
    title: "Rent payment scheduled",
    detail: "$3,250.00 to Hayes Valley Properties in 3 days",
    at: -2,
  },
  {
    id: "n2",
    title: "New sign-in from Austin, US",
    detail: "Firefox on Windows • review this device",
    at: -19,
  },
  { id: "n3", title: "Statement ready", detail: "Sapphire Credit Card — August", at: -5 },
];

/**
 * Header notification popover. Rendered client-only (after hydration): the
 * relative timestamps come from `Date.now()`, which is not SSR-deterministic, and
 * there is no reason to server-render an empty closed popover.
 */
export function NotificationBell() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const button = (
    <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
      <Bell className="size-4" />
      <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />
    </Button>
  );

  if (!mounted) return button;

  return (
    <Popover>
      <PopoverTrigger asChild>{button}</PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <Badge variant="secondary">{NOTIFICATIONS.length} new</Badge>
        </div>
        <ul className="divide-y">
          {NOTIFICATIONS.map((n) => (
            <li key={n.id} className="px-4 py-3">
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.detail}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {relativeTime(new Date(Date.now() + n.at * 86_400_000).toISOString())}
              </p>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
