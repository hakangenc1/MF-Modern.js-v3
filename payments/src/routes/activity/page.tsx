import { useLoaderData } from "@modern-js/runtime/router";
import ActivityView from "@/federation/ActivityView";
import type { TransfersData } from "@/federation/data";
export default function Page() {
  return <ActivityView data={useLoaderData() as TransfersData} />;
}
