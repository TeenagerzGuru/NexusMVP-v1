import { NextResponse } from "next/server";

import { getRoutePreview } from "@/lib/quote/route-preview";

/** Live map preview — geocode + ORS route geometry for quote form. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin")?.trim() ?? "";
  const destination = searchParams.get("dest")?.trim() ?? "";

  if (origin.length < 5 || destination.length < 5) {
    return NextResponse.json({ error: "Origin and destination postcodes required" }, { status: 400 });
  }

  try {
    const preview = await getRoutePreview(origin, destination);
    return NextResponse.json(preview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Route preview failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
