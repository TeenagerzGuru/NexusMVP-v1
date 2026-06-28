import { geocodeUkPostcode } from "@/lib/quote/geocode";
import { parseUkPostcode } from "@/lib/quote/postcode";

export type RoutePreview = {
  origin: { postcode: string; latitude: number; longitude: number };
  destination: { postcode: string; latitude: number; longitude: number };
  /** Leaflet-ready [lat, lng] pairs along the route */
  coordinates: Array<[number, number]>;
  miles: number;
  durationMinutes: number | null;
  source: "openrouteservice" | "estimate";
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; result: RoutePreview }>();

function cacheKey(origin: string, destination: string): string {
  return `${origin.trim().toUpperCase()}|${destination.trim().toUpperCase()}`;
}

function toMiles(meters: number): number {
  return Math.round((meters / 1609.344) * 10) / 10;
}

function flipLine(coordinates: number[][]): Array<[number, number]> {
  return coordinates.map(([lon, lat]) => [lat, lon] as [number, number]);
}

type OrsDirectionsBody = {
  routes?: Array<{
    summary?: { distance?: number; duration?: number };
    geometry?: { coordinates?: number[][] };
  }>;
  features?: Array<{
    geometry?: { coordinates?: number[][] };
    properties?: { summary?: { distance?: number; duration?: number } };
  }>;
};

async function fetchOrsRoute(
  apiKey: string,
  profile: string,
  origin: { longitude: number; latitude: number },
  destination: { longitude: number; latitude: number },
): Promise<{ miles: number; durationMinutes: number; coordinates: Array<[number, number]> }> {
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
    throw new Error(`ORS ${profile} failed (${response.status})`);
  }

  const body = (await response.json()) as OrsDirectionsBody;
  const feature = body.features?.[0];
  const route = body.routes?.[0];
  const summary = feature?.properties?.summary ?? route?.summary;
  const rawCoords = feature?.geometry?.coordinates ?? route?.geometry?.coordinates;

  if (!summary?.distance || !rawCoords?.length) {
    throw new Error("ORS returned no route geometry");
  }

  return {
    miles: toMiles(summary.distance),
    durationMinutes: Math.round((summary.duration ?? 0) / 60),
    coordinates: flipLine(rawCoords),
  };
}

function straightLine(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  miles: number,
): RoutePreview["coordinates"] {
  return [
    [origin.latitude, origin.longitude],
    [destination.latitude, destination.longitude],
  ];
}

/** Geocode + route geometry for live map preview on the quote form. */
export async function getRoutePreview(
  originPostcode: string,
  destinationPostcode: string,
): Promise<RoutePreview> {
  parseUkPostcode(originPostcode);
  parseUkPostcode(destinationPostcode);

  const key = cacheKey(originPostcode, destinationPostcode);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return hit.result;
  }

  const [origin, destination] = await Promise.all([
    geocodeUkPostcode(originPostcode),
    geocodeUkPostcode(destinationPostcode),
  ]);

  const apiKey = process.env.ORS_API_KEY?.trim();
  let miles: number;
  let durationMinutes: number | null = null;
  let coordinates: Array<[number, number]>;
  let source: RoutePreview["source"] = "estimate";

  if (apiKey) {
    try {
      let routed;
      try {
        routed = await fetchOrsRoute(apiKey, "driving-hgv", origin, destination);
      } catch {
        routed = await fetchOrsRoute(apiKey, "driving-car", origin, destination);
      }
      miles = routed.miles;
      durationMinutes = routed.durationMinutes;
      coordinates = routed.coordinates;
      source = "openrouteservice";
    } catch (error) {
      console.warn("[route-preview]", error);
      const { getRoadDistance } = await import("@/lib/quote/distance");
      const distance = await getRoadDistance(originPostcode, destinationPostcode);
      miles = distance.miles;
      durationMinutes = distance.durationMinutes;
      coordinates = straightLine(origin, destination, miles);
      source = distance.source;
    }
  } else {
    const { getRoadDistance } = await import("@/lib/quote/distance");
    const distance = await getRoadDistance(originPostcode, destinationPostcode);
    miles = distance.miles;
    durationMinutes = distance.durationMinutes;
    coordinates = straightLine(origin, destination, miles);
    source = distance.source;
  }

  const result: RoutePreview = {
    origin: { postcode: origin.postcode, latitude: origin.latitude, longitude: origin.longitude },
    destination: {
      postcode: destination.postcode,
      latitude: destination.latitude,
      longitude: destination.longitude,
    },
    coordinates,
    miles,
    durationMinutes,
    source,
  };

  cache.set(key, { at: Date.now(), result });
  return result;
}
