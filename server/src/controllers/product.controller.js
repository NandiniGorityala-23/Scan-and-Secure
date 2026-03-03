import { Readable } from 'stream';
import csvParser from 'csv-parser';
import cloudinary from '../config/cloudinary.js';
import Product from '../models/Product.model.js';

export const getProducts = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query;

    const filter = { manufacturer: req.user._id };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { modelNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const { name, modelNumber, category, specifications, warrantyDurationMonths, images } = req.body;

    const product = await Product.create({
      name,
      modelNumber,
      category,
      specifications,
      warrantyDurationMonths,
      images: images || [],
      manufacturer: req.user._id,
    });

    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, manufacturer: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json({ product });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      manufacturer: req.user._id,
    });

    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

export const importProducts = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'CSV file required' });
    }

    const rows = [];
    const errors = [];

    await new Promise((resolve, reject) => {
      Readable.from(req.file.buffer)
        .pipe(csvParser())
        .on('data', (row) => {
          const months = Number(row.warranty_duration_months);

          if (!row.name || !row.model_number || !row.category || !months) {
            errors.push(`Skipped row — missing required fields: ${JSON.stringify(row)}`);
            return;
          }

          rows.push({
            name: row.name.trim(),
            modelNumber: row.model_number.trim(),
            category: row.category.trim(),
            specifications: row.specifications?.trim() || '',
            warrantyDurationMonths: months,
            manufacturer: req.user._id,
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (rows.length === 0) {
      return res.status(400).json({ message: 'No valid rows found in CSV', errors });
    }

    const inserted = await Product.insertMany(rows, { ordered: false });

    res.status(201).json({
      message: `${inserted.length} products imported`,
      imported: inserted.length,
      skipped: errors.length,
      errors,
    });
  } catch (err) {
    next(err);
  }
};

export const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file required' });
    }

    const url = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'omniwarranty/products', resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      Readable.from(req.file.buffer).pipe(uploadStream);
    });

    res.json({ url });
  } catch (err) {
    next(err);
  }
};
