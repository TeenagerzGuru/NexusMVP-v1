import { prisma } from "@/lib/prisma";
import { getRoadDistance } from "@/lib/quote/distance";
import { calculateQuote } from "@/lib/quote/engine";
import { toBrandPricingRules } from "@/lib/quote/load-rules";
import type { QuoteInput } from "@/lib/quote/types";

/** Hydrates active lanes, multipliers, surcharges and config for a brand slug. */
export async function loadBrandPricingRules(brandSlug: string) {
  const brand = await prisma.brand.findUnique({
    where: { slug: brandSlug },
    include: {
      pricingLanes: { where: { isActive: true } },
      pricingVehicleMults: { where: { isActive: true } },
      pricingSurcharges: { where: { isActive: true } },
      pricingConfig: true,
    },
  });

  if (!brand?.pricingConfig) {
    throw new Error(`Pricing not configured for brand: ${brandSlug}`);
  }

  return {
    brandId: brand.id,
    rules: toBrandPricingRules({
      slug: brand.slug,
      lanes: brand.pricingLanes,
      vehicleMultipliers: brand.pricingVehicleMults,
      surcharges: brand.pricingSurcharges,
      config: brand.pricingConfig,
    }),
    quoteExpiryMinutes: brand.pricingConfig.quoteExpiryMinutes,
  };
}

/** Runs engine, persists ACTIVE quote with expiry — caller handles HTTP response shape. */
export async function createQuoteRecord(input: QuoteInput) {
  const { brandId, rules, quoteExpiryMinutes } = await loadBrandPricingRules(input.brandSlug);
  const distance = await getRoadDistance(input.originPostcode, input.destinationPostcode);
  const result = calculateQuote(input, rules, { mileage: distance.miles });
  const reference = `QTE-${Date.now().toString(36).toUpperCase()}`;
  const expiresAt = new Date(Date.now() + quoteExpiryMinutes * 60 * 1000);

  const quote = await prisma.quote.create({
    data: {
      brandId,
      reference,
      status: "ACTIVE",
      inputs: input,
      calculationBreakdown: result.breakdown,
      priceExVat: result.priceExVat,
      priceIncVat: result.priceIncVat,
      vatAmount: result.vatAmount,
      expiresAt,
    },
  });

  return { quote, result, distance };
}
