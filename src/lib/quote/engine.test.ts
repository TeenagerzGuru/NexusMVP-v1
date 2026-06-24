import { describe, expect, it } from "vitest";

import { calculateQuote } from "@/lib/quote/engine";
import type { BrandPricingRules } from "@/lib/quote/types";

const titanRules: BrandPricingRules = {
  brandSlug: "titan-cargo",
  lanes: [
    {
      matchLevel: "AREA",
      originCode: "M",
      destinationCode: "B",
      vehicleType: "T18",
      basePrice: 240,
    },
  ],
  vehicleMultipliers: { T18: 1 },
  surcharges: [{ addonType: "TAIL_LIFT", valueType: "FLAT", value: 25 }],
  marginMultiplier: 1.18,
  minimumJobValue: 150,
  roundToNearest: 5,
  vatRate: 0.2,
  urgentWithin24hMultiplier: 1.25,
  outOfHoursMultiplier: 1.2,
  weekendMultiplier: 1.35,
  perMileRates: { T18: 2.5 },
};

describe("calculateQuote — Titan Cargo worked example (Section 5)", () => {
  it("matches M16 → B5, 18T, tail-lift, tomorrow 14:00", () => {
    const result = calculateQuote(
      {
        originPostcode: "M16 9PW",
        destinationPostcode: "B5 4AA",
        vehicleType: "18T",
        collectionDate: "2026-06-15",
        collectionTime: "14:00",
        addons: ["tail-lift"],
        brandSlug: "titan-cargo",
      },
      titanRules,
      { now: new Date("2026-06-14T16:00:00") },
    );

    expect(result.priceExVat).toBe(395);
    expect(result.vatAmount).toBe(79);
    expect(result.priceIncVat).toBe(474);
  });
});

describe("calculateQuote — edge cases", () => {
  it("applies minimum floor when subtotal is low", () => {
    const rules: BrandPricingRules = {
      ...titanRules,
      lanes: [],
      perMileRates: { T7_5: 0.5 },
      marginMultiplier: 1,
    };

    const result = calculateQuote(
      {
        originPostcode: "SW1A 1AA",
        destinationPostcode: "SW1A 2AA",
        vehicleType: "7.5T",
        collectionDate: "2026-06-20",
        collectionTime: "10:00",
        addons: [],
        brandSlug: "titan-cargo",
      },
      rules,
      { now: new Date("2026-06-10T10:00:00"), mileage: 1 },
    );

    expect(result.priceExVat).toBe(150);
  });
});
