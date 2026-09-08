import { useActionData, useLoaderData, useNavigation, useSubmit } from "@modern-js/runtime/router";
import TransferView, { type TransferValues } from "@/federation/TransferView";
import type { TransferContext } from "@/federation/data";

export default function Page() {
  const context = useLoaderData() as TransferContext;
  const actionData = useActionData() as
    | { result?: { ok: boolean; transfer?: any }; error?: string }
    | undefined;
  const submit = useSubmit();
  const nav = useNavigation();

  return (
    <TransferView
      context={context}
      pending={nav.state !== "idle"}
      result={actionData?.result}
      error={actionData?.error}
      onSubmit={(v: TransferValues) => submit(v as unknown as Record<string, string>, { method: "post" })}
    />
  );
}
