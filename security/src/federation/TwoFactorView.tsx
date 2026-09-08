import { useState } from "react";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { PageHeader } from "@/components/patterns/kit";

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
  const [code, setCode] = useState("");

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
              <p className="mb-3 text-sm font-medium">Verify a code</p>
              <p className="mb-3 text-xs text-muted-foreground">
                Enter a current 6-digit code to confirm your authenticator is in sync. Demo:
                <span className="ml-1 font-mono font-medium text-foreground">123456</span>
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <InputOTP maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <Button
                  size="sm"
                  disabled={pending || code.length !== 6}
                  onClick={() => actions.onVerify(code)}
                >
                  {pending ? <Loader2 className="size-4 animate-spin" /> : null} Verify
                </Button>
              </div>
              {verifyResult?.ok ? (
                <Alert className="mt-3 border-[color:var(--pos)]/40">
                  <AlertDescription className="text-[color:var(--pos)]">
                    Code verified — your authenticator is in sync.
                  </AlertDescription>
                </Alert>
              ) : verifyResult?.error ? (
                <Alert variant="destructive" className="mt-3">
                  <AlertDescription>{verifyResult.error}</AlertDescription>
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
