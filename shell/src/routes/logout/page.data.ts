import { clearedEntitlementsCookie, clearedSessionCookie } from "@/mock/session";

function bounce() {
  // Loaders (unlike actions) keep multiple Set-Cookie headers, so clear both the
  // session and the entitlement override here.
  const headers = new Headers({ Location: "/login" });
  headers.append("Set-Cookie", clearedSessionCookie());
  headers.append("Set-Cookie", clearedEntitlementsCookie());
  return new Response(null, { status: 302, headers });
}

export const loader = bounce;
export const action = bounce;
