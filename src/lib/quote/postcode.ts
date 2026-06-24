export type ParsedPostcode = {
  full: string;
  outward: string;
  area: string;
  district: string;
};

/** Normalises and validates UK postcode; throws on bad input. Area = letter prefix, district = outward code. */
export function parseUkPostcode(raw: string): ParsedPostcode {
  const normalized = raw.trim().toUpperCase().replace(/\s+/g, " ");
  const match = normalized.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)\s*(\d[A-Z]{2})$/);

  if (!match) {
    throw new Error(`Invalid UK postcode: ${raw}`);
  }

  const outward = match[1];
  const area = outward.match(/^[A-Z]{1,2}/)?.[0] ?? outward;

  return {
    full: `${outward} ${match[2]}`,
    outward,
    area,
    district: outward,
  };
}
