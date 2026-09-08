import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TwoFactorChallenge } from "./TwoFactorChallenge";
import { verifyCode } from "@/mock/verify";

export interface TwoFactorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a code verifies. The dialog closes itself first. */
  onVerified: () => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
  email?: string;
  demoCode?: string;
}

/**
 * Popup 2FA. Self-contained: it runs the check (twofactor's own `verifyCode`)
 * and only tells the host "verified" — the host supplies open state + a success
 * callback. Drop it into any flow that needs a step-up challenge.
 */
export function TwoFactorDialog({
  open,
  onOpenChange,
  onVerified,
  onCancel,
  title = "Confirm it's you",
  description = "This action needs two-factor verification.",
  email,
  demoCode,
}: TwoFactorDialogProps) {
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset transient state whenever the dialog is (re)opened.
  useEffect(() => {
    if (open) {
      setVerifying(false);
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (code: string) => {
    setVerifying(true);
    setError(null);
    const res = await verifyCode(code);
    setVerifying(false);
    if (res.ok) {
      onOpenChange(false);
      onVerified();
    } else {
      setError(res.error ?? "Verification failed.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) onCancel?.();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <TwoFactorChallenge
          email={email}
          demoCode={demoCode}
          pending={verifying}
          error={error}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

export default TwoFactorDialog;
