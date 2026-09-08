import type { LoaderFunctionArgs } from "@modern-js/runtime/router";
import type { User } from "@/mock";
import { getSession, loginRedirect } from "@/mock/session";
import { serverStamp, type ServerStamp } from "@/lib/ssr";
import { remoteOrigins } from "@/lib/remote-origins";

export type AppLayoutData = {
  user: User;
  render: ServerStamp;
  remoteOrigins: string[];
};

export const loader = async ({
  request,
}: LoaderFunctionArgs): Promise<AppLayoutData | Response> => {
  const session = getSession(request);
  if (!session) return loginRedirect(request);
  return {
    user: session.user,
    render: serverStamp("shell"),
    remoteOrigins: remoteOrigins(),
  };
};
