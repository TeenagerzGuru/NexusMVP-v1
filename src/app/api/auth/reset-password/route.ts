import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { verifyOtp, clearOtp } from "@/lib/auth/otp";

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Email, OTP, and new password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!verifyOtp(normalizedEmail, code)) {
      return NextResponse.json(
        { error: "OTP unmatched, check and key in slowly" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(newPassword, 10);

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
