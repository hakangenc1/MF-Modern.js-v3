/**
 * Federated data layer for the Security micro-frontend. Framework-agnostic.
 */
import {
  getDevices,
  getSecurityOverview,
  getSessions,
  regenerateRecoveryCodes,
  revokeDevice,
  revokeSession,
  setTwoFactor,
  verifyTwoFactorCode,
  type Device,
  type SecurityOverview,
  type SessionEntry,
} from "@/mock";

export async function loadSecurityOverview(): Promise<SecurityOverview> {
  return getSecurityOverview();
}

export async function loadDevices(): Promise<Device[]> {
  return getDevices();
}

export async function loadSessions(): Promise<SessionEntry[]> {
  return getSessions();
}

export async function verifyCode(code: string) {
  return verifyTwoFactorCode(code);
}

export async function setTwoFactorEnabled(enabled: boolean): Promise<SecurityOverview> {
  return setTwoFactor(enabled);
}

export async function regenerateCodes(): Promise<string[]> {
  return regenerateRecoveryCodes();
}

export async function revokeDeviceById(id: string): Promise<Device[]> {
  return revokeDevice(id);
}

export async function revokeSessionById(id: string): Promise<SessionEntry[]> {
  return revokeSession(id);
}

export type { Device, SecurityOverview, SessionEntry };
