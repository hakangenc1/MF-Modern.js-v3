import { cloneElement, isValidElement, useState, type ReactElement } from "react";
import { TwoFactorDialog } from "./TwoFactorDialog";

export interface TwoFactorGateProps {
  /** Runs only after a code verifies. */
  onConfirmed: () => void;
  disabled?: boolean;
  title?: string;
  description?: string;
  email?: string;
  demoCode?: string;
  /**
   * The control that triggers the challenge — typically a <Button>. Its onClick
   * is intercepted to open the dialog first.
   */
  children: ReactElement<{ onClick?: (e: unknown) => void; disabled?: boolean }>;
}

/**
 * Wrap any action button so it must pass 2FA before it fires. The whole gate is
 * the widget — a host writes:
 *
 *   <TwoFactorGate onConfirmed={sendTransfer}>
 *     <Button>Confirm &amp; send</Button>
 *   </TwoFactorGate>
 */
export function TwoFactorGate({
  onConfirmed,
  disabled,
  title,
  description,
  email,
  demoCode,
  children,
}: TwoFactorGateProps) {
  const [open, setOpen] = useState(false);

  const trigger = isValidElement(children)
    ? cloneElement(children, {
        onClick: () => setOpen(true),
        disabled: disabled ?? children.props.disabled,
      })
    : children;

  return (
    <>
      {trigger}
      <TwoFactorDialog
        open={open}
        onOpenChange={setOpen}
        onVerified={onConfirmed}
        title={title}
        description={description}
        email={email}
        demoCode={demoCode}
      />
    </>
  );
}

export default TwoFactorGate;
