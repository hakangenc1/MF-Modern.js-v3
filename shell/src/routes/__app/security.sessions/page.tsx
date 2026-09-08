import { useActionData, useLoaderData, useNavigation, useSubmit } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import SessionsView from "security/SessionsView";
export default function Page() {
  const { sessions } = useLoaderData() as any;
  const actionData = useActionData() as any;
  const submit = useSubmit();
  const nav = useNavigation();
  return (<><Helmet><title>Active sessions · Northwind Bank</title></Helmet>
    <SessionsView sessions={actionData?.sessions ?? sessions} pending={nav.state !== "idle"}
      onRevoke={(id: string) => submit({ id }, { method: "post" })} /></>);
}
