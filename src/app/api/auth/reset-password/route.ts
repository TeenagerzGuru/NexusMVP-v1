import { NextResponse } from "next/server";

import { clearOtp, verifyOtp } from "@/lib/auth/otp";
import { hashPassword } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { verifyOrigin } from "@/lib/security/csrf";
import { getClientIp, isRateLimited } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  if (!verifyOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: CSRF check failed" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rateLimit = isRateLimited(`reset:${ip}`, { limit: 5, windowMs: 60000 });
  if (rateLimit.limited) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Email, OTP, and new password are required" },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    if (!verifyOtp(normalizedEmail, String(code))) {
      return NextResponse.json(
        { error: "OTP unmatched, check and key in slowly" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { passwordHash: hashedPassword },
    });

    clearOtp(normalizedEmail);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("RESET_PASSWORD_ERROR:", err);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
