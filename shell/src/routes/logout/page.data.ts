import { redirect } from "@modern-js/runtime/router";
import { clearedEntitlementsCookie, clearedSessionCookie } from "@/mock/session";

function bounce() {
  // Loaders keep multiple Set-Cookie headers (unlike actions). Clear the session
  // and the entitlement override so the next persona starts from its defaults.
  const headers = new Headers();
  headers.append("Set-Cookie", clearedSessionCookie());
  headers.append("Set-Cookie", clearedEntitlementsCookie());
  return redirect("/login", { headers });
}

export const loader = bounce;
export const action = bounce;
