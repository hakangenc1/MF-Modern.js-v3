import { useFetcher, useLoaderData } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import DevicesView from "security/DevicesView";

export default function Page() {
  const { devices } = useLoaderData() as any;
  const fetcher = useFetcher<any>();
  const pendingId =
    fetcher.state !== "idle" ? (fetcher.formData?.get("id") as string | null) : null;
  return (
    <>
      <Helmet><title>Trusted devices · Northwind Bank</title></Helmet>
      <DevicesView
        devices={fetcher.data?.devices ?? devices}
        pendingId={pendingId}
        onRevoke={(id: string) => fetcher.submit({ id }, { method: "post" })}
      />
    </>
  );
}
