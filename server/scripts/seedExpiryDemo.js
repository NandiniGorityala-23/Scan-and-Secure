/**
 * Seeds expiry demo data:
 * - Finds all claimed QR codes
 * - Sets expiresAt = 20 days from now (within 30-day notification window)
 * - Clears notifiedAt so the job (or manual trigger) will fire
 *
 * Run: node scripts/seedExpiryDemo.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import QRCode from '../src/models/QRCode.model.js';

await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to MongoDB');

const in20Days = new Date();
in20Days.setDate(in20Days.getDate() + 20);

const result = await QRCode.updateMany(
  { status: 'claimed' },
  { $set: { expiresAt: in20Days, notifiedAt: null } }
);

console.log(`Updated ${result.modifiedCount} claimed warranties -> expiresAt: ${in20Days.toDateString()}, notifiedAt: null`);
console.log('Now call POST /api/admin/trigger-expiry (admin token required) to send emails.');

await mongoose.disconnect();
