import Product from '../models/Product.model.js';
import QRCode from '../models/QRCode.model.js';
import Batch from '../models/Batch.model.js';
import { sendPendingExpiryReminders } from '../jobs/expiryNotifier.job.js';
import { buildPaginationMeta, parsePagination } from '../utils/pagination.js';

export const getClaims = async (req, res, next) => {
  try {
    const { status } = req.query;
    const adminProducts = await Product.find({ manufacturer: req.user._id }).select('_id');
    const productIds = adminProducts.map((p) => p._id);

    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);

    const filter = { product: { $in: productIds }, status: 'claimed' };

    if (status === 'active') {
      filter.expiresAt = { $gt: in30Days };
    } else if (status === 'expiring') {
      filter.expiresAt = { $gte: now, $lte: in30Days };
    } else if (status === 'expired') {
      filter.expiresAt = { $lt: now };
    }

    const pagination = parsePagination(req.query, { defaultLimit: 15, maxLimit: 100 });

    const [rawClaims, total] = await Promise.all([
      QRCode.find(filter)
        .sort({ claimedAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate('product', 'name modelNumber category warrantyDurationMonths')
        .populate('claimedBy', 'name email'),
      QRCode.countDocuments(filter),
    ]);

    const claims = rawClaims.map((c) => ({
      productName: c.product?.name,
      modelNumber: c.product?.modelNumber,
      category: c.product?.category,
      warrantyDurationMonths: c.product?.warrantyDurationMonths,
      customerName: c.claimedBy?.name,
      customerEmail: c.claimedBy?.email,
      claimedAt: c.claimedAt,
      expiresAt: c.expiresAt,
    }));

    res.json({
      claims,
      ...buildPaginationMeta({ total, ...pagination }),
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

    const [totalCodes, totalClaimed, totalUnclaimed, totalBatches] = await Promise.all([
      QRCode.countDocuments({ product: { $in: productIds } }),
      QRCode.countDocuments({ product: { $in: productIds }, status: 'claimed' }),
      QRCode.countDocuments({ product: { $in: productIds }, status: 'unclaimed' }),
      Batch.countDocuments({ product: { $in: productIds } }),
    ]);

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

    const dayMap = {};
    claimsByDay.forEach((d) => { dayMap[d._id] = d.count; });
    const claimsTimeline = [];

    for (let i = 0; i < days; i++) {
      const d = new Date(periodStart);
      d.setDate(periodStart.getDate() + i);
      const key = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      claimsTimeline.push({ date: key, claims: dayMap[key] || 0 });
    }

    const claimsByCategory = await QRCode.aggregate([
      { $match: { product: { $in: productIds }, status: 'claimed' } },
      { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $group: { _id: '$product.category', claimed: { $sum: 1 } } },
      { $sort: { claimed: -1 } },
    ]);

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
        uuid: `${c.uuid.slice(0, 8)}...`,
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
    const adminProducts = await Product.find({ manufacturer: req.user._id }).select('_id');
    const productIds = adminProducts.map((p) => p._id);
    const results = await sendPendingExpiryReminders({ productIds });

    if (results.length === 0) {
      return res.json({ sent: 0, message: 'No unnotified warranties expiring within 30 days.' });
    }

    const sent = results.filter((result) => result.status === 'sent').length;

    res.json({ sent, total: results.length, results });
  } catch (err) {
    next(err);
  }
};
