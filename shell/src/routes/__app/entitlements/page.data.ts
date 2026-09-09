import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@modern-js/runtime/router";
import { ALL_ENTITLEMENTS, type Entitlement } from "@/mock";
import { entitlementsCookie, getSession, loginRedirect, safeRedirect } from "@/mock/session";

/**
 * Action-only route. The top-bar Entitlements popover and the Settings card both
 * POST here with `value` (a comma-joined entitlement list) + `from` (the current
 * path). We rewrite the signed override cookie and **redirect back to `from`** —
 * a clean navigation re-runs every loader with the new grants. (A plain
 * fetcher + in-place revalidation aborts any still-streaming `defer()` promise,
 * which surfaces as a route error when the mock latency is high — see
 * MOCK_LATENCY.) GET just bounces to Settings.
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
  const back = safeRedirect(String(form.get("from") ?? ""), "/settings");

  return redirect(back, {
    headers: { "Set-Cookie": entitlementsCookie(session.persona.id, valid) },
  });
};
