import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticateUser, createSession } from "@/lib/auth/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/** Sets session cookie on success; returns role for client-side redirect routing. */
export async function POST(request: Request) {
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
