import type { ActionFunctionArgs } from "@modern-js/runtime/router";
import { clearedEntitlementsCookie, clearedSessionCookie } from "@/mock/session";

export type LogoutActionData = { next: string };

// This .output server strips Set-Cookie from a loader's 302, but keeps it on a
// 200 action Response (same as the login flow). So logout is an action: the
// page auto-POSTs on mount, we clear the cookie here, and the component
// navigates to /login.
export const loader = () => ({}); // page renders, then submits to this route

export const action = async (_args: ActionFunctionArgs) => {
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append("Set-Cookie", clearedSessionCookie());
  headers.append("Set-Cookie", clearedEntitlementsCookie());
  return new Response(JSON.stringify({ next: "/login" } satisfies LogoutActionData), {
    status: 200,
    headers,
  });
};
