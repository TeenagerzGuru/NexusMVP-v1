import Link from "next/link";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { getSession, opsBrandFilter, roleCanAccessOps } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { bookingStatusLabel, formatMoney } from "@/lib/utils";

import { KanbanBoard } from "./kanban-board";

const COLUMNS = ["QUOTED", "BOOKED", "IN_TRANSIT", "DELIVERED", "INVOICED"] as const;

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || !roleCanAccessOps(session.role)) redirect("/login");

  const isAdmin = session.role === "ADMIN";
  if (!isAdmin && !session.brandId) redirect("/login");

  const brandScope = opsBrandFilter(session);

  const [bookings, scopedBrand] = await Promise.all([
    prisma.booking.findMany({
      where: { status: { not: "CANCELLED" }, ...brandScope },
      select: {
        id: true,
        reference: true,
        status: true,
        contactName: true,
        contactCompany: true,
        valueIncVat: true,
        createdAt: true,
        brand: { select: { name: true, slug: true } },
        quote: { select: { inputs: true } },
        customer: { select: { companyName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    !isAdmin && session.brandId
      ? prisma.brand.findUnique({ where: { id: session.brandId }, select: { name: true } })
      : Promise.resolve(null),
  ]);

  const grouped = Object.fromEntries(COLUMNS.map((status) => [status, [] as typeof bookings]));
  for (const booking of bookings) {
    const key = COLUMNS.includes(booking.status as (typeof COLUMNS)[number])
      ? booking.status
      : "BOOKED";
    grouped[key as (typeof COLUMNS)[number]].push(booking);
  }

  const subtitle = isAdmin
    ? `Welcome back, ${session.name} — all brands`
    : `Welcome back, ${session.name} — ${scopedBrand?.name ?? "your brand"}`;

  return (
    <PageContainer className="ops-page">
      <div>
        <PageHeader
          title="Operations"
          subtitle={subtitle}
          action={
            <Link href="/admin/reports" className="nexus-btn nexus-btn-ghost text-sm">
              Reports →
            </Link>
          }
        />
        <KanbanBoard
          showBrand={isAdmin}
          columns={COLUMNS.map((status) => ({
            status,
            label: bookingStatusLabel(status),
            bookings: grouped[status].map((booking) => {
              const inputs = booking.quote.inputs as { originPostcode?: string; destinationPostcode?: string };
              return {
                id: booking.id,
                reference: booking.reference,
                brand: booking.brand.name,
                route: `${inputs.originPostcode ?? "?"} → ${inputs.destinationPostcode ?? "?"}`,
                customer: booking.customer?.companyName ?? booking.contactCompany ?? booking.contactName,
                value: formatMoney(Number(booking.valueIncVat)),
              };
            }),
          }))}
        />
      </div>
    </PageContainer>
  );
}
