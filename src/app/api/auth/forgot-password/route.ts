import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { setOtp } from "@/lib/auth/otp";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "No user found with this email" }, { status: 404 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(normalizedEmail, code, 5 * 60 * 1000);

    if (resend) {
      await resend.emails.send({
        from: "NexusMVP <noreply@resend.dev>",
        to: normalizedEmail,
        subject: "Your Password Reset OTP",
        html: `<p>Your password reset code is: <strong>${code}</strong></p><p>This code will expire in 5 minutes.</p>`,
      });
    } else {
      console.log(`[MOCK EMAIL] To: ${normalizedEmail} | OTP: ${code}`);
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
