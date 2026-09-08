import { useLoaderData } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import SecurityView from "security/SecurityView";
import { useCan } from "@/lib/entitlements";
export default function Page() {
  const { overview, devices, sessions } = useLoaderData() as any;
  const allowAdvanced = useCan("security.advanced");
  return (<><Helmet><title>Security · Northwind Bank</title></Helmet>
    <SecurityView
      overview={overview}
      devices={devices}
      sessions={sessions}
      allowAdvanced={allowAdvanced}
    /></>);
}
