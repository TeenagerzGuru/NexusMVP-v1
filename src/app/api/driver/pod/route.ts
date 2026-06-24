import { NextResponse } from "next/server";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit/log";
import { getSession, roleCanAccessDriver } from "@/lib/auth/session";
import { podDeliveryEmail, sendEmail } from "@/lib/email/send";
import { prisma } from "@/lib/prisma";

const podSchema = z.object({
  bookingId: z.string(),
  photoUrl: z.string().min(10),
  signatureData: z.string().min(10),
  recipientName: z.string().min(2),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !roleCanAccessDriver(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = podSchema.parse(await request.json());
    const booking = await prisma.booking.findUnique({
      where: { id: body.bookingId },
      include: { brand: true, job: true, pod: true },
    });

    if (!booking?.job) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (booking.pod) return NextResponse.json({ error: "POD already captured" }, { status: 400 });

    const pod = await prisma.$transaction(async (tx) => {
      const created = await tx.pod.create({
        data: {
          bookingId: booking.id,
          photoUrl: body.photoUrl,
          signatureData: body.signatureData,
          recipientName: body.recipientName,
          notes: body.notes,
          capturedById: session.id,
        },
      });

      await tx.booking.update({ where: { id: booking.id }, data: { status: "DELIVERED" } });
      await tx.job.update({
        where: { id: booking.job!.id },
        data: { status: "DELIVERED", deliveredAt: new Date() },
      });

      return created;
    });

    const email = podDeliveryEmail({
      brandName: booking.brand.name,
      bookingReference: booking.reference,
      recipientName: body.recipientName,
    });
    await sendEmail({ to: booking.contactEmail, ...email });

    await writeAuditLog({
      actorId: session.id,
      entityType: "POD",
      entityId: pod.id,
      action: "CREATE",
      after: pod,
    });

    return NextResponse.json({ ok: true, podId: pod.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "POD failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

const jobStatusSchema = z.object({
  jobId: z.string(),
  status: z.enum([
    "EN_ROUTE_COLLECTION",
    "ARRIVED_COLLECTION",
    "LOADED",
    "EN_ROUTE_DELIVERY",
    "ARRIVED_DELIVERY",
    "DELIVERED",
  ]),
});

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || !roleCanAccessDriver(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = jobStatusSchema.parse(await request.json());
  const timestampField: Record<string, string> = {
    EN_ROUTE_COLLECTION: "enRouteCollectionAt",
    ARRIVED_COLLECTION: "arrivedCollectionAt",
    LOADED: "loadedAt",
    EN_ROUTE_DELIVERY: "enRouteDeliveryAt",
    ARRIVED_DELIVERY: "arrivedDeliveryAt",
    DELIVERED: "deliveredAt",
  };

  const job = await prisma.job.update({
    where: { id: body.jobId },
    data: {
      status: body.status,
      [timestampField[body.status]]: new Date(),
    },
  });

  if (body.status === "DELIVERED") {
    await prisma.booking.update({
      where: { id: job.bookingId },
      data: { status: "DELIVERED" },
    });
  } else if (body.status === "EN_ROUTE_COLLECTION") {
    await prisma.booking.update({
      where: { id: job.bookingId },
      data: { status: "IN_TRANSIT" },
    });
  }

  return NextResponse.json({ ok: true });
}
