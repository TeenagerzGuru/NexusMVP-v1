type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

/** Resend in prod, stdout in dev — never throws on provider failure. */
export async function sendEmail(payload: EmailPayload) {
  if (process.env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "NEXUS <onboarding@resend.dev>",
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Email send failed:", text);
    }
    return;
  }

  console.log("--- EMAIL (dev) ---");
  console.log(`To: ${payload.to}`);
  console.log(`Subject: ${payload.subject}`);
  console.log(payload.html);
  console.log("-------------------");
}

/** HTML payload for post-booking customer (+ optional ops) notification. */
export function bookingConfirmationEmail(params: {
  brandName: string;
  bookingReference: string;
  route: string;
  priceIncVat: string;
  customerName: string;
}) {
  return {
    subject: `${params.brandName} booking confirmed — ${params.bookingReference}`,
    html: `
      <h1>Booking confirmed</h1>
      <p>Hi ${params.customerName},</p>
      <p>Your booking <strong>${params.bookingReference}</strong> with ${params.brandName} is confirmed.</p>
      <p><strong>Route:</strong> ${params.route}</p>
      <p><strong>Total (inc VAT):</strong> ${params.priceIncVat}</p>
      <p>We invoice on net-zero terms after delivery.</p>
    `,
  };
}

/** HTML payload when driver submits POD. */
export function podDeliveryEmail(params: {
  brandName: string;
  bookingReference: string;
  recipientName: string;
}) {
  return {
    subject: `${params.brandName} POD — ${params.bookingReference}`,
    html: `
      <h1>Proof of delivery</h1>
      <p>Your shipment <strong>${params.bookingReference}</strong> was signed for by ${params.recipientName}.</p>
      <p>Thank you for choosing ${params.brandName}.</p>
    `,
  };
}
