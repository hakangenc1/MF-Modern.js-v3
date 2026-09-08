import { useActionData, useLoaderData, useNavigation, useSubmit } from "@modern-js/runtime/router";
import TwoFactorView from "@/federation/TwoFactorView";
import type { SecurityOverview } from "@/mock";

export default function Page() {
  const { overview } = useLoaderData() as { overview: SecurityOverview };
  const actionData = useActionData() as
    | { overview?: SecurityOverview; recoveryCodes?: string[]; verifyResult?: { ok?: boolean; error?: string } }
    | undefined;
  const submit = useSubmit();
  const nav = useNavigation();
  const current = actionData?.overview ?? overview;

  return (
    <TwoFactorView
      overview={current}
      pending={nav.state !== "idle"}
      verifyResult={actionData?.verifyResult}
      recoveryCodes={actionData?.recoveryCodes}
      actions={{
        onToggle: (enabled) => submit({ intent: "toggle", enabled: String(enabled) }, { method: "post" }),
        onRegenerate: () => submit({ intent: "regenerate" }, { method: "post" }),
        onVerify: (code) => submit({ intent: "verify", code }, { method: "post" }),
      }}
    />
  );
}
