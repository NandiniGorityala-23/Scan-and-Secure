import cron from 'node-cron';
import QRCode from '../models/QRCode.model.js';
import { sendExpiryReminder } from '../services/email.service.js';

const buildExpiryReminderFilter = ({ productIds } = {}) => {
  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(now.getDate() + 30);

  const filter = {
    status: 'claimed',
    expiresAt: { $gte: now, $lte: in30Days },
    notifiedAt: null,
  };

  if (productIds?.length) {
    filter.product = { $in: productIds };
  }

  return filter;
};

export const listPendingExpiryReminders = ({ productIds } = {}) =>
  QRCode.find(buildExpiryReminderFilter({ productIds }))
    .populate('product', 'name modelNumber')
    .populate('claimedBy', 'name email');

export const sendPendingExpiryReminders = async ({ productIds } = {}) => {
  const expiring = await listPendingExpiryReminders({ productIds });

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
      results.push({ email: code.claimedBy.email, product: code.product.name, status: 'sent' });
    } catch (emailErr) {
      results.push({
        email: code.claimedBy.email,
        product: code.product.name,
        status: 'failed',
        error: emailErr.message,
      });
    }
  }

  return results;
};

export const startExpiryNotifier = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('[ExpiryNotifier] Running warranty expiry check...');

    try {
      const results = await sendPendingExpiryReminders();
      const sent = results.filter((result) => result.status === 'sent').length;
      console.log(`[ExpiryNotifier] Sent ${sent} of ${results.length} expiry reminders`);
    } catch (err) {
      console.error('[ExpiryNotifier] Job error:', err.message);
    }
  });

  console.log('[ExpiryNotifier] Scheduled - runs daily at 9:00 AM');
};
