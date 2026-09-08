import type { ActionFunctionArgs, LoaderFunctionArgs } from "@modern-js/runtime/router";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/mock";
import { getSession } from "@/mock/session";
import { serverStamp, type ServerStamp } from "@/lib/ssr";

export type NotificationsData = { notifications: NotificationItem[]; render: ServerStamp };

export const loader = async ({ request }: LoaderFunctionArgs): Promise<NotificationsData> => {
  getSession(request);
  return { notifications: await getNotifications(), render: serverStamp("shell") };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  if (intent === "read-all") return { notifications: await markAllNotificationsRead() };
  return { notifications: await markNotificationRead(String(form.get("id"))) };
};
