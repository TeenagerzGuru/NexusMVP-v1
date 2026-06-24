import type { AddonType, VehicleType } from "@prisma/client";

export type QuoteAddon = "tail-lift" | "hiab" | "adr" | "two-person";

export const VEHICLE_TYPES = ["7.5T", "18T", "26T", "Artic"] as const;
export type QuoteVehicleType = (typeof VEHICLE_TYPES)[number];

export type QuoteInput = {
  originPostcode: string;
  destinationPostcode: string;
  vehicleType: QuoteVehicleType;
  collectionDate: string;
  collectionTime: string;
  addons: QuoteAddon[];
  goodsDescription?: string;
  brandSlug: "deliverred" | "titan-cargo";
};

export type PricingLaneRule = {
  matchLevel: "DISTRICT" | "AREA";
  originCode: string;
  destinationCode: string;
  vehicleType: VehicleType;
  basePrice: number;
};

export type PricingSurchargeRule = {
  addonType: AddonType;
  valueType: "FLAT" | "PERCENTAGE";
  value: number;
};

export type BrandPricingRules = {
  brandSlug: string;
  lanes: PricingLaneRule[];
  vehicleMultipliers: Partial<Record<VehicleType, number>>;
  surcharges: PricingSurchargeRule[];
  marginMultiplier: number;
  minimumJobValue: number;
  roundToNearest: number;
  vatRate: number;
  urgentWithin24hMultiplier: number;
  outOfHoursMultiplier: number;
  weekendMultiplier: number;
  perMileRates: Partial<Record<VehicleType, number>>;
};

export type CalculationStep = {
  step: string;
  description: string;
  value: number;
  multiplier?: number;
  runningTotal: number;
};

export type QuoteCalculationResult = {
  priceExVat: number;
  priceIncVat: number;
  vatAmount: number;
  breakdown: CalculationStep[];
};

export const ADDON_TO_ENUM: Record<QuoteAddon, AddonType> = {
  "tail-lift": "TAIL_LIFT",
  hiab: "HIAB",
  adr: "ADR",
  "two-person": "TWO_PERSON",
};

export const VEHICLE_TO_ENUM: Record<QuoteVehicleType, VehicleType> = {
  "7.5T": "T7_5",
  "18T": "T18",
  "26T": "T26",
  Artic: "ARTIC",
};

export const ENUM_TO_VEHICLE: Record<VehicleType, QuoteVehicleType> = {
  T7_5: "7.5T",
  T18: "18T",
  T26: "26T",
  ARTIC: "Artic",
};
