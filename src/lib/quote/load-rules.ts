import type { BrandPricingConfig, PricingLane, PricingSurcharge, PricingVehicleMultiplier } from "@prisma/client";

import type { BrandPricingRules } from "@/lib/quote/types";

type PricingBundle = {
  slug: string;
  lanes: PricingLane[];
  vehicleMultipliers: PricingVehicleMultiplier[];
  surcharges: PricingSurcharge[];
  config: BrandPricingConfig;
};

export function toBrandPricingRules(bundle: PricingBundle): BrandPricingRules {
  const perMileRates =
    typeof bundle.config.perMileRates === "object" && bundle.config.perMileRates !== null
      ? (bundle.config.perMileRates as Record<string, number>)
      : {};

  return {
    brandSlug: bundle.slug,
    lanes: bundle.lanes.map((lane) => ({
      matchLevel: lane.matchLevel,
      originCode: lane.originCode,
      destinationCode: lane.destinationCode,
      vehicleType: lane.vehicleType,
      basePrice: Number(lane.basePrice),
    })),
    vehicleMultipliers: Object.fromEntries(
      bundle.vehicleMultipliers.map((item) => [item.vehicleType, Number(item.multiplier)]),
    ),
    surcharges: bundle.surcharges.map((item) => ({
      addonType: item.addonType,
      valueType: item.valueType,
      value: Number(item.value),
    })),
    marginMultiplier: Number(bundle.config.marginMultiplier),
    minimumJobValue: Number(bundle.config.minimumJobValue),
    roundToNearest: Number(bundle.config.roundToNearest),
    vatRate: Number(bundle.config.vatRate),
    urgentWithin24hMultiplier: Number(bundle.config.urgentWithin24hMultiplier),
    outOfHoursMultiplier: Number(bundle.config.outOfHoursMultiplier),
    weekendMultiplier: Number(bundle.config.weekendMultiplier),
    perMileRates,
  };
}
