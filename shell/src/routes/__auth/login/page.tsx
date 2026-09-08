import { useEffect, useState } from "react";
import {
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import { Check, Loader2, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthShell } from "@/components/auth-shell";
import { cn } from "@/lib/utils";
import type { LoginData, LoginActionData, PersonaCard } from "./page.data";

export default function LoginRoute() {
  const { redirectTo, personas } = useLoaderData() as LoginData;
  const actionData = useActionData() as LoginActionData | undefined;
  const submit = useSubmit();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  const [selected, setSelected] = useState(personas[0]?.id ?? "");

  useEffect(() => {
    if (actionData?.next) navigate(actionData.next);
  }, [actionData, navigate]);

  return (
    <AuthShell
      title="Choose a profile"
      description="This demo signs you in as one of two entitlement profiles. The profile decides which features the shell unlocks and passes down to the remote apps."
      footer={
        <>
          You can flip individual entitlements later from the top bar or{" "}
          <span className="font-medium text-foreground">Settings</span>.
        </>
      }
    >
      <Helmet>
        <title>Sign in · Northwind Bank</title>
      </Helmet>
      <form
        method="post"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget, { method: "post" });
        }}
      >
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <input type="hidden" name="persona" value={selected} />
        {actionData?.error ? (
          <Alert variant="destructive">
            <AlertDescription>{actionData.error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-3">
          {personas.map((p) => (
            <PersonaOption
              key={p.id}
              persona={p}
              checked={selected === p.id}
              onSelect={() => setSelected(p.id)}
            />
          ))}
        </div>

        <Button type="submit" className="w-full" disabled={busy || !selected}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Continue
        </Button>
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Demo: no password. You’ll confirm with the one-time code{" "}
          <span className="font-mono font-medium text-foreground">123456</span> on the next step.
        </p>
      </form>
    </AuthShell>
  );
}

function PersonaOption({
  persona,
  checked,
  onSelect,
}: {
  persona: PersonaCard;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={checked}
      className={cn(
        "block w-full rounded-lg border p-4 text-left transition-colors",
        checked ? "border-foreground ring-1 ring-foreground" : "hover:border-foreground/30",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{persona.name}</span>
        <Badge variant={checked ? "default" : "outline"} className="text-[10px] uppercase">
          {persona.label}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{persona.tagline}</p>
      <ul className="mt-3 space-y-1 text-xs">
        {persona.can.map((c) => (
          <li key={c} className="flex items-start gap-1.5">
            <Check className="mt-0.5 size-3 shrink-0 text-[color:var(--pos)]" />
            <span>{c}</span>
          </li>
        ))}
        {persona.cannot.map((c) => (
          <li key={c} className="flex items-start gap-1.5 text-muted-foreground">
            <Minus className="mt-0.5 size-3 shrink-0" />
            <span>{c}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}
