import { randomBytes, timingSafeEqual } from "crypto";

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

const SESSION_COOKIE = "nexus_session";
const SESSION_TTL = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  brandId: string | null;
  name: string;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET ?? "dev-only-change-me-in-production";
  return new TextEncoder().encode(secret);
}

/** bcrypt cost 12 — fine for MVP; bump if policy requires. */
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

/** Constant-time compare wrapper around bcrypt. */
export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** Issues HS256 JWT into httpOnly cookie — payload is the session surface area. */
export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    brandId: user.brandId,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

/** Clears session cookie — idempotent. */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Returns null on missing, expired or tampered token — never throws. */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.email !== "string") return null;

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role as UserRole,
      brandId: (payload.brandId as string | null) ?? null,
      name: (payload.name as string) ?? payload.email,
    };
  } catch {
    return null;
  }
}

/** DB lookup + password check; inactive users are treated as non-existent. */
export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !user.isActive) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    brandId: user.brandId,
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
  } satisfies SessionUser;
}

/** Random hex for future CSRF — pair with verifyCsrfToken on mutating routes. */
export function csrfToken(): string {
  return randomBytes(24).toString("hex");
}

/** Timing-safe CSRF compare — both sides must be non-null. */
export function verifyCsrfToken(token: string | null, expected: string | null) {
  if (!token || !expected) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** ADMIN + OPERATIONS — dashboard, reports, ops API. */
export function roleCanAccessOps(role: UserRole) {
  return role === "ADMIN" || role === "OPERATIONS";
}

/** DRIVER portal; ops/admin can impersonate the driver view for support. */
export function roleCanAccessDriver(role: UserRole) {
  return role === "ADMIN" || role === "OPERATIONS" || role === "DRIVER";
}

/** Customer account area — separate from staff roles. */
export function roleCanAccessCustomer(role: UserRole) {
  return role === "CUSTOMER";
}

export { SESSION_COOKIE };
