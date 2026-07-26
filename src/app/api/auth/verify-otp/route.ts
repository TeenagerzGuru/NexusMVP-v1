import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/auth/otp";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!verifyOtp(normalizedEmail, code)) {
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
