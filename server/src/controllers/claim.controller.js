import QRCode from '../models/QRCode.model.js';
import Product from '../models/Product.model.js';
import { buildCertificatePdf } from '../services/certificate.service.js';

export const getMyWarranties = async (req, res, next) => {
  try {
    const codes = await QRCode.find({ claimedBy: req.user._id, status: 'claimed' })
      .sort({ claimedAt: -1 })
      .populate('product', 'name modelNumber category specifications warrantyDurationMonths images');

    const warranties = codes.map((c) => ({
      uuid: c.uuid,
      claimedAt: c.claimedAt,
      expiresAt: c.expiresAt,
      product: {
        name: c.product.name,
        modelNumber: c.product.modelNumber,
        category: c.product.category,
        specifications: c.product.specifications,
        warrantyDurationMonths: c.product.warrantyDurationMonths,
        images: c.product.images || [],
      },
    }));

    res.json({ warranties });
  } catch (err) {
    next(err);
  }
};

export const getClaimInfo = async (req, res, next) => {
  try {
    const { uuid } = req.params;

    const code = await QRCode.findOne({ uuid })
      .populate('product', 'name modelNumber category specifications warrantyDurationMonths images manufacturer')
      .populate('claimedBy', 'name email');

    if (!code) {
      return res.status(404).json({ message: 'QR code not found. Please check the code and try again.' });
    }

    const payload = {
      uuid: code.uuid,
      status: code.status,
      product: {
        name: code.product.name,
        modelNumber: code.product.modelNumber,
        category: code.product.category,
        specifications: code.product.specifications,
        warrantyDurationMonths: code.product.warrantyDurationMonths,
        images: code.product.images || [],
      },
    };

    if (code.status === 'claimed') {
      payload.claimedAt = code.claimedAt;
      payload.expiresAt = code.expiresAt;
      payload.claimedById = code.claimedBy?._id?.toString();
      // Mask customer name for privacy — show first name + last initial only
      const name = code.claimedBy?.name || '';
      const parts = name.trim().split(' ');
      payload.claimedByName =
        parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
    }

    res.json(payload);
  } catch (err) {
    next(err);
  }
};

export const activateClaim = async (req, res, next) => {
  try {
    const { uuid } = req.params;

    // Atomic update — only succeeds if status is currently 'unclaimed'
    const code = await QRCode.findOneAndUpdate(
      { uuid, status: 'unclaimed' },
      {
        status: 'claimed',
        claimedBy: req.user._id,
        claimedAt: new Date(),
      },
      { new: true }
    ).populate('product', 'name modelNumber category specifications warrantyDurationMonths images');

    if (!code) {
      // Either UUID doesn't exist or already claimed
      const existing = await QRCode.findOne({ uuid });
      if (!existing) {
        return res.status(404).json({ message: 'QR code not found.' });
      }
      return res.status(409).json({ message: 'This warranty has already been activated.' });
    }

    // Compute expiry date
    const expiresAt = new Date(code.claimedAt);
    expiresAt.setMonth(expiresAt.getMonth() + code.product.warrantyDurationMonths);
    code.expiresAt = expiresAt;
    await code.save();

    res.json({
      message: 'Warranty activated successfully',
      uuid: code.uuid,
      product: {
        name: code.product.name,
        modelNumber: code.product.modelNumber,
        category: code.product.category,
        specifications: code.product.specifications,
        warrantyDurationMonths: code.product.warrantyDurationMonths,
        images: code.product.images || [],
      },
      claimedAt: code.claimedAt,
      expiresAt: code.expiresAt,
    });
  } catch (err) {
    next(err);
  }
};

export const downloadCertificate = async (req, res, next) => {
  try {
    const { uuid } = req.params;

    const code = await QRCode.findOne({ uuid, status: 'claimed' })
      .populate('product', 'name modelNumber category specifications warrantyDurationMonths')
      .populate('claimedBy', 'name email');

    if (!code) {
      return res.status(404).json({ message: 'Claimed warranty not found.' });
    }

    // Only the customer who claimed it can download the certificate
    if (code.claimedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const filename = `warranty-certificate-${uuid.slice(0, 8)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await buildCertificatePdf(
      {
        customerName: code.claimedBy.name,
        customerEmail: code.claimedBy.email,
        product: code.product,
        uuid: code.uuid,
        claimUrl: code.claimUrl,
        claimedAt: code.claimedAt,
        expiresAt: code.expiresAt,
      },
      res
    );
  } catch (err) {
    next(err);
  }
};
