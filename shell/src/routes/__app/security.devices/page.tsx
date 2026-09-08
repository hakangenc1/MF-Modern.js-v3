import { useActionData, useLoaderData, useNavigation, useSubmit } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import DevicesView from "security/DevicesView";
export default function Page() {
  const { devices } = useLoaderData() as any;
  const actionData = useActionData() as any;
  const submit = useSubmit();
  const nav = useNavigation();
  return (<><Helmet><title>Trusted devices · Northwind Bank</title></Helmet>
    <DevicesView devices={actionData?.devices ?? devices} pending={nav.state !== "idle"}
      onRevoke={(id: string) => submit({ id }, { method: "post" })} /></>);
}
