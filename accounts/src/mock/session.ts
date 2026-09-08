/**
 * Cookie-backed mock auth shared by every micro-frontend. Server-only
 * (`node:crypto`). The "login" accepts any non-empty credentials; the point is
 * to exercise a realistic session + 2FA gate, not real authentication.
 * Framework-agnostic: works with any Fetch `Request` / `Response`.
 */
import crypto from "node:crypto";
import { USER } from "./seed";
import type { User } from "./types";

const SECRET = process.env.SESSION_SECRET || "mfe-2.0-demo-secret-do-not-use-in-prod";
export const SESSION_COOKIE = "bank_session";
export const PENDING_COOKIE = "bank_2fa_pending";
const MAX_AGE = 60 * 60 * 8; // 8h

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
}

export function getSession(request: Request): Session | null {
  const cookies = parseCookies(request.headers.get("cookie"));
  const email = unsign(cookies[SESSION_COOKIE]);
  if (!email) return null;
  return { user: { ...USER, email }, email };
}

export function getPendingEmail(request: Request): string | null {
  const cookies = parseCookies(request.headers.get("cookie"));
  return unsign(cookies[PENDING_COOKIE]);
}

/* ------------------------------------------------------------------ writes */

export const pendingCookie = (email: string) => serializeCookie(PENDING_COOKIE, sign(email), 600);
export const sessionCookie = (email: string) => serializeCookie(SESSION_COOKIE, sign(email), MAX_AGE);
export const clearedPendingCookie = () => serializeCookie(PENDING_COOKIE, "", 0);
export const clearedSessionCookie = () => serializeCookie(SESSION_COOKIE, "", 0);

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
