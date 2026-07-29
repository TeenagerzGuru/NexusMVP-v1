import { NextResponse } from "next/server";

import { setOtp } from "@/lib/auth/otp";
import { sendEmail } from "@/lib/email/send";
import { prisma } from "@/lib/prisma";
import { verifyOrigin } from "@/lib/security/csrf";
import { getClientIp, isRateLimited } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  if (!verifyOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: CSRF check failed" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rateLimit = isRateLimited(`forgot:${ip}`, { limit: 5, windowMs: 60000 });
  if (rateLimit.limited) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return ok — do not reveal whether the email is registered
    if (user?.passwordHash && user.isActive) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setOtp(normalizedEmail, code, 5 * 60 * 1000);

      await sendEmail({
        to: normalizedEmail,
        subject: "Your Password Reset OTP",
        html: `<p>Your password reset code is: <strong>${code}</strong></p><p>This code will expire in 5 minutes.</p>`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("FORGOT_PASSWORD_ERROR:", err);
    return NextResponse.json(
      { error: "Failed to process forgot password request" },
      { status: 500 }
    );
  }
}
