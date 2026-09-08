import { useActionData, useLoaderData, useNavigation, useSubmit } from "@modern-js/runtime/router";
import DevicesView from "@/federation/DevicesView";
import type { Device } from "@/mock";
export default function Page() {
  const { devices } = useLoaderData() as { devices: Device[] };
  const actionData = useActionData() as { devices?: Device[] } | undefined;
  const submit = useSubmit();
  const nav = useNavigation();
  return (
    <DevicesView
      devices={actionData?.devices ?? devices}
      pending={nav.state !== "idle"}
      onRevoke={(id) => submit({ id }, { method: "post" })}
    />
  );
}
