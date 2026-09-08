import type { ActionFunctionArgs, LoaderFunctionArgs } from "@modern-js/runtime/router";
import {
  getAccounts,
  getProfile,
  setAccountNickname,
  updateProfile,
  type Account,
  type Entitlement,
  type Profile,
} from "@/mock";
import { getSession, loginRedirect } from "@/mock/session";

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
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");

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
