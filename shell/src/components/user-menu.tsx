import { startTransition, useEffect, useState } from "react";
import { Link } from "@modern-js/runtime/router";
import { CreditCard, LogOut, Repeat, ShieldCheck, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/mock";
import { useCan } from "@/lib/entitlements";

export function UserMenu({ user }: { user: User }) {
  const canDevices = useCan("security.advanced");
  // Radix menus/popovers/tooltips generate `useId` values whose numbering is
  // sensitive to Modern.js' streamed SSR boundary layout, which produces
  // "Prop `id`/`aria-controls` did not match" on hydration. The header's
  // interactive triggers all do client-only work anyway, so they mount after
  // hydration behind an identical static trigger.
  const [mounted, setMounted] = useState(false);
  // Defer this post-hydration flip so it can't interrupt a still-streaming
  // Suspense boundary (React #421).
  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  const trigger = (
    <Button variant="ghost" className="h-9 gap-2 px-1.5">
      <Avatar className="size-7">
        <AvatarFallback className="text-xs">{user.initials}</AvatarFallback>
      </Avatar>
      <span className="hidden text-sm font-medium sm:inline">{user.firstName}</span>
    </Button>
  );

  if (!mounted) return trigger;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span>{user.name}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {user.email} · {user.plan}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/security">
            <ShieldCheck className="size-4" /> Security
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/cards">
            <CreditCard className="size-4" /> Cards
          </Link>
        </DropdownMenuItem>
        {canDevices ? (
          <DropdownMenuItem asChild>
            <Link to="/security/devices">
              <UserRound className="size-4" /> Trusted devices
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/login?switch=1">
            <Repeat className="size-4" /> Switch profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
          <Link to="/logout">
            <LogOut className="size-4" /> Sign out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
