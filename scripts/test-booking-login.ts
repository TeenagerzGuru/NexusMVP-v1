const PORTS = [3000, 3001, 3002, 3003, 3004, 3005];

async function findBaseUrl() {
  for (const port of PORTS) {
    try {
      const res = await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(15000) });
      if (res.ok) return `http://localhost:${port}`;
    } catch {
      // try next port
    }
  }
  throw new Error("Dev server not running. Run: npm run dev");
}

const USERS = [
  { email: "admin@nexus.local", password: "Nexus2026!", role: "ADMIN" },
  { email: "ops@deliverred.co.uk", password: "Nexus2026!", role: "OPERATIONS" },
  { email: "driver@deliverred.co.uk", password: "Nexus2026!", role: "DRIVER" },
  { email: "customer@example.com", password: "Nexus2026!", role: "CUSTOMER" },
];

async function createBooking(base: string) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const quoteRes = await fetch(`${base}/api/quotes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      originPostcode: "M16 9PW",
      destinationPostcode: "B5 4AA",
      vehicleType: "18T",
      collectionDate: tomorrow.toISOString().slice(0, 10),
      collectionTime: "10:00",
      addons: [],
      goodsDescription: "Login + booking test",
    }),
  });
  const quote = await quoteRes.json().catch(() => null);
  if (!quoteRes.ok) {
    const err = quote && typeof quote === "object" && "error" in quote ? quote.error : await quoteRes.text();
    throw new Error(`Quote failed: ${err ?? quoteRes.status}`);
  }
  if (!quote) throw new Error("Quote failed: invalid response");

  const bookingRes = await fetch(`${base}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteId: quote.id,
      contactName: "Nexus Test User",
      contactEmail: "nexus.test@example.com",
      contactPhone: "+44 7700 900999",
      contactCompany: "Nexus Test Co",
      customerReference: "TEST-" + Date.now().toString().slice(-6),
    }),
  });
  const booking = await bookingRes.json().catch(() => null);
  if (!bookingRes.ok) {
    const err = booking && typeof booking === "object" && "error" in booking ? booking.error : await bookingRes.text();
    throw new Error(`Booking failed: ${err ?? bookingRes.status}`);
  }
  if (!booking) throw new Error("Booking failed: invalid response");

  return { quote, booking };
}

async function tryLogin(base: string, user: (typeof USERS)[number]) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });
  const data = await res.json();
  const cookie = res.headers.get("set-cookie");
  const ok = res.ok && data.role === user.role && cookie?.includes("nexus_session");

  return { ok, status: res.status, role: data.role, hasCookie: Boolean(cookie) };
}

async function main() {
  const base = await findBaseUrl();
  console.log(`Using ${base}\n`);

  console.log("=== BOOKING TEST ===");
  const { quote, booking } = await createBooking(base);
  console.log(`✅ Quote:    ${quote.reference} — £${quote.priceIncVat} inc VAT`);
  console.log(`✅ Booking:  ${booking.reference}\n`);

  console.log("=== LOGIN TESTS ===");
  for (const user of USERS) {
    const result = await tryLogin(base, user);
    const icon = result.ok ? "✅" : "❌";
    console.log(
      `${icon} ${user.email} → role=${result.role ?? "fail"} cookie=${result.hasCookie ? "yes" : "no"}`,
    );
  }

  console.log("\n=== UI LINKS ===");
  console.log(`Quote page:  ${base}/`);
  console.log(`Login:       ${base}/login`);
  console.log(`Dashboard:   ${base}/dashboard`);
  console.log(`Driver:      ${base}/driver`);
  console.log(`Account:     ${base}/account`);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
