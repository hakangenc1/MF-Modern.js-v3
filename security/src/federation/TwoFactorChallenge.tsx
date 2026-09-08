import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Router-free 2FA challenge widget owned by the Security micro-frontend and
 * embedded by the shell at /login/verify. The shell wires `onSubmit` to its
 * own route action.
 */
export function TwoFactorChallenge({
  email,
  demoCode = "123456",
  onSubmit,
  pending = false,
  error,
}: {
  email: string;
  demoCode?: string;
  onSubmit: (code: string) => void;
  pending?: boolean;
  error?: string | null;
}) {
  const [code, setCode] = useState("");

  useEffect(() => {
    if (code.length === 6 && !pending) onSubmit(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
        <ShieldCheck className="size-5 text-primary" />
        <div className="text-sm">
          <p className="font-medium">Authenticator verification</p>
          <p className="text-muted-foreground">
            Enter the 6-digit code for <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={setCode}
          containerClassName="justify-center"
          autoFocus
        >
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              // No size override — the slot's own `h-12 w-12 text-lg` classes are
              // emitted by the host shell's stylesheet (it scans its copy of
              // ui/input-otp.tsx); a class only this remote uses would not be.
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          className="w-full"
          disabled={pending || code.length !== 6}
          onClick={() => onSubmit(code)}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          Verify &amp; sign in
        </Button>
      </div>

      <p className="rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
        Demo code: <span className="font-mono font-medium text-foreground">{demoCode}</span>
      </p>
    </div>
  );
}
