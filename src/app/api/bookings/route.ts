import { NextResponse } from "next/server";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit/log";
import { getBrand } from "@/lib/brand/resolve";
import { bookingConfirmationEmail, sendEmail } from "@/lib/email/send";
import { prisma } from "@/lib/prisma";
import { formatMoney, nextReference } from "@/lib/utils";

const bookingSchema = z.object({
  quoteId: z.string(),
  contactName: z.string().min(2),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  contactCompany: z.string().optional(),
  customerReference: z.string().optional(),
  specialInstructions: z.string().optional(),
});

/** Converts ACTIVE quote → booking + job; emails customer and optional ops inbox. */
export async function POST(request: Request) {
  try {
    const body = bookingSchema.parse(await request.json());
    const brand = await getBrand();
    const brandRecord = await prisma.brand.findUniqueOrThrow({ where: { slug: brand.slug } });

    const quote = await prisma.quote.findUnique({ where: { id: body.quoteId } });
    if (!quote || quote.brandId !== brandRecord.id) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }
    if (quote.status !== "ACTIVE" || quote.expiresAt < new Date()) {
      return NextResponse.json({ error: "Quote expired" }, { status: 400 });
    }

    const reference = await nextReference("BKG");

    const booking = await prisma.$transaction(async (tx) => {
      let customer = await tx.customer.findFirst({
        where: { brandId: brandRecord.id, contactEmail: body.contactEmail },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            brandId: brandRecord.id,
            companyName: body.contactCompany ?? body.contactName,
            contactEmail: body.contactEmail,
            contactPhone: body.contactPhone,
            billingAddressLine1: "To be confirmed",
            paymentTerms: "Net 0",
          },
        });
      }

      const created = await tx.booking.create({
        data: {
          brandId: brandRecord.id,
          quoteId: quote.id,
          customerId: customer.id,
          reference,
          status: "BOOKED",
          customerReference: body.customerReference,
          specialInstructions: body.specialInstructions,
          contactName: body.contactName,
          contactEmail: body.contactEmail,
          contactPhone: body.contactPhone,
          contactCompany: body.contactCompany,
          valueExVat: quote.priceExVat,
          valueIncVat: quote.priceIncVat,
        },
      });

      await tx.quote.update({ where: { id: quote.id }, data: { status: "CONVERTED" } });
      await tx.job.create({ data: { bookingId: created.id, status: "PENDING_ASSIGNMENT" } });

      return created;
    });

    const inputs = quote.inputs as { originPostcode?: string; destinationPostcode?: string };
    const route = `${inputs.originPostcode ?? "?"} → ${inputs.destinationPostcode ?? "?"}`;
    const email = bookingConfirmationEmail({
      brandName: brand.name,
      bookingReference: booking.reference,
      route,
      priceIncVat: formatMoney(Number(booking.valueIncVat)),
      customerName: body.contactName,
    });

    await sendEmail({ to: body.contactEmail, ...email });
    if (process.env.OPS_INBOX_EMAIL) {
      await sendEmail({ to: process.env.OPS_INBOX_EMAIL, ...email });
    }

    await writeAuditLog({
      entityType: "BOOKING",
      entityId: booking.id,
      action: "CREATE",
      after: booking,
    });

    return NextResponse.json({ id: booking.id, reference: booking.reference });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Booking failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
