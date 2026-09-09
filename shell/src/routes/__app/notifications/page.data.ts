import type { ActionFunctionArgs } from "@modern-js/runtime/router";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/mock";
import { serverStamp, type ServerStamp } from "@/lib/ssr";

export type NotificationsData = { notifications: NotificationItem[]; render: ServerStamp };

export const loader = async (): Promise<NotificationsData> => {
  return { notifications: await getNotifications(), render: serverStamp("shell") };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  if (intent === "read-all") return { notifications: await markAllNotificationsRead() };
  return { notifications: await markNotificationRead(String(form.get("id"))) };
};
