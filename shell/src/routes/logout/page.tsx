import { useEffect, useRef } from "react";
import { useActionData, useNavigate, useSubmit } from "@modern-js/runtime/router";
import type { LogoutActionData } from "./page.data";

// Auto-submits to its own action (which clears the cookies at 200 — a loader 302
// would lose the Set-Cookie here), then navigates to the result's `next`.
export default function Logout() {
  const submit = useSubmit();
  const navigate = useNavigate();
  const actionData = useActionData() as LogoutActionData | undefined;
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    submit({}, { method: "post" });
  }, [submit]);

  useEffect(() => {
    if (actionData?.next) navigate(actionData.next, { replace: true });
  }, [actionData, navigate]);

  return (
    <div className="grid min-h-svh place-items-center text-sm text-muted-foreground">
      Signing out…
    </div>
  );
}
