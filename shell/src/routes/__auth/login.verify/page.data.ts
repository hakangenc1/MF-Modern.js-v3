import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@modern-js/runtime/router";
import { verifyTwoFactorCode } from "@/mock";
import { getPendingEmail, getSession, safeRedirect, sessionCookie } from "@/mock/session";

export type VerifyData = { email: string; redirectTo: string };
export type VerifyActionData = { error?: string; next?: string };

export const loader = async ({ request }: LoaderFunctionArgs): Promise<VerifyData | Response> => {
  if (getSession(request)) return redirect("/");
  const email = getPendingEmail(request);
  if (!email) return redirect("/login");
  const url = new URL(request.url);
  return { email, redirectTo: safeRedirect(url.searchParams.get("redirectTo")) };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const email = getPendingEmail(request);
  if (!email) return { next: "/login" } satisfies VerifyActionData;

  const form = await request.formData();
  const code = String(form.get("code") ?? "");
  const url = new URL(request.url);
  const redirectTo = safeRedirect(url.searchParams.get("redirectTo"));

  const result = await verifyTwoFactorCode(code);
  if (!result.ok) return { error: result.error ?? "Invalid code." } satisfies VerifyActionData;

  // Modern.js 3.5 collapses multiple Set-Cookie headers on an action Response,
  // so set only the session cookie. The short-lived pending cookie expires on
  // its own and the /login/verify loader redirects away once a session exists.
  return new Response(JSON.stringify({ next: redirectTo } satisfies VerifyActionData), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": sessionCookie(email),
    },
  });
};
