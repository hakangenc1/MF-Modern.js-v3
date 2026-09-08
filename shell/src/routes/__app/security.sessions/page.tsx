import { useFetcher, useLoaderData } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import SessionsView from "security/SessionsView";

export default function Page() {
  const { sessions } = useLoaderData() as any;
  const fetcher = useFetcher<any>();
  const pendingId =
    fetcher.state !== "idle" ? (fetcher.formData?.get("id") as string | null) : null;
  return (
    <>
      <Helmet><title>Active sessions · Northwind Bank</title></Helmet>
      <SessionsView
        sessions={fetcher.data?.sessions ?? sessions}
        pendingId={pendingId}
        onRevoke={(id: string) => fetcher.submit({ id }, { method: "post" })}
      />
    </>
  );
}
