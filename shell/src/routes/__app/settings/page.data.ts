import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@modern-js/runtime/router";
import {
  ALL_ENTITLEMENTS,
  getAccounts,
  getProfile,
  setAccountNickname,
  updateProfile,
  type Account,
  type Entitlement,
  type Profile,
} from "@/mock";
import { entitlementsCookie, getSession, loginRedirect } from "@/mock/session";

export type SettingsData = {
  profile: Profile;
  accounts: Account[];
  entitlements: Entitlement[];
  persona: { id: string; label: string; defaults: Entitlement[] };
};

export const loader = async ({
  request,
}: LoaderFunctionArgs): Promise<SettingsData | Response> => {
  const session = getSession(request);
  if (!session) return loginRedirect(request);
  const [profile, allAccounts] = await Promise.all([getProfile(), getAccounts()]);
  const accounts = session.entitlements.includes("wealth")
    ? allAccounts
    : allAccounts.filter((a) => a.type !== "investment");
  return {
    profile,
    accounts,
    entitlements: session.entitlements,
    persona: {
      id: session.persona.id,
      label: session.persona.label,
      defaults: session.persona.entitlements,
    },
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const session = getSession(request);
  if (!session) return loginRedirect(request);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");

  if (intent === "entitlements") {
    const wanted = String(form.get("value") ?? "").split(",");
    const valid = ALL_ENTITLEMENTS.filter((e) => wanted.includes(e));
    // Redirect (not a data return): a fresh navigation re-runs every loader so
    // the sidebar + federated views pick up the change. Set-Cookie survives a
    // 302 from an action (it does not from a loader).
    return redirect("/settings", {
      headers: { "Set-Cookie": entitlementsCookie(session.persona.id, valid) },
    });
  }

  if (intent === "profile") {
    const profile = await updateProfile({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      address: String(form.get("address") ?? ""),
    });
    return { profile, saved: "profile" };
  }
  if (intent === "prefs") {
    const profile = await updateProfile({
      marketingEmails: form.get("marketingEmails") === "true",
      pushAlerts: form.get("pushAlerts") === "true",
    });
    return { profile, saved: "prefs" };
  }
  if (intent === "nickname") {
    const profile = await setAccountNickname(
      String(form.get("accountId")),
      String(form.get("nickname") ?? ""),
    );
    return { profile, saved: "nickname" };
  }
  return {};
};
