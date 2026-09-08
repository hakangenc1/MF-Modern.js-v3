import type { ActionFunctionArgs, LoaderFunctionArgs } from "@modern-js/runtime/router";
import type { NotificationItem, User } from "@/mock";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/mock";
import { getSession, loginRedirect } from "@/mock/session";
import { serverStamp, type ServerStamp } from "@/lib/ssr";
import { remoteOrigins } from "@/lib/remote-origins";

export type AppLayoutData = {
  user: User;
  render: ServerStamp;
  remoteOrigins: string[];
  notifications: NotificationItem[];
  unreadCount: number;
};

export const loader = async ({
  request,
}: LoaderFunctionArgs): Promise<AppLayoutData | Response> => {
  const session = getSession(request);
  if (!session) return loginRedirect(request);
  const notifications = await getNotifications();
  return {
    user: session.user,
    render: serverStamp("shell"),
    remoteOrigins: remoteOrigins(),
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  if (intent === "read-all") return { notifications: await markAllNotificationsRead() };
  if (intent === "read") return { notifications: await markNotificationRead(String(form.get("id"))) };
  return {};
};
