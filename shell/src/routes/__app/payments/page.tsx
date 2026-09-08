import { useActionData, useLoaderData, useNavigation, useSubmit } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import TransferView from "payments/TransferView";

export default function PaymentsPage() {
  const context = useLoaderData();
  const actionData = useActionData() as { result?: any; error?: string } | undefined;
  const submit = useSubmit();
  const nav = useNavigation();
  return (
    <>
      <Helmet><title>Send money · Northwind Bank</title></Helmet>
      <TransferView
        context={context}
        pending={nav.state !== "idle"}
        result={actionData?.result}
        error={actionData?.error}
        onSubmit={(v: Record<string, string>) => submit(v, { method: "post" })}
      />
    </>
  );
}
