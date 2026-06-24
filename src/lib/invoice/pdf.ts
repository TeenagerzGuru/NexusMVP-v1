import PDFDocument from "pdfkit";

export async function generateInvoicePdf(params: {
  brandName: string;
  vatNumber: string;
  invoiceNumber: string;
  customerName: string;
  bookingReference: string;
  route: string;
  subtotal: number;
  vatAmount: number;
  total: number;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text(params.brandName, { continued: false });
    doc.fontSize(10).text(`VAT: ${params.vatNumber}`);
    doc.moveDown();
    doc.fontSize(16).text("INVOICE");
    doc.fontSize(10).text(`Invoice no: ${params.invoiceNumber}`);
    doc.text(`Booking ref: ${params.bookingReference}`);
    doc.text(`Customer: ${params.customerName}`);
    doc.text(`Route: ${params.route}`);
    doc.moveDown();
    doc.text(`Subtotal (ex VAT): £${params.subtotal.toFixed(2)}`);
    doc.text(`VAT: £${params.vatAmount.toFixed(2)}`);
    doc.fontSize(12).text(`Total: £${params.total.toFixed(2)}`, { underline: true });
    doc.moveDown();
    doc.fontSize(9).text("Payment terms: Net 0 — due on receipt after delivery.");
    doc.end();
  });
}
