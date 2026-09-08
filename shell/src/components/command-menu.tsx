import { useEffect, useState } from "react";
import { useNavigate } from "@modern-js/runtime/router";
import {
  ArrowLeftRight,
  CreditCard,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

const LINKS = [
  { group: "Go to", label: "Overview", to: "/", icon: LayoutDashboard },
  { group: "Go to", label: "Accounts", to: "/accounts", icon: Wallet },
  { group: "Go to", label: "Send money", to: "/payments", icon: ArrowLeftRight },
  { group: "Go to", label: "Payees", to: "/payments/payees", icon: Users },
  { group: "Go to", label: "Cards", to: "/cards", icon: CreditCard },
  { group: "Go to", label: "Security", to: "/security", icon: ShieldCheck },
  { group: "Actions", label: "New transfer", to: "/payments", icon: ArrowLeftRight },
  { group: "Actions", label: "Manage two-factor auth", to: "/security/two-factor", icon: ShieldCheck },
];

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const groups = [...new Set(LINKS.map((l) => l.group))];

  return (
    <>
      <Button
        variant="outline"
        className="h-9 w-full justify-start gap-2 px-3 text-muted-foreground sm:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        <span className="flex-1 text-left text-sm">Search…</span>
        <kbd className="pointer-events-none hidden select-none rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline-block">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages and actions…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {groups.map((group, i) => (
            <div key={group}>
              {i > 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {LINKS.filter((l) => l.group === group).map((l) => (
                  <CommandItem
                    key={l.label}
                    value={l.label}
                    onSelect={() => {
                      setOpen(false);
                      navigate(l.to);
                    }}
                  >
                    <l.icon className="size-4" />
                    {l.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
