import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@modern-js/runtime/router";
import { PERSONAS, verifyTwoFactorCode } from "@/mock";
import { getPending, getSession, safeRedirect, sessionCookie } from "@/mock/session";

export type VerifyData = { email: string; personaLabel: string; redirectTo: string };
export type VerifyActionData = { error?: string; next?: string };

export const loader = async ({ request }: LoaderFunctionArgs): Promise<VerifyData | Response> => {
  if (getSession(request)) return redirect("/");
  const pending = getPending(request);
  if (!pending) return redirect("/login");
  const url = new URL(request.url);
  const persona = PERSONAS.find((p) => p.id === pending.personaId);
  return {
    email: pending.email,
    personaLabel: persona?.label ?? "",
    redirectTo: safeRedirect(url.searchParams.get("redirectTo")),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const pending = getPending(request);
  if (!pending) return { next: "/login" } satisfies VerifyActionData;

  const form = await request.formData();
  const code = String(form.get("code") ?? "");
  const url = new URL(request.url);
  const redirectTo = safeRedirect(url.searchParams.get("redirectTo"));

  const result = await verifyTwoFactorCode(code);
  if (!result.ok) return { error: result.error ?? "Invalid code." } satisfies VerifyActionData;

  // Modern.js 3.5 collapses multiple Set-Cookie headers on an action Response,
  // so set only the session cookie (email + persona). The short-lived pending
  // cookie expires on its own; the entitlement override cookie stays absent so
  // getSession() falls back to the persona's default grants.
  return new Response(JSON.stringify({ next: redirectTo } satisfies VerifyActionData), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": sessionCookie(pending.email, pending.personaId),
    },
  });
};
