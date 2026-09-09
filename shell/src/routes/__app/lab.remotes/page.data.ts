import type { LoaderFunctionArgs } from "@modern-js/runtime/router";
import { getSession, loginRedirect } from "@/mock/session";
import { remoteRegistry, type RemoteEntry } from "@/lib/remote-origins";

export type LabData = { render: null; registry: RemoteEntry[] };

// `render: null` flags the route client-rendered (the header badge flips to
// "CSR"): every federated module on this page is loaded in the browser via the
// MF runtime, never in the SSR stream. The registry (manifest URLs) is the only
// thing the loader hands over.
export const loader = ({ request }: LoaderFunctionArgs): LabData | Response => {
  if (!getSession(request)) return loginRedirect(request);
  return { render: null, registry: remoteRegistry() };
};
