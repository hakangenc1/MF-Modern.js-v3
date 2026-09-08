import { useFetcher, useLoaderData } from "@modern-js/runtime/router";
import DevicesView from "@/federation/DevicesView";
import type { Device } from "@/mock";
export default function Page() {
  const { devices } = useLoaderData() as { devices: Device[] };
  const fetcher = useFetcher<{ devices?: Device[] }>();
  const pendingId =
    fetcher.state !== "idle" ? (fetcher.formData?.get("id") as string | null) : null;
  return (
    <DevicesView
      devices={fetcher.data?.devices ?? devices}
      pendingId={pendingId}
      onRevoke={(id) => fetcher.submit({ id }, { method: "post" })}
    />
  );
}
