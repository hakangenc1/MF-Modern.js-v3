import { useActionData, useLoaderData, useNavigation, useSubmit } from "@modern-js/runtime/router";
import SessionsView from "@/federation/SessionsView";
import type { SessionEntry } from "@/mock";
export default function Page() {
  const { sessions } = useLoaderData() as { sessions: SessionEntry[] };
  const actionData = useActionData() as { sessions?: SessionEntry[] } | undefined;
  const submit = useSubmit();
  const nav = useNavigation();
  return (
    <SessionsView
      sessions={actionData?.sessions ?? sessions}
      pending={nav.state !== "idle"}
      onRevoke={(id) => submit({ id }, { method: "post" })}
    />
  );
}
