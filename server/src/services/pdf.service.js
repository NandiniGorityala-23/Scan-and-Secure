import PDFDocument from 'pdfkit';
import { generateQRBuffer } from './qr.service.js';

const COLS = 3;
const ROWS = 3;
const PER_PAGE = COLS * ROWS;
const MARGIN = 40;
const PAGE_WIDTH = 595; // A4 points
const PAGE_HEIGHT = 842;

const CELL_WIDTH = (PAGE_WIDTH - MARGIN * 2) / COLS;
const CELL_HEIGHT = (PAGE_HEIGHT - MARGIN * 2) / ROWS;
const QR_SIZE = 130;

/**
 * Builds a print-ready PDF from an array of { claimUrl, productName, uuid } objects.
 * Pipes the PDF stream into the provided writable (e.g. res).
 */
export const buildQRPdf = async (items, writable) => {
  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });
  doc.pipe(writable);

  for (let i = 0; i < items.length; i++) {
    const posOnPage = i % PER_PAGE;

    if (posOnPage === 0) {
      doc.addPage();
    }

    const col = posOnPage % COLS;
    const row = Math.floor(posOnPage / COLS);

    const cellX = MARGIN + col * CELL_WIDTH;
    const cellY = MARGIN + row * CELL_HEIGHT;

    const qrBuffer = await generateQRBuffer(items[i].claimUrl);

    // Center the QR image inside the cell
    const imgX = cellX + (CELL_WIDTH - QR_SIZE) / 2;
    const imgY = cellY + 10;

    doc.image(qrBuffer, imgX, imgY, { width: QR_SIZE, height: QR_SIZE });

    // Product name below QR
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor('#111827')
      .text(items[i].productName || '', cellX, imgY + QR_SIZE + 6, {
        width: CELL_WIDTH,
        align: 'center',
      });

    // UUID snippet (first 8 chars) for reference
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#6b7280')
      .text(items[i].uuid?.slice(0, 8) + '...', cellX, imgY + QR_SIZE + 18, {
        width: CELL_WIDTH,
        align: 'center',
      });

    // Light border around cell
    doc
      .rect(cellX + 2, cellY + 2, CELL_WIDTH - 4, CELL_HEIGHT - 4)
      .stroke('#e5e7eb');
  }

  doc.end();
};
