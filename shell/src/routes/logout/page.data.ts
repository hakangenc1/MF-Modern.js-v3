import { clearedSessionCookie } from "@/mock/session";

// Same shape as loginRedirect() in mock/session.ts (a raw 302 Response with a
// plain headers object) — that reliably reaches the browser here, whereas the
// router's redirect() helper and a Headers instance did not forward Set-Cookie.
// The entitlement override cookie is persona-scoped, so clearing the session is
// enough: the next persona resolves its own defaults.
function bounce() {
  return new Response(null, {
    status: 302,
    headers: { Location: "/login", "Set-Cookie": clearedSessionCookie() },
  });
}

export const loader = bounce;
export const action = bounce;
