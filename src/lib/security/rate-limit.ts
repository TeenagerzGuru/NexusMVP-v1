type RateLimitRecord = {
  timestamps: number[];
};

const cache = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes to prevent memory leaks
if (typeof globalThis !== "undefined") {
  const globalAny = globalThis as any;
  if (!globalAny.__rateLimitInterval) {
    globalAny.__rateLimitInterval = setInterval(() => {
      const now = Date.now();
      for (const [ip, record] of cache.entries()) {
        record.timestamps = record.timestamps.filter((t) => now - t < 3600000);
        if (record.timestamps.length === 0) {
          cache.delete(ip);
        }
      }
    }, 300000);
    // Do not let the interval prevent process exit
    if (globalAny.__rateLimitInterval && typeof globalAny.__rateLimitInterval.unref === "function") {
      globalAny.__rateLimitInterval.unref();
    }
  }
}

export interface RateLimitOptions {
  limit: number;      // max requests
  windowMs: number;   // timeframe in milliseconds
}

export function isRateLimited(
  ip: string,
  options: RateLimitOptions
): { limited: boolean; remaining: number; reset: number } {
  const now = Date.now();
  let record = cache.get(ip);
  if (!record) {
    record = { timestamps: [] };
    cache.set(ip, record);
  }

  // Remove timestamps older than the window
  record.timestamps = record.timestamps.filter((t) => now - t < options.windowMs);

  if (record.timestamps.length >= options.limit) {
    const oldest = record.timestamps[0];
    const reset = oldest + options.windowMs;
    return {
      limited: true,
      remaining: 0,
      reset,
    };
  }

  record.timestamps.push(now);
  return {
    limited: false,
    remaining: options.limit - record.timestamps.length,
    reset: now + options.windowMs,
  };
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "127.0.0.1";
}
