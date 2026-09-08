import { useFetcher, useLoaderData } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import type { RecurringRule, Transfer } from "@/mock";
import ActivityView from "payments/ActivityView";
import { useCan } from "@/lib/entitlements";

type TransfersData = { scheduled: Transfer[]; history: Transfer[]; recurring: RecurringRule[] };

export default function Page() {
  const data = useLoaderData() as TransfersData;
  const fetcher = useFetcher<TransfersData>();
  const current = fetcher.data ?? data;
  const pendingId =
    fetcher.state !== "idle" ? (fetcher.formData?.get("id") as string | null) : null;

  return (
    <>
      <Helmet>
        <title>Payment activity · Northwind Bank</title>
      </Helmet>
      <ActivityView
        data={current}
        pendingId={pendingId}
        allowRecurring={useCan("payments.advanced")}
        onCancel={(id: string) => fetcher.submit({ intent: "cancel", id }, { method: "post" })}
        onToggleRecurring={(id: string, active: boolean) =>
          fetcher.submit({ intent: "recurring", id, active: String(active) }, { method: "post" })
        }
      />
    </>
  );
}
