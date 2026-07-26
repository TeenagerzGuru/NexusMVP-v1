import fs from "fs";
import path from "path";

const OTP_FILE = path.join(process.cwd(), ".otps.json");

interface OtpRecord {
  code: string;
  expiresAt: number;
}

function getOtps(): Record<string, OtpRecord> {
  try {
    if (fs.existsSync(OTP_FILE)) {
      return JSON.parse(fs.readFileSync(OTP_FILE, "utf-8"));
    }
  } catch (e) {
    // ignore
  }
  return {};
}

function saveOtps(otps: Record<string, OtpRecord>) {
  try {
    fs.writeFileSync(OTP_FILE, JSON.stringify(otps, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write OTP file", e);
  }
}

export function setOtp(email: string, code: string, expiresInMs: number) {
  const otps = getOtps();
  otps[email] = {
    code,
    expiresAt: Date.now() + expiresInMs,
  };
  saveOtps(otps);
}

export function verifyOtp(email: string, code: string): boolean {
  const otps = getOtps();
  const record = otps[email];

  if (!record) return false;

  if (record.code !== code || record.expiresAt < Date.now()) {
    return false;
  }

  return true;
}

export function clearOtp(email: string) {
  const otps = getOtps();
  if (otps[email]) {
    delete otps[email];
    saveOtps(otps);
  }
}
