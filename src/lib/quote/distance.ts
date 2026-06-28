import { geocodeUkPostcode } from "@/lib/quote/geocode";
import { parseUkPostcode } from "@/lib/quote/postcode";

export type DistanceResult = {
  miles: number;
  durationMinutes: number | null;
  source: "openrouteservice" | "estimate";
  profile: string;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; result: DistanceResult }>();

function cacheKey(origin: string, destination: string, profile: string): string {
  return `${origin.trim().toUpperCase()}|${destination.trim().toUpperCase()}|${profile}`;
}

function estimateMilesFromPostcodes(originPostcode: string, destinationPostcode: string): number {
  const origin = parseUkPostcode(originPostcode);
  const destination = parseUkPostcode(destinationPostcode);
  const key = [origin.area, destination.area].sort().join("-");
  const table: Record<string, number> = {
    "B-M": 85,
    "L-M": 35,
    "M-L": 35,
    "B-L": 100,
  };
  return table[key] ?? 120;
}

function toMiles(meters: number): number {
  return Math.round((meters / 1609.344) * 10) / 10;
}

async function fetchOrsDirections(
  apiKey: string,
  profile: string,
  origin: { longitude: number; latitude: number },
  destination: { longitude: number; latitude: number },
): Promise<{ miles: number; durationMinutes: number }> {
  const start = `${origin.longitude},${origin.latitude}`;
  const end = `${destination.longitude},${destination.latitude}`;
  const url = `https://api.openrouteservice.org/v2/directions/${profile}?start=${start}&end=${end}`;

  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
      Accept: "application/geo+json;charset=UTF-8",
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`ORS ${profile} failed (${response.status}): ${detail.slice(0, 200)}`);
  }

  const body = (await response.json()) as {
    routes?: Array<{ summary?: { distance?: number; duration?: number } }>;
    features?: Array<{ properties?: { summary?: { distance?: number; duration?: number } } }>;
  };

  const summary =
    body.routes?.[0]?.summary ?? body.features?.[0]?.properties?.summary;
  if (!summary?.distance) {
    throw new Error("ORS returned no route distance");
  }

  return {
    miles: toMiles(summary.distance),
    durationMinutes: Math.round((summary.duration ?? 0) / 60),
  };
}

/** Road distance: postcodes.io geocode → ORS HGV routing (cached). Falls back to area estimate. */
export async function getRoadDistance(
  originPostcode: string,
  destinationPostcode: string,
): Promise<DistanceResult> {
  const apiKey = process.env.ORS_API_KEY?.trim();
  const profile = "driving-hgv";
  const key = cacheKey(originPostcode, destinationPostcode, profile);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return hit.result;
  }

  if (!apiKey) {
    return {
      miles: estimateMilesFromPostcodes(originPostcode, destinationPostcode),
      durationMinutes: null,
      source: "estimate",
      profile: "estimate",
    };
  }

  try {
    const [origin, destination] = await Promise.all([
      geocodeUkPostcode(originPostcode),
      geocodeUkPostcode(destinationPostcode),
    ]);

    let routed: { miles: number; durationMinutes: number };
    try {
      routed = await fetchOrsDirections(apiKey, profile, origin, destination);
    } catch {
      routed = await fetchOrsDirections(apiKey, "driving-car", origin, destination);
    }

    const result: DistanceResult = {
      miles: routed.miles,
      durationMinutes: routed.durationMinutes,
      source: "openrouteservice",
      profile,
    };
    cache.set(key, { at: Date.now(), result });
    return result;
  } catch (error) {
    console.warn("[quote distance]", error);
    return {
      miles: estimateMilesFromPostcodes(originPostcode, destinationPostcode),
      durationMinutes: null,
      source: "estimate",
      profile: "estimate",
    };
  }
}
