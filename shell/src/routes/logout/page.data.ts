import { redirect } from "@modern-js/runtime/router";
import { clearedSessionCookie } from "@/mock/session";

function bounce() {
  return redirect("/login", { headers: { "Set-Cookie": clearedSessionCookie() } });
}

export const loader = bounce;
export const action = bounce;
