import type { ActionFunctionArgs, LoaderFunctionArgs } from "@modern-js/runtime/router";
import {
  getAccounts,
  getProfile,
  setAccountNickname,
  updateProfile,
  type Account,
  type Profile,
} from "@/mock";
import { getSession } from "@/mock/session";

export type SettingsData = { profile: Profile; accounts: Account[] };

export const loader = async ({ request }: LoaderFunctionArgs): Promise<SettingsData> => {
  getSession(request);
  const [profile, accounts] = await Promise.all([getProfile(), getAccounts()]);
  return { profile, accounts };
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
