import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BRANDS = [
  {
    slug: "deliverred",
    name: "Deliverred Transport",
    domain: "book.deliverred.co.uk",
    logoUrl: "/brands/deliverred/logo.svg",
    colours: {
      primary: "#1B4332",
      secondary: "#2D6A4F",
      accent: "#95D5B2",
      background: "#F8F9FA",
    },
    contactEmail: "bookings@deliverred.co.uk",
    contactPhone: "+44 161 123 4567",
    contactAddress: "Unit 4, Trafford Park, Manchester, M17 1WA",
    vatNumber: "GB123456789",
    termsAndConditions: `Deliverred Transport Ltd — Standard Terms & Conditions

1. Bookings are subject to vehicle availability and driver hours regulations.
2. Prices quoted are valid for the stated expiry period and based on the information provided.
3. We invoice on net-zero terms after delivery unless an account has been agreed in writing.
4. ADR and HIAB jobs require accurate goods declarations; surcharges apply for undeclared requirements.
5. Waiting time beyond 30 minutes at collection or delivery may incur additional charges.
6. POD (proof of delivery) constitutes acceptance of goods in apparent good order.
7. Claims for loss or damage must be notified within 24 hours of delivery.
8. Deliverred Transport Ltd is FORS-accredited. Full T&Cs available on request.`,
    invoiceNumberPrefix: "DEL",
    invoiceSequenceYear: 2026,
    invoiceSequenceNext: 1,
    pricingConfig: {
      marginMultiplier: 1.12,
      minimumJobValue: 150,
      roundToNearest: 5,
      vatRate: 0.2,
      urgentWithin24hMultiplier: 1.25,
      outOfHoursMultiplier: 1.2,
      weekendMultiplier: 1.35,
      perMileRates: {
        T7_5: 1.85,
        T18: 2.35,
        T26: 2.75,
        ARTIC: 3.1,
      },
      quoteExpiryMinutes: 60,
    },
  },
  {
    slug: "titan-cargo",
    name: "Titan Cargo",
    domain: "book.titancargo.co.uk",
    logoUrl: "/brands/titan-cargo/logo.svg",
    colours: {
      primary: "#0B132B",
      secondary: "#1C2541",
      accent: "#5BC0BE",
      background: "#FFFFFF",
    },
    contactEmail: "hello@titancargo.co.uk",
    contactPhone: "+44 121 987 6543",
    contactAddress: "Floor 2, Colmore Gate, Birmingham, B3 2QD",
    vatNumber: "GB987654321",
    termsAndConditions: `Titan Cargo Ltd — Standard Terms & Conditions

1. Titan Cargo acts as a freight forwarder; carriage may be performed by approved subcontracted carriers.
2. Quotes are based on lane pricing and carrier availability at time of booking.
3. We invoice on net-zero terms after delivery unless credit terms have been agreed.
4. Transit times are estimates only and not guaranteed unless expressly agreed in writing.
5. Insurance cover is standard CMR limits unless enhanced cover is purchased.
6. Customs documentation, where required, is the customer's responsibility unless agreed otherwise.
7. POD constitutes delivery confirmation. Disputes must be raised within 24 hours.
8. Titan Cargo margin and carrier costs are confidential commercial terms.`,
    invoiceNumberPrefix: "TC",
    invoiceSequenceYear: 2026,
    invoiceSequenceNext: 1,
    pricingConfig: {
      marginMultiplier: 1.18,
      minimumJobValue: 150,
      roundToNearest: 5,
      vatRate: 0.2,
      urgentWithin24hMultiplier: 1.25,
      outOfHoursMultiplier: 1.2,
      weekendMultiplier: 1.35,
      perMileRates: {
        T7_5: 1.95,
        T18: 2.5,
        T26: 2.9,
        ARTIC: 3.25,
      },
      quoteExpiryMinutes: 60,
    },
  },
] as const;

async function main() {
  console.log("Seeding NEXUS brands…");

  for (const brand of BRANDS) {
    const { pricingConfig, ...brandData } = brand;

    const record = await prisma.brand.upsert({
      where: { slug: brand.slug },
      create: {
        ...brandData,
        pricingConfig: {
          create: pricingConfig,
        },
      },
      update: {
        name: brandData.name,
        domain: brandData.domain,
        logoUrl: brandData.logoUrl,
        colours: brandData.colours,
        contactEmail: brandData.contactEmail,
        contactPhone: brandData.contactPhone,
        contactAddress: brandData.contactAddress,
        vatNumber: brandData.vatNumber,
        termsAndConditions: brandData.termsAndConditions,
        invoiceNumberPrefix: brandData.invoiceNumberPrefix,
        invoiceSequenceYear: brandData.invoiceSequenceYear,
        pricingConfig: {
          upsert: {
            create: pricingConfig,
            update: pricingConfig,
          },
        },
      },
    });

    console.log(`  ✓ ${record.name} (${record.slug}) — ${record.domain}`);
  }

  console.log("Done. Two brands seeded.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
