import { useLoaderData } from "@modern-js/runtime/router";
import SecurityView from "@/federation/SecurityView";
import type { Device, SecurityOverview, SessionEntry } from "@/mock";

export default function Page() {
  const { overview, devices, sessions } = useLoaderData() as {
    overview: SecurityOverview;
    devices: Device[];
    sessions: SessionEntry[];
  };
  return <SecurityView overview={overview} devices={devices} sessions={sessions} />;
}
