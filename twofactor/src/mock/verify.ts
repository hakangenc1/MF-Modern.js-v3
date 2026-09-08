/**
 * The only "backend" this remote has: a fake authenticator check. Framework-
 * agnostic, no session — the host owns the session; this just validates a code.
 */
export const DEMO_2FA_CODE = "123456";

export async function verifyCode(code: string): Promise<{ ok: boolean; error?: string }> {
  await new Promise((r) => setTimeout(r, 320));
  if (code.trim() === DEMO_2FA_CODE) return { ok: true };
  return { ok: false, error: "That code isn't right. For this demo, use 123456." };
}
