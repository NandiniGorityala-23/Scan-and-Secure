import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import QRCodeModel from '../models/QRCode.model.js';

const CUSTOMER_APP_URL = process.env.CUSTOMER_APP_URL || 'http://localhost:5173';

export const generateBatch = async (productId, quantity, batchId) => {
  const records = [];

  for (let i = 0; i < quantity; i++) {
    const uuid = uuidv4();
    records.push({
      uuid,
      claimUrl: `${CUSTOMER_APP_URL}/claim/${uuid}`,
      product: productId,
      batch: batchId,
      status: 'unclaimed',
    });
  }

  const inserted = await QRCodeModel.insertMany(records, { ordered: false });
  return inserted;
};

// Returns a PNG buffer for a given URL string
export const generateQRBuffer = (url) =>
  QRCode.toBuffer(url, {
    type: 'png',
    width: 200,
    margin: 2,
    color: { dark: '#111827', light: '#ffffff' },
  });
