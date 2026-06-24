import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const brands = await prisma.brand.findMany({
    select: { slug: true, name: true, domain: true, vatNumber: true },
  });
  const tableCount = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `;

  console.log("✅ Database connection OK");
  console.log(`📦 Tables in public schema: ${tableCount[0]?.count ?? 0}`);
  console.log("🏷️  Brands seeded:");
  for (const brand of brands) {
    console.log(`   - ${brand.name} (${brand.slug}) → ${brand.domain}`);
  }
}

main()
  .catch((error) => {
    console.error("❌ Database connection FAILED:", error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
