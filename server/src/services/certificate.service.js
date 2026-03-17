import PDFDocument from 'pdfkit';
import { generateQRBuffer } from './qr.service.js';

const INDIGO = '#4f46e5';
const SLATE_900 = '#0f172a';
const SLATE_600 = '#475569';
const SLATE_300 = '#cbd5e1';
const WHITE = '#ffffff';
const GREEN = '#16a34a';
const GREEN_BG = '#f0fdf4';
const LIGHT_BG = '#f8fafc';

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function monthsLabel(n) {
  if (n % 12 === 0) return `${n / 12} year${n / 12 > 1 ? 's' : ''}`;
  return `${n} month${n > 1 ? 's' : ''}`;
}

// Draw filled rect without touching fillOpacity state
function fillRect(doc, x, y, w, h, color) {
  doc.save().rect(x, y, w, h).fill(color).restore();
}

function fillRoundedRect(doc, x, y, w, h, r, color) {
  doc.save().roundedRect(x, y, w, h, r).fill(color).restore();
}

function strokeRoundedRect(doc, x, y, w, h, r, color, lw) {
  doc.save().roundedRect(x, y, w, h, r).lineWidth(lw).strokeColor(color).stroke().restore();
}

export const buildCertificatePdf = async (data, writable) => {
  const { customerName, customerEmail, product, uuid, claimUrl, claimedAt, expiresAt } = data;
  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
  doc.pipe(writable);

  const W = 595;
  const H = 842;
  const L = 50;           // left margin
  const R = W - 50;       // right edge
  const MID = W / 2;

  // ── Header band (0–140) ───────────────────────────────────────────────────
  fillRect(doc, 0, 0, W, 140, INDIGO);

  // Decorative circles — use save/restore so opacity doesn't bleed
  doc.save().circle(W - 60, 70, 90).fillOpacity(0.08).fill(WHITE).restore();
  doc.save().circle(60, 140, 60).fillOpacity(0.06).fill(WHITE).restore();

  // Logo
  doc.font('Helvetica-Bold').fontSize(26).fillColor(WHITE).text('OmniWarranty', L, 40, { lineBreak: false });
  doc.font('Helvetica').fontSize(11).fillColor('rgba(255,255,255,0.75)').text('Official Warranty Certificate', L, 74, { lineBreak: false });

  // Certificate ID badge (top-right) — use save/restore for opacity so it doesn't bleed
  doc.save().roundedRect(W - 205, 40, 160, 58, 8).fillOpacity(0.15).fill(WHITE).restore();
  doc.font('Helvetica').fontSize(7).fillColor(WHITE).fillOpacity(0.65).text('CERTIFICATE ID', W - 197, 50, { lineBreak: false });
  doc.fillOpacity(1);
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(WHITE).text(uuid.toUpperCase(), W - 197, 63, { width: 148, lineBreak: false });

  // ── Status banner (140–180) ───────────────────────────────────────────────
  fillRect(doc, 0, 140, W, 40, GREEN_BG);

  // Green dot
  doc.save().circle(L + 8, 160, 7).fill(GREEN).restore();

  doc.font('Helvetica-Bold').fontSize(10).fillColor(GREEN)
    .text('ACTIVE WARRANTY', L + 22, 151, { lineBreak: false });
  doc.font('Helvetica').fontSize(9).fillColor(SLATE_600)
    .text(`Valid until ${formatDate(expiresAt)}`, L + 22, 165, { lineBreak: false });

  // ── Two-column content (starts at y=200) ─────────────────────────────────
  const contentY = 200;
  const colW = MID - L - 20;   // ~237 pts each column
  const rightX = MID + 20;

  // Left header
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(INDIGO)
    .text('PRODUCT INFORMATION', L, contentY, { lineBreak: false });
  doc.moveTo(L, contentY + 13).lineTo(MID - 10, contentY + 13)
    .lineWidth(1.5).strokeColor(INDIGO).stroke();

  // Right header
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(INDIGO)
    .text('WARRANTY HOLDER', rightX, contentY, { lineBreak: false });
  doc.moveTo(rightX, contentY + 13).lineTo(R, contentY + 13)
    .lineWidth(1.5).strokeColor(INDIGO).stroke();

  // Field row height — fixed 36pt each
  const ROW = 36;

  const prodFields = [
    ['Product Name', product.name],
    ['Model Number', product.modelNumber],
    ['Category', product.category],
    ['Specifications', product.specifications || '—'],
    ['Warranty Duration', monthsLabel(product.warrantyDurationMonths)],
  ];

  const holderFields = [
    ['Full Name', customerName],
    ['Email Address', customerEmail],
    ['Registration Date', formatDate(claimedAt)],
    ['Expiry Date', formatDate(expiresAt)],
  ];

  let ly = contentY + 22;
  for (const [label, value] of prodFields) {
    doc.font('Helvetica').fontSize(7.5).fillColor(SLATE_600).text(label, L, ly, { lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(9).fillColor(SLATE_900)
      .text(value, L, ly + 12, { width: colW, lineBreak: false });
    ly += ROW;
  }

  let ry2 = contentY + 22;
  for (const [label, value] of holderFields) {
    doc.font('Helvetica').fontSize(7.5).fillColor(SLATE_600).text(label, rightX, ry2, { lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(9).fillColor(SLATE_900)
      .text(value, rightX, ry2 + 12, { width: colW, lineBreak: false });
    ry2 += ROW;
  }

  // ── Divider ───────────────────────────────────────────────────────────────
  const divY = contentY + 22 + prodFields.length * ROW + 10;
  doc.moveTo(L, divY).lineTo(R, divY).lineWidth(0.5).strokeColor(SLATE_300).stroke();

  // ── QR code (centered) ────────────────────────────────────────────────────
  const qrSize = 110;
  const qrY = divY + 20;
  const qrX = MID - qrSize / 2;

  const qrBuffer = await generateQRBuffer(claimUrl);
  doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
  strokeRoundedRect(doc, qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 6, SLATE_300, 1);

  doc.font('Helvetica').fontSize(8).fillColor(SLATE_600)
    .text('Scan to verify authenticity', L, qrY + qrSize + 10, { width: R - L, align: 'center', lineBreak: false });

  // ── Terms box ─────────────────────────────────────────────────────────────
  const termsY = qrY + qrSize + 30;
  fillRoundedRect(doc, L, termsY, R - L, 78, 8, LIGHT_BG);

  doc.font('Helvetica-Bold').fontSize(8).fillColor(SLATE_900)
    .text('Terms & Conditions', L + 16, termsY + 12, { lineBreak: false });
  doc.font('Helvetica').fontSize(7.5).fillColor(SLATE_600).text(
    'This certificate confirms the warranty for the above product has been registered and is valid for the stated duration ' +
    'from the date of registration. Warranty covers manufacturing defects under normal use. ' +
    'Non-transferable — valid only for the registered holder. ' +
    'Present this certificate with proof of purchase for warranty service.',
    L + 16, termsY + 26, { width: R - L - 32, lineGap: 1.5 }
  );

  // ── Footer ────────────────────────────────────────────────────────────────
  fillRect(doc, 0, H - 50, W, 50, SLATE_900);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(WHITE).text('OmniWarranty', L, H - 36, { lineBreak: false });
  doc.font('Helvetica').fontSize(8).fillColor('rgba(255,255,255,0.45)')
    .text('Fraud-proof digital warranty management', L, H - 22, { lineBreak: false });
  doc.font('Helvetica').fontSize(8).fillColor('rgba(255,255,255,0.35)')
    .text(`Generated on ${formatDate(new Date())}`, 0, H - 22, { align: 'right', width: R, lineBreak: false });

  doc.end();
};
