import { NextResponse } from "next/server";

import { verifyOtp } from "@/lib/auth/otp";
import { verifyOrigin } from "@/lib/security/csrf";
import { getClientIp, isRateLimited } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  if (!verifyOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: CSRF check failed" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rateLimit = isRateLimited(`verify-otp:${ip}`, { limit: 10, windowMs: 60000 });
  if (rateLimit.limited) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    if (!verifyOtp(normalizedEmail, String(code))) {
      return NextResponse.json(
        { error: "OTP unmatched, check and key in slowly" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("VERIFY_OTP_ERROR:", err);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
