import type { VehicleType } from "@prisma/client";

import { parseUkPostcode } from "@/lib/quote/postcode";
import {
  ADDON_TO_ENUM,
  type BrandPricingRules,
  type CalculationStep,
  type QuoteCalculationResult,
  type QuoteInput,
  VEHICLE_TO_ENUM,
} from "@/lib/quote/types";

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundUpToNearest(value: number, nearest: number): number {
  if (nearest <= 0) return value;
  return Math.ceil(value / nearest) * nearest;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isOutOfHours(date: Date): boolean {
  if (isWeekend(date)) return false;
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  return totalMinutes < 7 * 60 || totalMinutes >= 18 * 60;
}

function isWithin24Hours(collectionDate: Date, now: Date): boolean {
  const diffMs = collectionDate.getTime() - now.getTime();
  return diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000;
}

function findLanePrice(
  rules: BrandPricingRules,
  originDistrict: string,
  originArea: string,
  destinationDistrict: string,
  destinationArea: string,
  vehicleType: VehicleType,
): { price: number; match: string } | null {
  const districtHit = rules.lanes.find(
    (lane) =>
      lane.matchLevel === "DISTRICT" &&
      lane.originCode === originDistrict &&
      lane.destinationCode === destinationDistrict &&
      lane.vehicleType === vehicleType,
  );
  if (districtHit) {
    return { price: districtHit.basePrice, match: `${originDistrict} → ${destinationDistrict}` };
  }

  const areaHit = rules.lanes.find(
    (lane) =>
      lane.matchLevel === "AREA" &&
      lane.originCode === originArea &&
      lane.destinationCode === destinationArea &&
      lane.vehicleType === vehicleType,
  );
  if (areaHit) {
    return { price: areaHit.basePrice, match: `${originArea} → ${destinationArea}` };
  }

  return null;
}

function estimateMiles(originArea: string, destinationArea: string): number {
  const key = [originArea, destinationArea].sort().join("-");
  const table: Record<string, number> = {
    "B-M": 85,
    "L-M": 35,
    "M-L": 35,
    "B-L": 100,
  };
  return table[key] ?? 120;
}

/** Core pricing pipeline — pure, deterministic, no I/O. Inject `now`/`mileage` in tests. */
export function calculateQuote(
  input: QuoteInput,
  rules: BrandPricingRules,
  options?: { now?: Date; mileage?: number },
): QuoteCalculationResult {
  const now = options?.now ?? new Date();
  const origin = parseUkPostcode(input.originPostcode);
  const destination = parseUkPostcode(input.destinationPostcode);
  const vehicleEnum = VEHICLE_TO_ENUM[input.vehicleType];
  const breakdown: CalculationStep[] = [];

  const collectionAt = new Date(`${input.collectionDate}T${input.collectionTime}:00`);
  if (Number.isNaN(collectionAt.getTime())) {
    throw new Error("Invalid collection date or time");
  }

  const oneHourInMs = 60 * 60 * 1000;
  if (collectionAt.getTime() - now.getTime() < oneHourInMs) {
    throw new Error("Collection time must be at least 1 hour in the future");
  }

  breakdown.push({
    step: "postcode_parse",
    description: `Origin ${origin.district} (${origin.area}), destination ${destination.district} (${destination.area})`,
    value: 0,
    runningTotal: 0,
  });

  let subtotal = 0;
  const lane = findLanePrice(
    rules,
    origin.district,
    origin.area,
    destination.district,
    destination.area,
    vehicleEnum,
  );

  if (lane) {
    subtotal = lane.price;
    breakdown.push({
      step: "lane_lookup",
      description: `Lane match ${lane.match}`,
      value: lane.price,
      runningTotal: roundCurrency(subtotal),
    });
  } else {
    const miles = options?.mileage ?? estimateMiles(origin.area, destination.area);
    const perMile = rules.perMileRates[vehicleEnum] ?? 2.5;
    subtotal = miles * perMile;
    breakdown.push({
      step: "mileage_fallback",
      description: `No lane match — ${miles} miles × £${perMile}/mile`,
      value: roundCurrency(subtotal),
      runningTotal: roundCurrency(subtotal),
    });
  }

  const vehicleMultiplier = rules.vehicleMultipliers[vehicleEnum] ?? 1;
  if (vehicleMultiplier !== 1) {
    subtotal *= vehicleMultiplier;
    breakdown.push({
      step: "vehicle_multiplier",
      description: `Vehicle multiplier (${input.vehicleType})`,
      value: subtotal,
      multiplier: vehicleMultiplier,
      runningTotal: roundCurrency(subtotal),
    });
  } else {
    breakdown.push({
      step: "vehicle_multiplier",
      description: `Vehicle multiplier (${input.vehicleType})`,
      value: 0,
      multiplier: 1,
      runningTotal: roundCurrency(subtotal),
    });
  }

  for (const addon of input.addons) {
    const addonType = ADDON_TO_ENUM[addon];
    const rule = rules.surcharges.find((item) => item.addonType === addonType);
    if (!rule) continue;

    const before = subtotal;
    if (rule.valueType === "FLAT") {
      subtotal += rule.value;
    } else {
      subtotal += before * rule.value;
    }

    breakdown.push({
      step: `addon_${addon}`,
      description: `Add-on ${addon} (${rule.valueType === "FLAT" ? `£${rule.value}` : `${rule.value * 100}%`})`,
      value: roundCurrency(subtotal - before),
      runningTotal: roundCurrency(subtotal),
    });
  }

  let timeMultiplier = 1;
  const timeNotes: string[] = [];

  if (isWithin24Hours(collectionAt, now)) {
    timeMultiplier *= rules.urgentWithin24hMultiplier;
    timeNotes.push(`urgent within 24h ×${rules.urgentWithin24hMultiplier}`);
  }
  if (isWeekend(collectionAt)) {
    timeMultiplier *= rules.weekendMultiplier;
    timeNotes.push(`weekend ×${rules.weekendMultiplier}`);
  } else if (isOutOfHours(collectionAt)) {
    timeMultiplier *= rules.outOfHoursMultiplier;
    timeNotes.push(`out-of-hours ×${rules.outOfHoursMultiplier}`);
  }

  if (timeMultiplier !== 1) {
    subtotal *= timeMultiplier;
    breakdown.push({
      step: "time_multipliers",
      description: timeNotes.join(", "),
      value: roundCurrency(subtotal),
      multiplier: timeMultiplier,
      runningTotal: roundCurrency(subtotal),
    });
  } else {
    breakdown.push({
      step: "time_multipliers",
      description: "In-hours weekday, no urgent surcharge",
      value: 0,
      multiplier: 1,
      runningTotal: roundCurrency(subtotal),
    });
  }

  const beforeMargin = subtotal;
  subtotal *= rules.marginMultiplier;
  breakdown.push({
    step: "brand_margin",
    description: `Brand margin ×${rules.marginMultiplier}`,
    value: roundCurrency(subtotal - beforeMargin),
    multiplier: rules.marginMultiplier,
    runningTotal: roundCurrency(subtotal),
  });

  if (subtotal < rules.minimumJobValue) {
    subtotal = rules.minimumJobValue;
    breakdown.push({
      step: "minimum_floor",
      description: `Minimum job value floor £${rules.minimumJobValue}`,
      value: rules.minimumJobValue,
      runningTotal: roundCurrency(subtotal),
    });
  } else {
    breakdown.push({
      step: "minimum_floor",
      description: "Above minimum floor",
      value: 0,
      runningTotal: roundCurrency(subtotal),
    });
  }

  const rounded = roundUpToNearest(subtotal, rules.roundToNearest);
  breakdown.push({
    step: "round_up",
    description: `Round up to nearest £${rules.roundToNearest}`,
    value: rounded,
    runningTotal: rounded,
  });

  const priceExVat = rounded;
  const vatAmount = roundCurrency(priceExVat * rules.vatRate);
  const priceIncVat = roundCurrency(priceExVat + vatAmount);

  breakdown.push({
    step: "vat",
    description: `VAT @ ${rules.vatRate * 100}%`,
    value: vatAmount,
    runningTotal: priceIncVat,
  });

  return { priceExVat, priceIncVat, vatAmount, breakdown };
}
