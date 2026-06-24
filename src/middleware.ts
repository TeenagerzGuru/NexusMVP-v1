import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { BRAND_HEADER, hostnameToBrandSlug, type BrandSlug } from "@/lib/brand/types";

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

/** Injects x-nexus-brand-slug on every matched request for downstream server code. */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? request.nextUrl.hostname;
  const slug = resolveBrandSlug(hostname);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(BRAND_HEADER, slug);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
