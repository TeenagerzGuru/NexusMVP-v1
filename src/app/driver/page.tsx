import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { getSession, roleCanAccessDriver } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

import { DriverJobList } from "./driver-jobs";

export default async function DriverPage() {
  const session = await getSession();
  if (!session || !roleCanAccessDriver(session.role)) redirect("/login");

  const jobs = await prisma.job.findMany({
    where: session.role === "DRIVER" ? { driverId: session.id } : {},
    include: {
      booking: {
        include: {
          brand: true,
          quote: true,
          pod: true,
        },
      },
      vehicle: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div>
      <PageHeader title="Driver" subtitle="Today's assigned jobs" />
      <DriverJobList
        jobs={jobs.map((job) => {
          const inputs = job.booking.quote.inputs as {
            originPostcode?: string;
            destinationPostcode?: string;
          };
          return {
            id: job.id,
            bookingId: job.booking.id,
            reference: job.booking.reference,
            status: job.status,
            route: `${inputs.originPostcode ?? "?"} → ${inputs.destinationPostcode ?? "?"}`,
            instructions: job.booking.specialInstructions,
            customerRef: job.booking.customerReference,
            hasPod: Boolean(job.booking.pod),
            contactPhone: job.booking.contactPhone,
          };
        })}
      />
    </div>
  );
}
