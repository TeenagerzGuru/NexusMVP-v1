import { NextResponse } from "next/server";

import { createSession, hashPassword } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { verifyOrigin } from "@/lib/security/csrf";
import { getClientIp, isRateLimited } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  if (!verifyOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: CSRF check failed" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rateLimit = isRateLimited(`register:${ip}`, { limit: 5, windowMs: 60000 });
  if (rateLimit.limited) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const nameParts = String(name).trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: normalizedEmail,
        passwordHash: hashedPassword,
        role: "CUSTOMER",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        brandId: true,
      },
    });

    await createSession({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      brandId: newUser.brandId,
      name: [newUser.firstName, newUser.lastName].filter(Boolean).join(" ") || newUser.email,
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("REGISTER_API_ERROR:", err);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
