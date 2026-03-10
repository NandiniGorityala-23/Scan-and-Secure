import { Readable } from 'stream';
import csvParser from 'csv-parser';
import Product from '../models/Product.model.js';
import QRCodeModel from '../models/QRCode.model.js';
import Batch from '../models/Batch.model.js';
import { generateBatch } from '../services/qr.service.js';
import { buildQRPdf } from '../services/pdf.service.js';
import { buildPaginationMeta, parsePagination } from '../utils/pagination.js';
import { buildCsv } from '../utils/csv.js';

export const generate = async (req, res, next) => {
  try {
    const { productId, quantity, batchName } = req.body;

    if (!productId || !quantity || quantity < 1 || quantity > 10000) {
      return res.status(400).json({ message: 'productId and quantity (1-10,000) required' });
    }
    if (!batchName || !batchName.trim()) {
      return res.status(400).json({ message: 'Batch name is required' });
    }

    const product = await Product.findOne({ _id: productId, manufacturer: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const existing = await Batch.findOne({ name: batchName.trim() });
    if (existing) {
      return res.status(409).json({ message: `Batch name "${batchName.trim()}" already exists` });
    }

    const batch = await Batch.create({
      name: batchName.trim(),
      product: productId,
      quantity: Number(quantity),
      generatedBy: req.user._id,
    });

    const codes = await generateBatch(productId, Number(quantity), batch._id);

    // Stream CSV directly as the response so it auto-downloads in the browser
    const csv = buildCsv(
      ['uuid', 'claim_url', 'product_name', 'batch_name', 'status'],
      codes.map((c) => [c.uuid, c.claimUrl, product.name, batch.name, c.status])
    );

    const filename = `batch-${batch.name.replace(/\s+/g, '-')}-${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const adminProducts = await Product.find({ manufacturer: req.user._id }).select('_id');
    const productIds = adminProducts.map((p) => p._id);

    const [total, claimed, unclaimed] = await Promise.all([
      QRCodeModel.countDocuments({ product: { $in: productIds } }),
      QRCodeModel.countDocuments({ product: { $in: productIds }, status: 'claimed' }),
      QRCodeModel.countDocuments({ product: { $in: productIds }, status: 'unclaimed' }),
    ]);

    res.json({ total, claimed, unclaimed });
  } catch (err) {
    next(err);
  }
};

export const getBatches = async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });
    const adminProducts = await Product.find({ manufacturer: req.user._id }).select('_id');
    const productIds = adminProducts.map((p) => p._id);
    const filter = { product: { $in: productIds } };

    const [batches, total] = await Promise.all([
      Batch.find(filter)
        .populate('product', 'name modelNumber category images')
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit),
      Batch.countDocuments(filter),
    ]);

    res.json({
      batches,
      ...buildPaginationMeta({ total, ...pagination }),
    });
  } catch (err) {
    next(err);
  }
};

export const exportBatchCSV = async (req, res, next) => {
  try {
    const { batchId } = req.params;

    const batch = await Batch.findById(batchId).populate('product');
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    const product = await Product.findOne({ _id: batch.product._id, manufacturer: req.user._id });
    if (!product) return res.status(403).json({ message: 'Access denied' });

    const codes = await QRCodeModel.find({ batch: batchId });

    const csv = buildCsv(
      ['uuid', 'claim_url', 'product_name', 'batch_name', 'status'],
      codes.map((c) => [c.uuid, c.claimUrl, product.name, batch.name, c.status])
    );

    const filename = `batch-${batch.name.replace(/\s+/g, '-')}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

export const generatePDFFromCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'CSV file required' });
    }

    const items = [];

    await new Promise((resolve, reject) => {
      Readable.from(req.file.buffer)
        .pipe(csvParser())
        .on('data', (row) => {
          const claimUrl = row.claim_url?.trim();
          const uuid = row.uuid?.trim();
          const productName = row.product_name?.trim() || '';

          if (claimUrl && uuid) {
            items.push({ claimUrl, uuid, productName });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (items.length === 0) {
      return res.status(400).json({ message: 'No valid rows found in CSV' });
    }

    const filename = `qr-labels-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await buildQRPdf(items, res);
  } catch (err) {
    next(err);
  }
};
