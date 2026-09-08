import { useFetcher, useLoaderData } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import type { Payee, PayeeInput } from "@/mock";
import PayeesView from "payments/PayeesView";

export default function Page() {
  const { payees } = useLoaderData() as { payees: Payee[] };
  const fetcher = useFetcher<{ payees: Payee[] }>();
  const current = fetcher.data?.payees ?? payees;
  const pendingId =
    fetcher.state !== "idle" ? (fetcher.formData?.get("id") as string | null) : null;
  const creating = fetcher.state !== "idle" && fetcher.formData?.get("intent") === "create";

  return (
    <>
      <Helmet>
        <title>Payees · Northwind Bank</title>
      </Helmet>
      <PayeesView
        payees={current}
        pendingId={pendingId}
        creating={creating}
        onCreate={(input: PayeeInput) =>
          fetcher.submit({ intent: "create", ...input } as Record<string, string>, {
            method: "post",
          })
        }
        onUpdate={(id: string, input: PayeeInput) =>
          fetcher.submit({ intent: "update", id, ...input } as Record<string, string>, {
            method: "post",
          })
        }
        onFavorite={(id: string, favorite: boolean) =>
          fetcher.submit(
            { intent: "favorite", id, favorite: String(favorite) },
            { method: "post" },
          )
        }
        onDelete={(id: string) => fetcher.submit({ intent: "delete", id }, { method: "post" })}
      />
    </>
  );
}
