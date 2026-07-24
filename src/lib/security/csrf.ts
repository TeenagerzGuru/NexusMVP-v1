/**
 * Verifies that the request Origin or Referer header matches the host,
 * preventing Cross-Site Request Forgery (CSRF).
 */
export function verifyOrigin(req: Request): boolean {
  // Only check state-mutating requests
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return true;
  }

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host") || req.headers.get("x-forwarded-host");

  if (!host) return false;

  // Normalize host to lowercase and remove port if present
  const cleanHost = host.toLowerCase().split(":")[0];

  if (origin) {
    try {
      const originUrl = new URL(origin);
      const cleanOriginHost = originUrl.host.toLowerCase().split(":")[0];

      // Allow localhost and local IPs in development
      if (
        process.env.NODE_ENV === "development" &&
        (cleanOriginHost === "localhost" ||
          cleanOriginHost === "127.0.0.1" ||
          cleanOriginHost.startsWith("192.168."))
      ) {
        return true;
      }
      return cleanOriginHost === cleanHost;
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const cleanRefererHost = refererUrl.host.toLowerCase().split(":")[0];

      if (
        process.env.NODE_ENV === "development" &&
        (cleanRefererHost === "localhost" ||
          cleanRefererHost === "127.0.0.1" ||
          cleanRefererHost.startsWith("192.168."))
      ) {
        return true;
      }
      return cleanRefererHost === cleanHost;
    } catch {
      return false;
    }
  }

  // If neither Origin nor Referer is present, block the request for safety
  return false;
}
