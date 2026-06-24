import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { getSession, roleCanAccessOps } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session || !roleCanAccessOps(session.role)) redirect("/login");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const [weekCount, monthCount, allBookings, quotes] = await Promise.all([
    prisma.booking.count({ where: { createdAt: { gte: weekStart }, status: { not: "CANCELLED" } } }),
    prisma.booking.count({ where: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" } } }),
    prisma.booking.findMany({
      where: { status: { not: "CANCELLED" } },
      include: { brand: true, job: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.quote.findMany({ where: { createdAt: { gte: weekStart } } }),
  ]);

  const monthValue = allBookings
    .filter((b) => b.createdAt >= monthStart)
    .reduce((sum, b) => sum + Number(b.valueIncVat), 0);

  const converted = quotes.filter((q) => q.status === "CONVERTED").length;
  const conversionRate = quotes.length ? Math.round((converted / quotes.length) * 100) : 0;

  const marginJobs = allBookings.filter((b) => b.job?.carrierCost != null);
  const avgMargin =
    marginJobs.length > 0
      ? marginJobs.reduce((sum, b) => sum + (Number(b.valueExVat) - Number(b.job!.carrierCost)), 0) /
        marginJobs.length
      : 0;

  const customerCounts = new Map<string, number>();
  for (const booking of allBookings) {
    const key = booking.contactCompany ?? booking.contactName;
    customerCounts.set(key, (customerCounts.get(key) ?? 0) + 1);
  }
  const topCustomers = [...customerCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const cards = [
    { title: "Jobs this week", value: String(weekCount) },
    { title: "Jobs this month", value: String(monthCount) },
    { title: "Month value", value: formatMoney(monthValue) },
    { title: "Quote → booking (7d)", value: `${conversionRate}%` },
    { title: "Avg margin / job", value: formatMoney(avgMargin) },
  ];

  return (
    <div>
      <PageHeader title="Reports" subtitle="Business performance overview" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <div
            key={card.title}
            className="animate-fade-in-up nexus-card"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <p className="text-sm text-gray-500">{card.title}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
      <section className="animate-fade-in-up nexus-card mt-6">
        <h2 className="font-semibold">Top customers (90d sample)</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {topCustomers.map(([name, count]) => (
            <li key={name}>
              {name} — {count} bookings
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
