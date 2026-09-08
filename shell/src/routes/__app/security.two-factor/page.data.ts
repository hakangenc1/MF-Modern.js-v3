import type { ActionFunctionArgs, LoaderFunctionArgs } from "@modern-js/runtime/router";
import { getSession } from "@/mock/session";
import { loadSecurityOverview, regenerateCodes, setTwoFactorEnabled, verifyCode } from "security/data";
export const loader = async ({ request }: LoaderFunctionArgs) => {
  getSession(request);
  return { overview: await loadSecurityOverview() };
};
export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  if (intent === "toggle") return { overview: await setTwoFactorEnabled(form.get("enabled") === "true") };
  if (intent === "regenerate") return { recoveryCodes: await regenerateCodes(), overview: await loadSecurityOverview() };
  if (intent === "verify") return { verifyResult: await verifyCode(String(form.get("code") ?? "")) };
  return {};
};
