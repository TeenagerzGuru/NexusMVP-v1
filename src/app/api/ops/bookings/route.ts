import { NextResponse } from "next/server";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit/log";
import { assertOpsBookingAccess, getSession, roleCanAccessOps } from "@/lib/auth/session";
import { podDeliveryEmail, sendEmail } from "@/lib/email/send";
import { generateInvoicePdf } from "@/lib/invoice/pdf";
import { prisma } from "@/lib/prisma";
import { nextInvoiceNumber } from "@/lib/utils";

const statusSchema = z.object({
  bookingId: z.string(),
  status: z.enum(["QUOTED", "BOOKED", "IN_TRANSIT", "DELIVERED", "INVOICED", "CANCELLED"]),
  reason: z.string().optional(),
});

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || !roleCanAccessOps(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = statusSchema.parse(await request.json());
    const before = await prisma.booking.findUnique({ where: { id: body.bookingId } });
    if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

    try {
      assertOpsBookingAccess(session, before.brandId);
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const booking = await prisma.booking.update({
      where: { id: body.bookingId },
      data: { status: body.status },
      include: { brand: true, quote: true, job: true },
    });

    if (body.status === "DELIVERED" && booking.job) {
      await prisma.job.update({
        where: { id: booking.job.id },
        data: { status: "DELIVERED", deliveredAt: new Date() },
      });
    }

    if (body.status === "INVOICED") {
      const existing = await prisma.invoice.findUnique({ where: { bookingId: booking.id } });
      if (!existing) {
        const invoiceNumber = await nextInvoiceNumber(booking.brandId);
        const inputs = booking.quote.inputs as { originPostcode?: string; destinationPostcode?: string };
        const pdf = await generateInvoicePdf({
          brandName: booking.brand.name,
          vatNumber: booking.brand.vatNumber,
          invoiceNumber,
          customerName: booking.contactName,
          bookingReference: booking.reference,
          route: `${inputs.originPostcode ?? "?"} → ${inputs.destinationPostcode ?? "?"}`,
          subtotal: Number(booking.valueExVat),
          vatAmount: Number(booking.valueExVat) * 0.2,
          total: Number(booking.valueIncVat),
        });
        const pdfUrl = `data:application/pdf;base64,${pdf.toString("base64")}`;
        await prisma.invoice.create({
          data: {
            brandId: booking.brandId,
            bookingId: booking.id,
            invoiceNumber,
            status: "ISSUED",
            subtotal: booking.valueExVat,
            vatAmount: Number(booking.valueExVat) * 0.2,
            total: booking.valueIncVat,
            pdfUrl,
            issuedAt: new Date(),
          },
        });
        await sendEmail({
          to: booking.contactEmail,
          subject: `${booking.brand.name} invoice ${invoiceNumber}`,
          html: `<p>Your invoice for booking <strong>${booking.reference}</strong> is attached in your account.</p>`,
        });
      }
    }

    await writeAuditLog({
      actorId: session.id,
      entityType: "BOOKING",
      entityId: booking.id,
      action: "STATUS_CHANGE",
      before,
      after: booking,
      metadata: { reason: body.reason },
    });

    return NextResponse.json({ ok: true, status: booking.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

const assignSchema = z.object({
  bookingId: z.string(),
  vehicleId: z.string().optional(),
  carrierId: z.string().optional(),
  driverId: z.string().optional(),
  carrierCost: z.number().optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !roleCanAccessOps(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = assignSchema.parse(await request.json());
    const booking = await prisma.booking.findUnique({
      where: { id: body.bookingId },
      include: { job: true },
    });
    if (!booking?.job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    try {
      assertOpsBookingAccess(session, booking.brandId);
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const job = await prisma.job.update({
      where: { id: booking.job.id },
      data: {
        vehicleId: body.vehicleId,
        carrierId: body.carrierId,
        driverId: body.driverId,
        carrierCost: body.carrierCost,
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
    });

    await writeAuditLog({
      actorId: session.id,
      entityType: "JOB",
      entityId: job.id,
      action: "UPDATE",
      after: job,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assignment failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
