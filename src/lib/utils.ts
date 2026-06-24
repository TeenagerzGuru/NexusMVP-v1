import { prisma } from "@/lib/prisma";

/** GBP formatter — always en-GB for UK transport context. */
export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
}

/** Human-readable ref generator — prefix + base36 timestamp + random suffix. */
export async function nextReference(prefix: string) {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}-${random}`;
}

/** Atomically increments brand invoice sequence — call inside booking/invoice transaction. */
export async function nextInvoiceNumber(brandId: string) {
  const brand = await prisma.brand.update({
    where: { id: brandId },
    data: { invoiceSequenceNext: { increment: 1 } },
    select: {
      invoiceNumberPrefix: true,
      invoiceSequenceYear: true,
      invoiceSequenceNext: true,
    },
  });

  const seq = String(brand.invoiceSequenceNext - 1).padStart(4, "0");
  return `${brand.invoiceNumberPrefix}-${brand.invoiceSequenceYear}-${seq}`;
}

export function bookingStatusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
