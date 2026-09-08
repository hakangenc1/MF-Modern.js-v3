import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@modern-js/runtime/router";
import { ALL_ENTITLEMENTS, type Entitlement } from "@/mock";
import { entitlementsCookie, getSession, loginRedirect } from "@/mock/session";

/**
 * Action-only route. The top-bar Entitlements popover and the Settings card both
 * POST here with `value` (a comma-joined entitlement list). We rewrite the
 * signed override cookie and let React Router revalidate the app layout loader —
 * `getSession()` re-reads the cookie and the whole tree re-renders with the new
 * grants. GET just bounces to Settings.
 */
export const loader = ({ request }: LoaderFunctionArgs) => {
  if (!getSession(request)) return loginRedirect(request);
  return redirect("/settings");
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const session = getSession(request);
  if (!session) return loginRedirect(request);

  const form = await request.formData();
  const requested = String(form.get("value") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const valid = ALL_ENTITLEMENTS.filter((e) => requested.includes(e)) as Entitlement[];

  return new Response(JSON.stringify({ ok: true, entitlements: valid }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": entitlementsCookie(session.persona.id, valid),
    },
  });
};
