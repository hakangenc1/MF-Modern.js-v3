import { useFetcher, useLoaderData } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import TwoFactorView from "security/TwoFactorView";

export default function Page() {
  const { overview } = useLoaderData() as any;
  const fetcher = useFetcher<any>();
  const data = fetcher.data as any;
  const pendingIntent =
    fetcher.state !== "idle" ? (fetcher.formData?.get("intent") as string | null) : null;
  return (
    <>
      <Helmet><title>Two-factor auth · Northwind Bank</title></Helmet>
      <TwoFactorView
        overview={data?.overview ?? overview}
        pendingIntent={pendingIntent}
        verifyResult={data?.verifyResult}
        recoveryCodes={data?.recoveryCodes}
        actions={{
          onToggle: (e: boolean) =>
            fetcher.submit({ intent: "toggle", enabled: String(e) }, { method: "post" }),
          onRegenerate: () => fetcher.submit({ intent: "regenerate" }, { method: "post" }),
          onVerify: (c: string) =>
            fetcher.submit({ intent: "verify", code: c }, { method: "post" }),
        }}
      />
    </>
  );
}
