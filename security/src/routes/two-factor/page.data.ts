import type { ActionFunctionArgs } from "@modern-js/runtime/router";
import {
  loadSecurityOverview,
  regenerateCodes,
  setTwoFactorEnabled,
  verifyCode,
} from "@/federation/data";

export const loader = async () => ({ overview: await loadSecurityOverview() });

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  if (intent === "toggle") {
    return { overview: await setTwoFactorEnabled(form.get("enabled") === "true") };
  }
  if (intent === "regenerate") {
    const codes = await regenerateCodes();
    return { recoveryCodes: codes, overview: await loadSecurityOverview() };
  }
  if (intent === "verify") {
    return { verifyResult: await verifyCode(String(form.get("code") ?? "")) };
  }
  return {};
};
