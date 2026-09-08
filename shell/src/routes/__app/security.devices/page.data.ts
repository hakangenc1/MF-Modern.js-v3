import type { ActionFunctionArgs, LoaderFunctionArgs } from "@modern-js/runtime/router";
import { requireEntitlement } from "@/mock/session";
import { loadDevices, revokeDeviceById } from "security/data";
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const denied = requireEntitlement(request, "security.advanced");
  if (denied) return denied;
  return { devices: await loadDevices() };
};
export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  return { devices: await revokeDeviceById(String(form.get("id") ?? "")) };
};
