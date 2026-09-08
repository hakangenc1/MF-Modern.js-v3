import { useActionData, useLoaderData, useNavigation, useSubmit } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import TwoFactorView from "security/TwoFactorView";
export default function Page() {
  const { overview } = useLoaderData() as any;
  const actionData = useActionData() as any;
  const submit = useSubmit();
  const nav = useNavigation();
  return (<><Helmet><title>Two-factor auth · Northwind Bank</title></Helmet>
    <TwoFactorView
      overview={actionData?.overview ?? overview}
      pending={nav.state !== "idle"}
      verifyResult={actionData?.verifyResult}
      recoveryCodes={actionData?.recoveryCodes}
      actions={{
        onToggle: (e: boolean) => submit({ intent: "toggle", enabled: String(e) }, { method: "post" }),
        onRegenerate: () => submit({ intent: "regenerate" }, { method: "post" }),
        onVerify: (c: string) => submit({ intent: "verify", code: c }, { method: "post" }),
      }}
    /></>);
}
