import { useFetcher, useLoaderData } from "@modern-js/runtime/router";
import TwoFactorView from "@/federation/TwoFactorView";
import type { SecurityOverview } from "@/mock";

export default function Page() {
  const { overview } = useLoaderData() as { overview: SecurityOverview };
  const fetcher = useFetcher<
    { overview?: SecurityOverview; recoveryCodes?: string[]; verifyResult?: { ok?: boolean; error?: string } }
  >();
  const data = fetcher.data;
  const pendingIntent =
    fetcher.state !== "idle" ? (fetcher.formData?.get("intent") as string | null) : null;

  return (
    <TwoFactorView
      overview={data?.overview ?? overview}
      pendingIntent={pendingIntent}
      verifyResult={data?.verifyResult}
      recoveryCodes={data?.recoveryCodes}
      actions={{
        onToggle: (enabled) => fetcher.submit({ intent: "toggle", enabled: String(enabled) }, { method: "post" }),
        onRegenerate: () => fetcher.submit({ intent: "regenerate" }, { method: "post" }),
        onVerify: (code) => fetcher.submit({ intent: "verify", code }, { method: "post" }),
      }}
    />
  );
}
