export type GeoPoint = {
  postcode: string;
  latitude: number;
  longitude: number;
};

/** UK postcode → WGS84 coordinates via postcodes.io (ONS centroid). */
export async function geocodeUkPostcode(raw: string): Promise<GeoPoint> {
  const compact = raw.trim().toUpperCase().replace(/\s+/g, "");
  const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(compact)}`);

  if (!response.ok) {
    throw new Error(`Postcode not found: ${raw}`);
  }

  const body = (await response.json()) as {
    status: number;
    result: { postcode: string; latitude: number | null; longitude: number | null } | null;
  };

  if (body.status !== 200 || !body.result) {
    throw new Error(`Invalid UK postcode: ${raw}`);
  }

  const { postcode, latitude, longitude } = body.result;
  if (latitude == null || longitude == null) {
    throw new Error(`No coordinates available for postcode: ${raw}`);
  }

  return { postcode, latitude, longitude };
}
