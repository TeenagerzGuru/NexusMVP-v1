import { NextResponse } from "next/server";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit/log";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const patchSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("lane"),
    id: z.string().min(1),
    basePrice: z.number().positive().max(100_000),
  }),
  z.object({
    type: z.literal("surcharge"),
    id: z.string().min(1),
    value: z.number().nonnegative().max(10_000),
  }),
  z.object({
    type: z.literal("config"),
    brandId: z.string().min(1),
    marginMultiplier: z.number().positive().max(5).optional(),
    minimumJobValue: z.number().positive().max(100_000).optional(),
  }),
]);

/** Admin-only pricing updates — live on next quote. */
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = patchSchema.parse(await request.json());

    if (body.type === "lane") {
      const before = await prisma.pricingLane.findUnique({ where: { id: body.id } });
      if (!before) return NextResponse.json({ error: "Lane not found" }, { status: 404 });

      const updated = await prisma.pricingLane.update({
        where: { id: body.id },
        data: { basePrice: body.basePrice },
      });

      await writeAuditLog({
        actorId: session.id,
        entityType: "PRICING_LANE",
        entityId: updated.id,
        action: "UPDATE",
        before: { basePrice: Number(before.basePrice) },
        after: { basePrice: body.basePrice },
      });

      return NextResponse.json({ ok: true, basePrice: Number(updated.basePrice) });
    }

    if (body.type === "surcharge") {
      const before = await prisma.pricingSurcharge.findUnique({ where: { id: body.id } });
      if (!before) return NextResponse.json({ error: "Surcharge not found" }, { status: 404 });

      const updated = await prisma.pricingSurcharge.update({
        where: { id: body.id },
        data: { value: body.value },
      });

      await writeAuditLog({
        actorId: session.id,
        entityType: "PRICING_SURCHARGE",
        entityId: updated.id,
        action: "UPDATE",
        before: { value: Number(before.value) },
        after: { value: body.value },
      });

      return NextResponse.json({ ok: true, value: Number(updated.value) });
    }

    const before = await prisma.brandPricingConfig.findUnique({ where: { brandId: body.brandId } });
    if (!before) return NextResponse.json({ error: "Config not found" }, { status: 404 });

    const updated = await prisma.brandPricingConfig.update({
      where: { brandId: body.brandId },
      data: {
        ...(body.marginMultiplier != null ? { marginMultiplier: body.marginMultiplier } : {}),
        ...(body.minimumJobValue != null ? { minimumJobValue: body.minimumJobValue } : {}),
      },
    });

    await writeAuditLog({
      actorId: session.id,
      entityType: "PRICING_BRAND_CONFIG",
      entityId: updated.id,
      action: "UPDATE",
      before: {
        marginMultiplier: Number(before.marginMultiplier),
        minimumJobValue: Number(before.minimumJobValue),
      },
      after: {
        marginMultiplier: Number(updated.marginMultiplier),
        minimumJobValue: Number(updated.minimumJobValue),
      },
    });

    return NextResponse.json({
      ok: true,
      marginMultiplier: Number(updated.marginMultiplier),
      minimumJobValue: Number(updated.minimumJobValue),
    });
  } catch (error) {
    console.error("[admin/pricing]", error);
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
