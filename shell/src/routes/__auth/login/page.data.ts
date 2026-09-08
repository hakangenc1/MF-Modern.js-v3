import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@modern-js/runtime/router";
import { getSession, pendingCookie, safeRedirect } from "@/mock/session";

export type LoginData = { redirectTo: string };
export type LoginActionData = { error?: string; next?: string };

export const loader = async ({ request }: LoaderFunctionArgs): Promise<LoginData | Response> => {
  if (getSession(request)) return redirect("/");
  const url = new URL(request.url);
  return { redirectTo: safeRedirect(url.searchParams.get("redirectTo")) };
};

/**
 * NOTE: `@modern-js/plugin-data-loader@3.5` does not follow redirects returned
 * from *actions* on the client (only from loaders). So the action returns a
 * 200 JSON Response that carries the Set-Cookie plus a `next` path, and the
 * component navigates. Native form fallback still gets a redirect.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const redirectTo = safeRedirect(String(form.get("redirectTo") ?? ""));

  if (!email || !password) {
    return { error: "Enter your email and password to continue." } satisfies LoginActionData;
  }

  const next = `/login/verify?${new URLSearchParams({ redirectTo })}`;
  return new Response(JSON.stringify({ next } satisfies LoginActionData), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": pendingCookie(email),
    },
  });
};
