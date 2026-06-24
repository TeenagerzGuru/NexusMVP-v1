import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  BRAND_HEADER,
  type BrandSlug,
  type ResolvedBrand,
  parseBrandColours,
} from "@/lib/brand/types";

/** Reads brand slug set by middleware; env override is the escape hatch for local dev. */
export async function getBrandSlugFromRequest(): Promise<BrandSlug> {
  const headerStore = await headers();
  const fromHeader = headerStore.get(BRAND_HEADER);

  if (fromHeader === "deliverred" || fromHeader === "titan-cargo") {
    return fromHeader;
  }

  const override = process.env.BRAND_OVERRIDE;
  if (override === "deliverred" || override === "titan-cargo") {
    return override;
  }

  return "deliverred";
}

/** Full brand record + parsed theme colours for layout and transactional content. */
export async function getBrand(): Promise<ResolvedBrand> {
  const slug = await getBrandSlugFromRequest();

  const brand = await prisma.brand.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      domain: true,
      logoUrl: true,
      colours: true,
      contactEmail: true,
      contactPhone: true,
      vatNumber: true,
    },
  });

  if (!brand) {
    throw new Error(`Brand not found for slug: ${slug}`);
  }

  return {
    slug: brand.slug as BrandSlug,
    name: brand.name,
    domain: brand.domain,
    logoUrl: brand.logoUrl,
    colours: parseBrandColours(brand.colours),
    contactEmail: brand.contactEmail,
    contactPhone: brand.contactPhone,
    vatNumber: brand.vatNumber,
  };
}
