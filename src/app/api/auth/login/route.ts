import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticateUser, createSession } from "@/lib/auth/session";
import { getClientIp, isRateLimited } from "@/lib/security/rate-limit";
import { verifyOrigin } from "@/lib/security/csrf";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/** Sets session cookie on success; returns role for client-side redirect routing. */
export async function POST(request: Request) {
  // CSRF verification
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: "Forbidden: CSRF check failed" }, { status: 403 });
  }

  // Rate Limiting
  const ip = getClientIp(request);
  const rateLimit = isRateLimited(ip, { limit: 10, windowMs: 60000 }); // 10 attempts per minute
  if (rateLimit.limited) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((rateLimit.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  try {
    const body = schema.parse(await request.json());
    const user = await authenticateUser(body.email, body.password);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    await createSession(user);
    return NextResponse.json({ ok: true, role: user.role });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
