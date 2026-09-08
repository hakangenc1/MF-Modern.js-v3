import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DEMO_2FA_CODE } from "@/mock/verify";

export interface TwoFactorChallengeProps {
  /** Who the code is for (shown in the prompt). Optional. */
  email?: string;
  /** Heading + sub-line. Sensible 2FA defaults. */
  title?: string;
  description?: string;
  /** The demo hint shown at the bottom. Pass "" to hide it. */
  demoCode?: string;
  /** Disables input + shows a spinner on the button (host is verifying). */
  pending?: boolean;
  /** Error text to surface (e.g. "wrong code"). */
  error?: string | null;
  autoFocus?: boolean;
  /** Fires once 6 digits are entered, and on the Verify button. */
  onSubmit: (code: string) => void;
}

/**
 * Router-free 2FA challenge widget owned by the twofactor micro-frontend. Used
 * embedded (login page, transfer review) or inside <TwoFactorDialog>. The host
 * decides what a verified code means.
 */
export function TwoFactorChallenge({
  email,
  title = "Authenticator verification",
  description,
  demoCode = DEMO_2FA_CODE,
  pending = false,
  error,
  autoFocus = true,
  onSubmit,
}: TwoFactorChallengeProps) {
  const [code, setCode] = useState("");

  useEffect(() => {
    if (code.length === 6 && !pending) onSubmit(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const sub =
    description ??
    (email ? (
      <>
        Enter the 6-digit code for{" "}
        <span className="font-medium text-foreground">{email}</span>
      </>
    ) : (
      "Enter the 6-digit code from your authenticator app."
    ));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
        <ShieldCheck className="size-5 text-primary" />
        <div className="text-sm">
          <p className="font-medium">{title}</p>
          <p className="text-muted-foreground">{sub}</p>
        </div>
      </div>

      <div className="space-y-4">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={setCode}
          disabled={pending}
          containerClassName="justify-center"
          autoFocus={autoFocus}
        >
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
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
          Verify
        </Button>
      </div>

      {demoCode ? (
        <p className="rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
          Demo code: <span className="font-mono font-medium text-foreground">{demoCode}</span>
        </p>
      ) : null}
    </div>
  );
}

export default TwoFactorChallenge;
