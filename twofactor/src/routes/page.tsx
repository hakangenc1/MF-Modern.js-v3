import { useState } from "react";
import { Helmet } from "@modern-js/runtime/head";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TwoFactorChallenge } from "@/federation/TwoFactorChallenge";
import { TwoFactorDialog } from "@/federation/TwoFactorDialog";
import { TwoFactorGate } from "@/federation/TwoFactorGate";
import { verifyCode } from "@/mock/verify";

/**
 * Standalone showcase for `cd twofactor && npm run dev` (:3004). The three
 * exposed widgets, each in the shape a host would use.
 */
export default function DemoPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [embedError, setEmbedError] = useState<string | null>(null);
  const [embedBusy, setEmbedBusy] = useState(false);
  const note = (s: string) => setLog((l) => [`${new Date().toLocaleTimeString()} · ${s}`, ...l].slice(0, 6));

  return (
    <div className="space-y-10">
      <Helmet>
        <title>2FA widgets · Northwind</title>
      </Helmet>

      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          twofactor · :3004
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">2FA widgets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The federated modules this remote exposes. Demo code is <code className="font-mono">123456</code>.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          <code className="font-mono">twofactor/TwoFactorChallenge</code> — embedded
        </h2>
        <div className="rounded-xl border p-6">
          <TwoFactorChallenge
            email="alex.morgan@example.com"
            pending={embedBusy}
            error={embedError}
            onSubmit={async (code) => {
              setEmbedBusy(true);
              setEmbedError(null);
              const r = await verifyCode(code);
              setEmbedBusy(false);
              if (r.ok) note("embedded challenge verified");
              else setEmbedError(r.error ?? "failed");
            }}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          <code className="font-mono">twofactor/TwoFactorDialog</code> — popup
        </h2>
        <Button variant="outline" onClick={() => setDialogOpen(true)}>
          Open 2FA dialog
        </Button>
        <TwoFactorDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onVerified={() => note("dialog verified")}
          onCancel={() => note("dialog cancelled")}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          <code className="font-mono">twofactor/TwoFactorGate</code> — gate any action
        </h2>
        <TwoFactorGate
          title="Confirm transfer"
          description="Sending $250.00 to Jordan Rivera needs verification."
          onConfirmed={() => note("gated action ran (transfer sent)")}
        >
          <Button>
            <CheckCircle2 className="size-4" /> Send $250.00
          </Button>
        </TwoFactorGate>
      </section>

      {log.length > 0 ? (
        <section className="rounded-lg bg-muted p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Events</p>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
