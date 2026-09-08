import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@modern-js/runtime/router";
import { PERSONAS } from "@/mock";
import { getSession, pendingCookie, safeRedirect } from "@/mock/session";

export type PersonaCard = {
  id: string;
  label: string;
  name: string;
  plan: string;
  tagline: string;
  can: string[];
  cannot: string[];
};

export type LoginData = { redirectTo: string; personas: PersonaCard[] };
export type LoginActionData = { error?: string; next?: string };

const toCard = (p: (typeof PERSONAS)[number]): PersonaCard => ({
  id: p.id,
  label: p.label,
  name: p.user.name,
  plan: p.user.plan,
  tagline: p.tagline,
  can: p.can,
  cannot: p.cannot,
});

export const loader = async ({ request }: LoaderFunctionArgs): Promise<LoginData | Response> => {
  const url = new URL(request.url);
  // `?switch` lets an already-signed-in user re-open the picker to change persona
  // (picking one issues a fresh bank_session that overwrites the old one).
  if (getSession(request) && !url.searchParams.has("switch")) return redirect("/");
  return {
    redirectTo: safeRedirect(url.searchParams.get("redirectTo")),
    personas: PERSONAS.map(toCard),
  };
};

/**
 * NOTE: `@modern-js/plugin-data-loader@3.5` does not follow redirects returned
 * from *actions* on the client (only from loaders). So the action returns a
 * 200 JSON Response that carries the Set-Cookie plus a `next` path, and the
 * component navigates. Native form fallback still gets a redirect.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const personaId = String(form.get("persona") ?? "");
  const redirectTo = safeRedirect(String(form.get("redirectTo") ?? ""));

  const persona = PERSONAS.find((p) => p.id === personaId);
  if (!persona) {
    return { error: "Choose a profile to continue." } satisfies LoginActionData;
  }

  const next = `/login/verify?${new URLSearchParams({ redirectTo })}`;
  return new Response(JSON.stringify({ next } satisfies LoginActionData), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": pendingCookie(persona.user.email, persona.id),
    },
  });
};
