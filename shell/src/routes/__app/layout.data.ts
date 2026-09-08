import type { LoaderFunctionArgs } from "@modern-js/runtime/router";
import type { User } from "@/mock";
import { getSession, loginRedirect } from "@/mock/session";
import { serverStamp, type ServerStamp } from "@/lib/ssr";

export type AppLayoutData = { user: User; render: ServerStamp };

export const loader = async ({
  request,
}: LoaderFunctionArgs): Promise<AppLayoutData | Response> => {
  const session = getSession(request);
  if (!session) return loginRedirect(request);
  return { user: session.user, render: serverStamp("shell") };
};
