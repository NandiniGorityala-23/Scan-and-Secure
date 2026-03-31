import cron from 'node-cron';
import QRCode from '../models/QRCode.model.js';
import { sendExpiryReminder } from '../services/email.service.js';

// Runs daily at 9:00 AM
export const startExpiryNotifier = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('[ExpiryNotifier] Running warranty expiry check...');

    try {
      const now = new Date();
      const in30Days = new Date();
      in30Days.setDate(now.getDate() + 30);

      // Find warranties expiring within 30 days that haven't been notified yet
      const expiring = await QRCode.find({
        status: 'claimed',
        expiresAt: { $gte: now, $lte: in30Days },
        notifiedAt: null,
      })
        .populate('product', 'name modelNumber')
        .populate('claimedBy', 'name email');

      console.log(`[ExpiryNotifier] Found ${expiring.length} warranties expiring soon`);

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

          console.log(`[ExpiryNotifier] Notified ${code.claimedBy.email} for ${code.product.name}`);
        } catch (emailErr) {
          console.error(`[ExpiryNotifier] Failed to notify ${code.claimedBy.email}:`, emailErr.message);
        }
      }

      console.log('[ExpiryNotifier] Done.');
    } catch (err) {
      console.error('[ExpiryNotifier] Job error:', err.message);
    }
  });

  console.log('[ExpiryNotifier] Scheduled — runs daily at 9:00 AM');
};
