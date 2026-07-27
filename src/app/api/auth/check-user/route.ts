import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ exists: false }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    return NextResponse.json({ exists: !!user });
  } catch (err) {
    console.error("CHECK_USER_ERROR:", err);
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}
