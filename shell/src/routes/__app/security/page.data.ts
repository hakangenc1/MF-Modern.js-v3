import type { LoaderFunctionArgs } from "@modern-js/runtime/router";
import { getSession } from "@/mock/session";
import { loadDevices, loadSecurityOverview, loadSessions } from "security/data";
export const loader = async ({ request }: LoaderFunctionArgs) => {
  getSession(request);
  const [overview, devices, sessions] = await Promise.all([
    loadSecurityOverview(), loadDevices(), loadSessions(),
  ]);
  return { overview, devices, sessions };
};
