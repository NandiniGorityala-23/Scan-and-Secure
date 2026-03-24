import Product from '../models/Product.model.js';
import QRCode from '../models/QRCode.model.js';
import Batch from '../models/Batch.model.js';
import { sendExpiryReminder } from '../services/email.service.js';

export const getClaims = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, status } = req.query;
    const adminProducts = await Product.find({ manufacturer: req.user._id }).select('_id');
    const productIds = adminProducts.map((p) => p._id);

    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);

    const filter = { product: { $in: productIds }, status: 'claimed' };

    const skip = (Number(page) - 1) * Number(limit);
    const [rawClaims, total] = await Promise.all([
      QRCode.find(filter)
        .sort({ claimedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('product', 'name modelNumber category warrantyDurationMonths')
        .populate('claimedBy', 'name email'),
      QRCode.countDocuments(filter),
    ]);

    let claims = rawClaims.map((c) => ({
      productName: c.product?.name,
      modelNumber: c.product?.modelNumber,
      category: c.product?.category,
      warrantyDurationMonths: c.product?.warrantyDurationMonths,
      customerName: c.claimedBy?.name,
      customerEmail: c.claimedBy?.email,
      claimedAt: c.claimedAt,
      expiresAt: c.expiresAt,
    }));

    // Filter by expiry status client-side after fetch
    if (status === 'active') {
      claims = claims.filter((c) => c.expiresAt && new Date(c.expiresAt) > in30Days);
    } else if (status === 'expiring') {
      claims = claims.filter((c) => c.expiresAt && new Date(c.expiresAt) >= now && new Date(c.expiresAt) <= in30Days);
    } else if (status === 'expired') {
      claims = claims.filter((c) => c.expiresAt && new Date(c.expiresAt) < now);
    }

    res.json({
      claims,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 7), 365);

    const adminProducts = await Product.find({ manufacturer: req.user._id }).select('_id name category warrantyDurationMonths');
    const productIds = adminProducts.map((p) => p._id);

    // ── Core counts ───────────────────────────────────────────────────────────
    const [totalCodes, totalClaimed, totalUnclaimed, totalBatches] = await Promise.all([
      QRCode.countDocuments({ product: { $in: productIds } }),
      QRCode.countDocuments({ product: { $in: productIds }, status: 'claimed' }),
      QRCode.countDocuments({ product: { $in: productIds }, status: 'unclaimed' }),
      Batch.countDocuments({ product: { $in: productIds } }),
    ]);

    // ── Claims over selected period (daily buckets) ────────────────────────────
    // Start = beginning of day, (days-1) days ago. End = end of today.
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - (days - 1));
    periodStart.setHours(0, 0, 0, 0);

    const periodEnd = new Date();
    periodEnd.setHours(23, 59, 59, 999);

    const claimsByDay = await QRCode.aggregate([
      {
        $match: {
          product: { $in: productIds },
          status: 'claimed',
          claimedAt: { $gte: periodStart, $lte: periodEnd },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$claimedAt', timezone: 'Asia/Kolkata' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days with 0 — keys in IST local date strings
    const dayMap = {};
    claimsByDay.forEach((d) => { dayMap[d._id] = d.count; });
    const claimsTimeline = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(periodStart);
      d.setDate(periodStart.getDate() + i);
      // Format as YYYY-MM-DD in IST
      const key = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      claimsTimeline.push({ date: key, claims: dayMap[key] || 0 });
    }

    // ── Claims by category ────────────────────────────────────────────────────
    const claimsByCategory = await QRCode.aggregate([
      { $match: { product: { $in: productIds }, status: 'claimed' } },
      { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $group: { _id: '$product.category', claimed: { $sum: 1 } } },
      { $sort: { claimed: -1 } },
    ]);

    // ── Per-product claim rate ─────────────────────────────────────────────────
    const perProduct = await QRCode.aggregate([
      { $match: { product: { $in: productIds } } },
      {
        $group: {
          _id: '$product',
          total: { $sum: 1 },
          claimed: { $sum: { $cond: [{ $eq: ['$status', 'claimed'] }, 1, 0] } },
        },
      },
    ]);

    const productNameMap = {};
    adminProducts.forEach((p) => { productNameMap[p._id.toString()] = p.name; });

    const productClaimRates = perProduct
      .map((p) => ({
        name: productNameMap[p._id.toString()] || 'Unknown',
        total: p.total,
        claimed: p.claimed,
        rate: p.total > 0 ? Math.round((p.claimed / p.total) * 100) : 0,
      }))
      .sort((a, b) => b.claimed - a.claimed)
      .slice(0, 8);

    // ── Recent claims ─────────────────────────────────────────────────────────
    const recentClaims = await QRCode.find({
      product: { $in: productIds },
      status: 'claimed',
    })
      .sort({ claimedAt: -1 })
      .limit(10)
      .populate('product', 'name modelNumber category')
      .populate('claimedBy', 'name email');

    const recentClaimsData = recentClaims.map((c) => {
      const name = c.claimedBy?.name || '';
      const parts = name.trim().split(' ');
      const maskedName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
      return {
        uuid: c.uuid.slice(0, 8) + '…',
        productName: c.product?.name,
        modelNumber: c.product?.modelNumber,
        category: c.product?.category,
        customerName: maskedName,
        claimedAt: c.claimedAt,
        expiresAt: c.expiresAt,
      };
    });

    res.json({
      summary: {
        totalProducts: adminProducts.length,
        totalCodes,
        totalClaimed,
        totalUnclaimed,
        totalBatches,
        claimRate: totalCodes > 0 ? Math.round((totalClaimed / totalCodes) * 100) : 0,
      },
      claimsTimeline,
      claimsByCategory,
      productClaimRates,
      recentClaims: recentClaimsData,
    });
  } catch (err) {
    next(err);
  }
};

export const triggerExpiryNotifications = async (req, res, next) => {
  try {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);

    const expiring = await QRCode.find({
      status: 'claimed',
      expiresAt: { $gte: now, $lte: in30Days },
      notifiedAt: null,
    })
      .populate('product', 'name modelNumber')
      .populate('claimedBy', 'name email');

    if (expiring.length === 0) {
      return res.json({ sent: 0, message: 'No unnotified warranties expiring within 30 days.' });
    }

    let sent = 0;
    const results = [];

    for (const code of expiring) {
      if (!code.claimedBy?.email) continue;
      try {
        await sendExpiryReminder({
          to: code.claimedBy.email,
          customerName: code.claimedBy.name,
          productName: code.product.name,
          modelNumber: code.product.modelNumber,
          expiresAt: code.expiresAt,
        });
        code.notifiedAt = new Date();
        await code.save();
        sent++;
        results.push({ email: code.claimedBy.email, product: code.product.name, status: 'sent' });
      } catch (err) {
        results.push({ email: code.claimedBy.email, product: code.product.name, status: 'failed', error: err.message });
      }
    }

    res.json({ sent, total: expiring.length, results });
  } catch (err) {
    next(err);
  }
};
