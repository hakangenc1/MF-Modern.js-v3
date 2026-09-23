import type { ActionFunctionArgs, LoaderFunctionArgs } from "@modern-js/runtime/router";
import type { Entitlement, NotificationItem, User } from "@/mock";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/mock";
import { getSession, loginRedirect } from "@/mock/session";
import { serverStamp, type ServerStamp } from "@/lib/ssr";
import { remoteList } from "@/lib/remote-origins";

export type AppLayoutData = {
  user: User;
  /** Effective entitlements — drives the sidebar/route gating via context. */
  entitlements: Entitlement[];
  render: ServerStamp;
  /** Name + public origin of every remote — preconnect hints, and where the
   * "How this page was rendered" popover fetches live versions from
   * (client-side, on demand — see shell/src/lib/remote-versions.ts). */
  remotes: { name: string; origin: string }[];
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
    entitlements: session.entitlements,
    render: serverStamp("shell"),
    remotes: remoteList(),
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
