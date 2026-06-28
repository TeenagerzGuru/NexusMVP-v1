import { redirect } from "next/navigation";

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { parseBrandColours, type BrandSlug } from "@/lib/brand/types";
import { getSession, roleCanAccessOps } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { loadAdminReportMetrics, loadOpsReportMetrics } from "@/lib/reports/metrics";

import { ReportsDashboard } from "./reports-dashboard";

const BRAND_SLUGS: BrandSlug[] = ["deliverred", "titan-cargo"];

function parseBrandFilter(raw?: string): "all" | BrandSlug {
  if (raw === "deliverred" || raw === "titan-cargo") return raw;
  return "all";
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const session = await getSession();
  if (!session || !roleCanAccessOps(session.role)) redirect("/login");

  const isAdmin = session.role === "ADMIN";
  const params = await searchParams;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const brands = await prisma.brand.findMany({
    where: { slug: { in: [...BRAND_SLUGS] } },
    select: { id: true, slug: true, name: true, colours: true },
    orderBy: { name: "asc" },
  });

  if (isAdmin) {
    const initialBrand = parseBrandFilter(params.brand);
    const metrics = await loadAdminReportMetrics(weekStart, monthStart);

    const brandOptions = brands.map((b) => ({
      slug: b.slug as BrandSlug,
      name: b.name,
      colours: parseBrandColours(b.colours),
    }));

    return (
      <PageContainer className="ops-page">
        <div>
          <PageHeader title="Reports" subtitle="Performance overview — all brands" />
          <ReportsDashboard
            isAdmin
            initialBrand={initialBrand}
            brands={brandOptions}
            metrics={metrics}
          />
        </div>
      </PageContainer>
    );
  }

  const scopedBrand = brands.find((b) => b.id === session.brandId);
  if (!scopedBrand) redirect("/dashboard");

  const opsSlug = scopedBrand.slug as BrandSlug;
  const opsMetrics = await loadOpsReportMetrics(opsSlug, weekStart, monthStart);

  return (
    <PageContainer className="ops-page">
      <div>
        <PageHeader title="Reports" subtitle={`Performance — ${scopedBrand.name}`} />
        <ReportsDashboard
          isAdmin={false}
          initialBrand={opsSlug}
          brands={[
            {
              slug: opsSlug,
              name: scopedBrand.name,
              colours: parseBrandColours(scopedBrand.colours),
            },
          ]}
          metrics={{ [opsSlug]: opsMetrics }}
        />
      </div>
    </PageContainer>
  );
}
