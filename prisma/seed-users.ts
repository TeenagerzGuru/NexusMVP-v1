import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = "Nexus2026!";

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  const brands = await prisma.brand.findMany();
  const deliverred = brands.find((b) => b.slug === "deliverred");
  const titan = brands.find((b) => b.slug === "titan-cargo");

  const users = [
    { email: "admin@nexus.local", role: "ADMIN" as const, brandId: null, firstName: "Nexus", lastName: "Admin" },
    { email: "ops@deliverred.co.uk", role: "OPERATIONS" as const, brandId: deliverred?.id, firstName: "Ops", lastName: "Deliverred" },
    { email: "ops@titancargo.co.uk", role: "OPERATIONS" as const, brandId: titan?.id, firstName: "Ops", lastName: "Titan" },
    { email: "driver@deliverred.co.uk", role: "DRIVER" as const, brandId: deliverred?.id, firstName: "Dave", lastName: "Driver" },
    { email: "customer@example.com", role: "CUSTOMER" as const, brandId: deliverred?.id, firstName: "Test", lastName: "Customer" },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      create: { ...user, passwordHash },
      update: { passwordHash, role: user.role, brandId: user.brandId, isActive: true },
    });
    console.log(`  ✓ ${user.email} (${user.role})`);
  }

  if (deliverred) {
    const customerUser = await prisma.user.findUnique({ where: { email: "customer@example.com" } });
    await prisma.customer.upsert({
      where: { userId: customerUser!.id },
      create: {
        brandId: deliverred.id,
        userId: customerUser!.id,
        companyName: "Example Logistics Ltd",
        contactEmail: "customer@example.com",
        billingAddressLine1: "1 Test Street",
        billingPostcode: "M1 1AA",
        paymentTerms: "Net 0",
      },
      update: { companyName: "Example Logistics Ltd" },
    });

    await prisma.vehicle.upsert({
      where: { brandId_registration: { brandId: deliverred.id, registration: "DL24 RED" } },
      create: {
        brandId: deliverred.id,
        registration: "DL24 RED",
        vehicleType: "T18",
        hasTailLift: true,
        hasHiab: false,
        hasAdr: true,
      },
      update: {},
    });
  }

  if (titan) {
    await prisma.carrier.upsert({
      where: { id: "seed-carrier-titan-1" },
      create: {
        id: "seed-carrier-titan-1",
        brandId: titan.id,
        name: "Midlands Haulage Ltd",
        rateType: "PER_MILE",
        rateValue: 1.85,
      },
      update: { name: "Midlands Haulage Ltd" },
    });
  }

  console.log(`Default password for all seed users: ${DEFAULT_PASSWORD}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
