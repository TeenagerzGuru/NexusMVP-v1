import { NextResponse } from "next/server";
import { z } from "zod";

import { getBrandSlugFromRequest } from "@/lib/brand/resolve";
import { createQuoteRecord } from "@/lib/quote/service";
import { VEHICLE_TYPES } from "@/lib/quote/types";

const quoteSchema = z.object({
  originPostcode: z.string().min(5),
  destinationPostcode: z.string().min(5),
  vehicleType: z.enum(VEHICLE_TYPES),
  collectionDate: z.string(),
  collectionTime: z.string(),
  addons: z.array(z.enum(["tail-lift", "hiab", "adr", "two-person"])).default([]),
  goodsDescription: z.string().optional(),
});

/** Brand-scoped quote creation — body validated with Zod, brand from request header. */
export async function POST(request: Request) {
  try {
    const body = quoteSchema.parse(await request.json());
    const brandSlug = await getBrandSlugFromRequest();

    const { quote, result, distance } = await createQuoteRecord({
      ...body,
      brandSlug,
    });

    return NextResponse.json({
      id: quote.id,
      reference: quote.reference,
      expiresAt: quote.expiresAt,
      priceExVat: result.priceExVat,
      priceIncVat: result.priceIncVat,
      vatAmount: result.vatAmount,
      breakdown: result.breakdown,
      distanceMiles: distance.miles,
      distanceSource: distance.source,
      durationMinutes: distance.durationMinutes,
    });
  } catch (error) {
    console.error("[quotes]", error);
    const message = error instanceof Error ? error.message : "Quote failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
