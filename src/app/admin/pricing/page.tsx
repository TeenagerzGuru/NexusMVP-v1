import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

import { PricingEditor } from "./pricing-editor";

export default async function AdminPricingPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const brands = await prisma.brand.findMany({
    include: {
      pricingLanes: { where: { isActive: true }, orderBy: { originCode: "asc" } },
      pricingSurcharges: true,
      pricingConfig: true,
    },
  });

  return (
    <div>
      <PageHeader title="Pricing rules" subtitle="Lane prices and surcharges per brand" />
      <PricingEditor
        brands={brands.map((brand) => ({
          slug: brand.slug,
          name: brand.name,
          lanes: brand.pricingLanes.map((lane) => ({
            id: lane.id,
            matchLevel: lane.matchLevel,
            originCode: lane.originCode,
            destinationCode: lane.destinationCode,
            vehicleType: lane.vehicleType,
            basePrice: Number(lane.basePrice),
            label: lane.label,
          })),
          surcharges: brand.pricingSurcharges.map((item) => ({
            addonType: item.addonType,
            valueType: item.valueType,
            value: Number(item.value),
          })),
          config: brand.pricingConfig
            ? {
                marginMultiplier: Number(brand.pricingConfig.marginMultiplier),
                minimumJobValue: Number(brand.pricingConfig.minimumJobValue),
              }
            : null,
        }))}
      />
    </div>
  );
}
