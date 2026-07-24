import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

import { BRAND_HEADER, hostnameToBrandSlug, type BrandSlug } from "@/lib/brand/types";

const SESSION_COOKIE = "nexus_session";

function getSecret() {
  const secret = process.env.AUTH_SECRET ?? "dev-only-change-me-in-production";
  return new TextEncoder().encode(secret);
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

/** Dev/prod brand slug from hostname, with BRAND_OVERRIDE and localhost fallback. */
function resolveBrandSlug(hostname: string): BrandSlug {
  const override = process.env.BRAND_OVERRIDE;
  if (override === "deliverred" || override === "titan-cargo") {
    return override;
  }

  const fromHost = hostnameToBrandSlug(hostname);
  if (fromHost) return fromHost;

  // Dev fallback — LAN IP, IPv6 localhost, etc.
  if (process.env.NODE_ENV === "development") {
    return "deliverred";
  }

  return "deliverred";
}

/** Injects x-nexus-brand-slug and enforces JWT/role-based security on protected routes. */
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? request.nextUrl.hostname;
  const slug = resolveBrandSlug(hostname);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(BRAND_HEADER, slug);

  const pathname = request.nextUrl.pathname;

  // Secure endpoints/routes mapping
  const isDashboard = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/admin");
  const isDriver = pathname.startsWith("/driver");
  const isAccount = pathname.startsWith("/account");

  const isApiOps = pathname.startsWith("/api/ops");
  const isApiAdmin = pathname.startsWith("/api/admin");
  const isApiDriver = pathname.startsWith("/api/driver");

  const isProtected =
    isDashboard || isAdmin || isDriver || isAccount || isApiOps || isApiAdmin || isApiDriver;

  if (isProtected) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.sub || typeof payload.role !== "string") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const role = payload.role;

    // ADMIN only routes
    if (isAdmin || isApiAdmin) {
      if (role !== "ADMIN") {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    // OPERATIONS or ADMIN routes
    if (isDashboard || isApiOps) {
      if (role !== "ADMIN" && role !== "OPERATIONS") {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    // DRIVER, OPERATIONS or ADMIN routes
    if (isDriver || isApiDriver) {
      if (role !== "ADMIN" && role !== "OPERATIONS" && role !== "DRIVER") {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    // CUSTOMER portal check
    if (isAccount) {
      if (role !== "CUSTOMER") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
