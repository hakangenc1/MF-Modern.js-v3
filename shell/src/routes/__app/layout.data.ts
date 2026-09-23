import type { ActionFunctionArgs, LoaderFunctionArgs } from "@modern-js/runtime/router";
import type { Entitlement, NotificationItem, User } from "@/mock";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/mock";
import { getSession, loginRedirect } from "@/mock/session";
import { serverStamp, type ServerStamp } from "@/lib/ssr";
import { remoteList } from "@/lib/remote-origins";
import { fetchRemoteVersions, type RemoteVersion } from "@/lib/remote-versions";

export type AppLayoutData = {
  user: User;
  /** Effective entitlements — drives the sidebar/route gating via context. */
  entitlements: Entitlement[];
  render: ServerStamp;
  /** Name + public origin of every remote — used for preconnect hints. */
  remotes: { name: string; origin: string }[];
  /** Shell's own version — compiled in at build time (see modern.config.ts),
   * not fetched. Shown next to the remotes' versions in the sidebar footer. */
  shellVersion: string;
  /** Each remote's live build version, straight from its own mf-manifest.json
   * — fetched here (not lazily) because it's always on screen now, in the
   * sidebar footer, not hidden behind a click. */
  remoteVersions: RemoteVersion[];
  notifications: NotificationItem[];
  unreadCount: number;
};

export const loader = async ({
  request,
}: LoaderFunctionArgs): Promise<AppLayoutData | Response> => {
  const session = getSession(request);
  if (!session) return loginRedirect(request);
  const remotes = remoteList();
  const [notifications, remoteVersions] = await Promise.all([
    getNotifications(),
    fetchRemoteVersions(remotes),
  ]);
  return {
    user: session.user,
    entitlements: session.entitlements,
    render: serverStamp("shell"),
    remotes,
    shellVersion: process.env.SHELL_VERSION ?? "0.0.0",
    remoteVersions,
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

// NOTE: a `shouldRevalidate` export here does *not* fix staleness on plain
// in-app navigation, even though @modern-js/runtime's route codegen wires one
// up per-route. Verified: the client's actual navigation request
// (`/x?__loader=__app%2Fx%2Fpage&__ssrDirect=true`) only ever names the leaf
// route — this shared layout's loader isn't re-run no matter what
// shouldRevalidate returns, for reasons not worth chasing further into
// minified framework internals. AppSidebar instead re-fetches remote
// versions itself, client-side, on every pathname change — see
// shell/src/components/app-sidebar.tsx.
