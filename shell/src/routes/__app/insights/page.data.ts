import type { LoaderFunctionArgs } from "@modern-js/runtime/router";
import { requireEntitlement } from "@/mock/session";

// No data is loaded here — `render: null` marks this route as client-rendered so
// the header badge flips to "CSR". The page fetches everything in the browser.
// The `insights` entitlement still gates access.
export const loader = ({ request }: LoaderFunctionArgs) => {
  const denied = requireEntitlement(request, "insights");
  if (denied) return denied;
  return { render: null };
};
