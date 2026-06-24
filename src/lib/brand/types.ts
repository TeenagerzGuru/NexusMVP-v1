export type BrandSlug = "deliverred" | "titan-cargo";

export type BrandTheme = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
};

export type ResolvedBrand = {
  slug: BrandSlug;
  name: string;
  domain: string;
  logoUrl: string | null;
  colours: BrandTheme;
  contactEmail: string;
  contactPhone: string | null;
  vatNumber: string;
};

export const BRAND_HOST_MAP: Record<string, BrandSlug> = {
  "book.deliverred.co.uk": "deliverred",
  "book.titancargo.co.uk": "titan-cargo",
  localhost: "deliverred",
  "127.0.0.1": "deliverred",
  "[::1]": "deliverred",
};

export const BRAND_HEADER = "x-nexus-brand-slug";

export function hostnameToBrandSlug(hostname: string): BrandSlug | null {
  const host = hostname.split(":")[0]?.toLowerCase() ?? "";
  return BRAND_HOST_MAP[host] ?? null;
}

export function parseBrandColours(raw: unknown): BrandTheme {
  const fallback: BrandTheme = {
    primary: "#1B4332",
    secondary: "#2D6A4F",
    accent: "#95D5B2",
    background: "#F8F9FA",
  };

  if (!raw || typeof raw !== "object") return fallback;

  const colours = raw as Record<string, unknown>;
  return {
    primary: typeof colours.primary === "string" ? colours.primary : fallback.primary,
    secondary: typeof colours.secondary === "string" ? colours.secondary : fallback.secondary,
    accent: typeof colours.accent === "string" ? colours.accent : fallback.accent,
    background: typeof colours.background === "string" ? colours.background : fallback.background,
  };
}
