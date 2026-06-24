import { PrismaClient, VehicleType, AddonType, LaneMatchLevel, SurchargeValueType } from "@prisma/client";

const prisma = new PrismaClient();

async function seedPricing() {
  const brands = await prisma.brand.findMany({ select: { id: true, slug: true } });

  for (const brand of brands) {
    const vehicleTypes: VehicleType[] = ["T7_5", "T18", "T26", "ARTIC"];

    for (const vehicleType of vehicleTypes) {
      await prisma.pricingVehicleMultiplier.upsert({
        where: { brandId_vehicleType: { brandId: brand.id, vehicleType } },
        create: { brandId: brand.id, vehicleType, multiplier: 1 },
        update: { multiplier: 1 },
      });
    }

    const surcharges: Array<{ addonType: AddonType; valueType: SurchargeValueType; value: number }> = [
      { addonType: "TAIL_LIFT", valueType: "FLAT", value: 25 },
      { addonType: "HIAB", valueType: "FLAT", value: 85 },
      { addonType: "ADR", valueType: "FLAT", value: 120 },
      { addonType: "TWO_PERSON", valueType: "FLAT", value: 45 },
    ];

    for (const surcharge of surcharges) {
      await prisma.pricingSurcharge.upsert({
        where: { brandId_addonType: { brandId: brand.id, addonType: surcharge.addonType } },
        create: { brandId: brand.id, ...surcharge },
        update: { valueType: surcharge.valueType, value: surcharge.value },
      });
    }

    const lanes: Array<{
      matchLevel: LaneMatchLevel;
      originCode: string;
      destinationCode: string;
      vehicleType: VehicleType;
      basePrice: number;
      label: string;
    }> = [
      { matchLevel: "AREA", originCode: "M", destinationCode: "B", vehicleType: "T18", basePrice: 240, label: "NW → Midlands 18T" },
      { matchLevel: "AREA", originCode: "M", destinationCode: "B", vehicleType: "T7_5", basePrice: 180, label: "NW → Midlands 7.5T" },
      { matchLevel: "AREA", originCode: "M", destinationCode: "B", vehicleType: "T26", basePrice: 290, label: "NW → Midlands 26T" },
      { matchLevel: "AREA", originCode: "M", destinationCode: "B", vehicleType: "ARTIC", basePrice: 340, label: "NW → Midlands Artic" },
      { matchLevel: "DISTRICT", originCode: "M16", destinationCode: "B5", vehicleType: "T18", basePrice: 255, label: "M16 → B5 direct" },
      { matchLevel: "AREA", originCode: "L", destinationCode: "M", vehicleType: "T18", basePrice: 195, label: "Merseyside → NW" },
    ];

    for (const lane of lanes) {
      await prisma.pricingLane.upsert({
        where: {
          brandId_matchLevel_originCode_destinationCode_vehicleType: {
            brandId: brand.id,
            matchLevel: lane.matchLevel,
            originCode: lane.originCode,
            destinationCode: lane.destinationCode,
            vehicleType: lane.vehicleType,
          },
        },
        create: { brandId: brand.id, ...lane },
        update: { basePrice: lane.basePrice, label: lane.label },
      });
    }
  }

  console.log("Pricing rules seeded for all brands.");
}

seedPricing()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
