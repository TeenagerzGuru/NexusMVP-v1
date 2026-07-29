/**
 * In-memory OTP store for password reset.
 * Not offline/outbox sync — codes live only in the server process until used or expired.
 */

interface OtpRecord {
  code: string;
  expiresAt: number;
}

type OtpStore = Map<string, OtpRecord>;

function getStore(): OtpStore {
  const globalAny = globalThis as typeof globalThis & { __nexusOtps?: OtpStore };
  if (!globalAny.__nexusOtps) {
    globalAny.__nexusOtps = new Map();
  }
  return globalAny.__nexusOtps;
}

export function setOtp(email: string, code: string, expiresInMs: number) {
  getStore().set(email.toLowerCase().trim(), {
    code,
    expiresAt: Date.now() + expiresInMs,
  });
}

export function verifyOtp(email: string, code: string): boolean {
  const record = getStore().get(email.toLowerCase().trim());
  if (!record) return false;
  if (record.expiresAt < Date.now()) {
    getStore().delete(email.toLowerCase().trim());
    return false;
  }
  return record.code === code;
}

export function clearOtp(email: string) {
  getStore().delete(email.toLowerCase().trim());
}
