import type { ActionFunctionArgs } from "@modern-js/runtime/router";
import { loadDevices, revokeDeviceById } from "@/federation/data";
export const loader = async () => ({ devices: await loadDevices() });
export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  return { devices: await revokeDeviceById(String(form.get("id") ?? "")) };
};
