/**
 * Cookie-backed mock auth shared by every micro-frontend. Server-only
 * (`node:crypto`). The "login" accepts any non-empty credentials; the point is
 * to exercise a realistic session + 2FA gate, not real authentication.
 * Framework-agnostic: works with any Fetch `Request` / `Response`.
 */
import crypto from "node:crypto";
import { PERSONAS } from "./seed";
import { ALL_ENTITLEMENTS } from "./types";
import type { Entitlement, Persona, User } from "./types";

const SECRET = process.env.SESSION_SECRET || "mfe-2.0-demo-secret-do-not-use-in-prod";
export const SESSION_COOKIE = "bank_session";
export const PENDING_COOKIE = "bank_2fa_pending";
export const ENTITLEMENTS_COOKIE = "bank_entitlements";
const MAX_AGE = 60 * 60 * 8; // 8h

const DEFAULT_PERSONA = PERSONAS[0]!;
const personaById = (id: string | undefined): Persona =>
  PERSONAS.find((p) => p.id === id) ?? DEFAULT_PERSONA;

function sign(value: string): string {
  const mac = crypto.createHmac("sha256", SECRET).update(value).digest("base64url");
  return `${value}.${mac}`;
}

function unsign(signed: string | undefined): string | null {
  if (!signed) return null;
  const idx = signed.lastIndexOf(".");
  if (idx < 0) return null;
  const value = signed.slice(0, idx);
  const mac = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return value;
}

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const key = part.slice(0, eq).trim();
    if (key) out[key] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

function serializeCookie(name: string, value: string, maxAge: number): string {
  const enc = encodeURIComponent(value);
  return [
    `${name}=${enc}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    maxAge <= 0 ? "Max-Age=0" : `Max-Age=${maxAge}`,
  ].join("; ");
}

/* ------------------------------------------------------------------- reads */

export interface Session {
  user: User;
  email: string;
  persona: Persona;
  /** Effective grants: the runtime override if present, else persona defaults. */
  entitlements: Entitlement[];
}

/** Parse the "email|personaId" cookie payload (tolerates the legacy email-only form). */
function splitIdentity(raw: string): { email: string; personaId?: string } {
  const bar = raw.indexOf("|");
  return bar < 0
    ? { email: raw }
    : { email: raw.slice(0, bar), personaId: raw.slice(bar + 1) };
}

/**
 * The runtime entitlement override, if set — scoped to a persona so switching
 * users (log out / pick the other persona) drops a stale override instead of
 * carrying it over. Stored as `personaId::["flag",…]`.
 */
export function readEntitlementOverride(
  request: Request,
  expectedPersonaId: string,
): Entitlement[] | null {
  const cookies = parseCookies(request.headers.get("cookie"));
  const raw = unsign(cookies[ENTITLEMENTS_COOKIE]);
  if (raw === null) return null;
  const sep = raw.indexOf("::");
  if (sep < 0 || raw.slice(0, sep) !== expectedPersonaId) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(sep + 2));
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  return ALL_ENTITLEMENTS.filter((e) => parsed.includes(e));
}

export function getSession(request: Request): Session | null {
  const cookies = parseCookies(request.headers.get("cookie"));
  const raw = unsign(cookies[SESSION_COOKIE]);
  if (!raw) return null;
  const { email, personaId } = splitIdentity(raw);
  if (!email) return null;
  const persona = personaById(personaId);
  const entitlements = readEntitlementOverride(request, persona.id) ?? persona.entitlements;
  return { user: { ...persona.user, email }, email, persona, entitlements };
}

export interface PendingLogin {
  email: string;
  personaId: string;
}

export function getPending(request: Request): PendingLogin | null {
  const cookies = parseCookies(request.headers.get("cookie"));
  const raw = unsign(cookies[PENDING_COOKIE]);
  if (!raw) return null;
  const { email, personaId } = splitIdentity(raw);
  if (!email) return null;
  return { email, personaId: personaById(personaId).id };
}

/* ------------------------------------------------------------------ writes */

export const pendingCookie = (email: string, personaId: string) =>
  serializeCookie(PENDING_COOKIE, sign(`${email}|${personaById(personaId).id}`), 600);
export const sessionCookie = (email: string, personaId: string) =>
  serializeCookie(SESSION_COOKIE, sign(`${email}|${personaById(personaId).id}`), MAX_AGE);
export const entitlementsCookie = (personaId: string, list: Entitlement[]) =>
  serializeCookie(
    ENTITLEMENTS_COOKIE,
    sign(
      `${personaById(personaId).id}::${JSON.stringify(
        ALL_ENTITLEMENTS.filter((e) => list.includes(e)),
      )}`,
    ),
    MAX_AGE,
  );
export const clearedPendingCookie = () => serializeCookie(PENDING_COOKIE, "", 0);
export const clearedSessionCookie = () => serializeCookie(SESSION_COOKIE, "", 0);
export const clearedEntitlementsCookie = () => serializeCookie(ENTITLEMENTS_COOKIE, "", 0);

/* --------------------------------------------------------------- guards */

/** Build a redirect Response to /login preserving the target path. */
export function loginRedirect(request: Request): Response {
  const url = new URL(request.url);
  // Strip framework-internal data-fetch params so redirectTo is a clean path.
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith("__")) url.searchParams.delete(key);
  }
  const target = url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : "");
  const params = new URLSearchParams({ redirectTo: target });
  return new Response(null, {
    status: 302,
    headers: { Location: `/login?${params}` },
  });
}

/** Sanitize a redirect target to a local path. */
export function safeRedirect(value: string | null | undefined, fallback = "/"): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

/**
 * Route guard for entitlement-gated pages. Returns a redirect Response the
 * loader should return early (to /login when signed out, to / when the signed-in
 * persona lacks the grant), or `null` when the request may proceed.
 */
export function requireEntitlement(request: Request, entitlement: Entitlement): Response | null {
  const session = getSession(request);
  if (!session) return loginRedirect(request);
  if (!session.entitlements.includes(entitlement)) {
    return new Response(null, { status: 302, headers: { Location: "/" } });
  }
  return null;
}
