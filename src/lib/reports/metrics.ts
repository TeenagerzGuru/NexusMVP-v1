import type { BrandSlug } from "@/lib/brand/types";
import { prisma } from "@/lib/prisma";

export type ReportMetrics = {
  weekCount: number;
  monthCount: number;
  monthValue: number;
  conversionRate: number;
  avgMargin: number;
  topCustomers: Array<[string, number]>;
};

type BrandFilter = "all" | BrandSlug;

type BookingSlice = {
  createdAt: Date;
  valueIncVat: number;
  valueExVat: number;
  contactName: string;
  contactCompany: string | null;
  brandSlug: string;
  carrierCost: number | null;
};

function buildMetrics(
  bookings: BookingSlice[],
  quotes: Array<{ status: string }>,
  weekStart: Date,
  monthStart: Date,
  counts: { week: number; month: number },
): ReportMetrics {
  const monthBookings = bookings.filter((b) => b.createdAt >= monthStart);
  const monthValue = monthBookings.reduce((sum, b) => sum + b.valueIncVat, 0);

  const converted = quotes.filter((q) => q.status === "CONVERTED").length;
  const conversionRate = quotes.length ? Math.round((converted / quotes.length) * 100) : 0;

  const marginJobs = bookings.filter((b) => b.carrierCost != null);
  const avgMargin =
    marginJobs.length > 0
      ? marginJobs.reduce((sum, b) => sum + (b.valueExVat - b.carrierCost!), 0) / marginJobs.length
      : 0;

  const customerCounts = new Map<string, number>();
  for (const booking of bookings) {
    const key = booking.contactCompany ?? booking.contactName;
    customerCounts.set(key, (customerCounts.get(key) ?? 0) + 1);
  }
  const topCustomers = [...customerCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return {
    weekCount: counts.week,
    monthCount: counts.month,
    monthValue,
    conversionRate,
    avgMargin,
    topCustomers,
  };
}

function sliceMetrics(
  allBookings: BookingSlice[],
  allQuotes: Array<{ status: string; brandSlug: string }>,
  filter: BrandFilter,
  weekStart: Date,
  monthStart: Date,
  counts: Record<BrandFilter, { week: number; month: number }>,
): ReportMetrics {
  const bookings =
    filter === "all" ? allBookings : allBookings.filter((b) => b.brandSlug === filter);
  const quotes =
    filter === "all" ? allQuotes : allQuotes.filter((q) => q.brandSlug === filter);

  return buildMetrics(bookings, quotes, weekStart, monthStart, counts[filter]);
}

/** One round-trip batch for admin — avoids triple-loading the same tables. */
export async function loadAdminReportMetrics(weekStart: Date, monthStart: Date) {
  const base = { status: { not: "CANCELLED" as const } };

  const [
    bookings,
    quotes,
    weekAll,
    monthAll,
    weekDeliverred,
    monthDeliverred,
    weekTitan,
    monthTitan,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: base,
      select: {
        createdAt: true,
        valueIncVat: true,
        valueExVat: true,
        contactName: true,
        contactCompany: true,
        brand: { select: { slug: true } },
        job: { select: { carrierCost: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 400,
    }),
    prisma.quote.findMany({
      where: { createdAt: { gte: weekStart } },
      select: { status: true, brand: { select: { slug: true } } },
    }),
    prisma.booking.count({ where: { ...base, createdAt: { gte: weekStart } } }),
    prisma.booking.count({ where: { ...base, createdAt: { gte: monthStart } } }),
    prisma.booking.count({
      where: { ...base, brand: { slug: "deliverred" }, createdAt: { gte: weekStart } },
    }),
    prisma.booking.count({
      where: { ...base, brand: { slug: "deliverred" }, createdAt: { gte: monthStart } },
    }),
    prisma.booking.count({
      where: { ...base, brand: { slug: "titan-cargo" }, createdAt: { gte: weekStart } },
    }),
    prisma.booking.count({
      where: { ...base, brand: { slug: "titan-cargo" }, createdAt: { gte: monthStart } },
    }),
  ]);

  const slices: BookingSlice[] = bookings.map((b) => ({
    createdAt: b.createdAt,
    valueIncVat: Number(b.valueIncVat),
    valueExVat: Number(b.valueExVat),
    contactName: b.contactName,
    contactCompany: b.contactCompany,
    brandSlug: b.brand.slug,
    carrierCost: b.job?.carrierCost != null ? Number(b.job.carrierCost) : null,
  }));

  const quoteRows = quotes.map((q) => ({
    status: q.status,
    brandSlug: q.brand.slug,
  }));

  const counts: Record<BrandFilter, { week: number; month: number }> = {
    all: { week: weekAll, month: monthAll },
    deliverred: { week: weekDeliverred, month: monthDeliverred },
    "titan-cargo": { week: weekTitan, month: monthTitan },
  };

  return {
    all: sliceMetrics(slices, quoteRows, "all", weekStart, monthStart, counts),
    deliverred: sliceMetrics(slices, quoteRows, "deliverred", weekStart, monthStart, counts),
    "titan-cargo": sliceMetrics(slices, quoteRows, "titan-cargo", weekStart, monthStart, counts),
  };
}

/** Scoped metrics for ops staff — single brand only. */
export async function loadOpsReportMetrics(brandSlug: BrandSlug, weekStart: Date, monthStart: Date) {
  const base = { status: { not: "CANCELLED" as const }, brand: { slug: brandSlug } };

  const [bookings, quotes, weekCount, monthCount] = await Promise.all([
    prisma.booking.findMany({
      where: base,
      select: {
        createdAt: true,
        valueIncVat: true,
        valueExVat: true,
        contactName: true,
        contactCompany: true,
        brand: { select: { slug: true } },
        job: { select: { carrierCost: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 400,
    }),
    prisma.quote.findMany({
      where: { createdAt: { gte: weekStart }, brand: { slug: brandSlug } },
      select: { status: true },
    }),
    prisma.booking.count({ where: { ...base, createdAt: { gte: weekStart } } }),
    prisma.booking.count({ where: { ...base, createdAt: { gte: monthStart } } }),
  ]);

  const slices: BookingSlice[] = bookings.map((b) => ({
    createdAt: b.createdAt,
    valueIncVat: Number(b.valueIncVat),
    valueExVat: Number(b.valueExVat),
    contactName: b.contactName,
    contactCompany: b.contactCompany,
    brandSlug: b.brand.slug,
    carrierCost: b.job?.carrierCost != null ? Number(b.job.carrierCost) : null,
  }));

  return buildMetrics(slices, quotes, weekStart, monthStart, { week: weekCount, month: monthCount });
}
