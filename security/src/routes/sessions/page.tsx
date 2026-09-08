import { useFetcher, useLoaderData } from "@modern-js/runtime/router";
import SessionsView from "@/federation/SessionsView";
import type { SessionEntry } from "@/mock";
export default function Page() {
  const { sessions } = useLoaderData() as { sessions: SessionEntry[] };
  const fetcher = useFetcher<{ sessions?: SessionEntry[] }>();
  const pendingId =
    fetcher.state !== "idle" ? (fetcher.formData?.get("id") as string | null) : null;
  return (
    <SessionsView
      sessions={fetcher.data?.sessions ?? sessions}
      pendingId={pendingId}
      onRevoke={(id) => fetcher.submit({ id }, { method: "post" })}
    />
  );
}
