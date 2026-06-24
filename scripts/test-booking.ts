const BASE = "http://localhost:3000";

async function main() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const collectionDate = tomorrow.toISOString().slice(0, 10);

  console.log("1. Creating quote...");
  const quoteRes = await fetch(`${BASE}/api/quotes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Host: "localhost:3000",
    },
    body: JSON.stringify({
      originPostcode: "M16 9PW",
      destinationPostcode: "B5 4AA",
      vehicleType: "18T",
      collectionDate,
      collectionTime: "14:00",
      addons: ["tail-lift"],
      goodsDescription: "Test pallet — API booking",
    }),
  });

  const quote = await quoteRes.json();
  if (!quoteRes.ok) {
    console.error("Quote failed:", quote);
    process.exit(1);
  }

  console.log("   Quote OK:", quote.reference);
  console.log("   Price inc VAT:", `£${quote.priceIncVat}`);

  console.log("\n2. Confirming booking...");
  const bookingRes = await fetch(`${BASE}/api/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Host: "localhost:3000",
    },
    body: JSON.stringify({
      quoteId: quote.id,
      contactName: "Ahmad Test",
      contactEmail: "ahmad.test@example.com",
      contactPhone: "+44 7700 900123",
      contactCompany: "Test Logistics Sdn Bhd",
      customerReference: "PO-TEST-001",
      specialInstructions: "Call on arrival",
    }),
  });

  const booking = await bookingRes.json();
  if (!bookingRes.ok) {
    console.error("Booking failed:", booking);
    process.exit(1);
  }

  console.log("   Booking OK:", booking.reference);
  console.log("\n✅ End-to-end booking succeeded!");
  console.log("   View in dashboard: http://localhost:3000/dashboard");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
