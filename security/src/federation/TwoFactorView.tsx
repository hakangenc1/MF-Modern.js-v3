import { Copy, KeyRound, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { formatDate, type SecurityOverview } from "@/mock";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/patterns/kit";
// The one 2FA widget — same federated module the shell uses at login and
// payments uses before a transfer.
import { TwoFactorChallenge } from "twofactor/TwoFactorChallenge";

export interface TwoFactorActions {
  onToggle: (enabled: boolean) => void;
  onRegenerate: () => void;
  onVerify: (code: string) => void;
}

export default function TwoFactorView({
  overview,
  actions,
  pending = false,
  verifyResult,
  recoveryCodes,
}: {
  overview: SecurityOverview;
  actions: TwoFactorActions;
  pending?: boolean;
  verifyResult?: { ok?: boolean; error?: string } | null;
  recoveryCodes?: string[] | null;
}) {
  return (
    <>
      <PageHeader
        origin={{ name: "security", port: 3003 }}
        title="Two-factor authentication"
        description="A second step at sign-in, even if your password is compromised."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Authenticator app</CardTitle>
            <CardDescription>Time-based one-time codes (TOTP)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck
                  className="size-5"
                  style={{ color: overview.twoFactorEnabled ? "var(--pos)" : "var(--muted-foreground)" }}
                />
                <div>
                  <Label htmlFor="tf" className="cursor-pointer">
                    Two-factor authentication
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {overview.twoFactorEnabled ? "Currently enabled" : "Currently disabled"}
                  </p>
                </div>
              </div>
              <Switch
                id="tf"
                checked={overview.twoFactorEnabled}
                disabled={pending}
                onCheckedChange={actions.onToggle}
              />
            </div>

            <div className="rounded-lg border p-4">
              <TwoFactorChallenge
                title="Verify a code"
                description="Enter a current 6-digit code to confirm your authenticator is in sync."
                pending={pending}
                error={verifyResult?.error}
                autoFocus={false}
                onSubmit={actions.onVerify}
              />
              {verifyResult?.ok ? (
                <Alert className="mt-3 border-[color:var(--pos)]/40">
                  <AlertDescription className="text-[color:var(--pos)]">
                    Code verified — your authenticator is in sync.
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recovery codes</CardTitle>
            <CardDescription>
              {overview.recoveryCodesRemaining} of 10 unused
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Single-use codes to get in if you lose your device. Store them somewhere safe.
            </p>
            {recoveryCodes?.length ? (
              <div className="grid grid-cols-2 gap-1.5 rounded-lg border bg-muted/40 p-3 font-mono text-xs">
                {recoveryCodes.map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={pending}
              onClick={actions.onRegenerate}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Generate new codes
            </Button>
            {recoveryCodes?.length ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => navigator.clipboard?.writeText(recoveryCodes.join("\n"))}
              >
                <Copy className="size-4" /> Copy all
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
          <KeyRound className="size-4" />
          Password last changed {formatDate(overview.passwordUpdatedAt, "long")}.
        </CardContent>
      </Card>
    </>
  );
}
