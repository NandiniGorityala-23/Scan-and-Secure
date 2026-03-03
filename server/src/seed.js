import 'dotenv/config';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import User from './models/User.model.js';
import Product from './models/Product.model.js';
import QRCode from './models/QRCode.model.js';

const CUSTOMER_APP_URL = process.env.CUSTOMER_APP_URL || 'http://localhost:5173';

const products = [
  {
    name: 'Samsung Galaxy S24 Ultra',
    modelNumber: 'SM-S928B',
    category: 'Electronics',
    specifications: '12GB RAM, 256GB Storage, 200MP Camera, Titanium Frame',
    warrantyDurationMonths: 24,
    images: [
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80',
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80',
    ],
  },
  {
    name: 'LG WashTower Washer-Dryer',
    modelNumber: 'WKEX200HBA',
    category: 'Appliances',
    specifications: '5.0 Cu.Ft Washer, 7.4 Cu.Ft Dryer, AI Sensor, Steam',
    warrantyDurationMonths: 36,
    images: [
      'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&q=80',
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    ],
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    modelNumber: 'WH1000XM5/B',
    category: 'Electronics',
    specifications: '30hr Battery, Industry-Leading ANC, LDAC Hi-Res Audio',
    warrantyDurationMonths: 12,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80',
    ],
  },
  {
    name: 'Dyson V15 Detect Cordless Vacuum',
    modelNumber: 'V15-DETECT',
    category: 'Appliances',
    specifications: '60-min Runtime, Laser Dust Detection, HEPA Filtration',
    warrantyDurationMonths: 24,
    images: [
      'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&q=80',
      'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80',
      'https://images.unsplash.com/photo-1603548674912-cd36e2f2b0e9?w=400&q=80',
    ],
  },
  {
    name: 'DeWalt 20V MAX Drill Combo Kit',
    modelNumber: 'DCK240C2',
    category: 'Tools',
    specifications: '1.5Ah Batteries, 2-Speed Drill Driver, Impact Driver',
    warrantyDurationMonths: 36,
    images: [
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80',
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&q=80',
      'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400&q=80',
    ],
  },
];

const qrBatches = [50, 30, 20, 25, 15];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing seed data
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    QRCode.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // Admin user
  const admin = await User.create({
    name: 'Nandini Goriyala',
    email: 'admin@omniwarranty.com',
    password: 'password123',
    role: 'admin',
  });
  console.log(`Admin created: ${admin.email}`);

  // Customer user
  const customer = await User.create({
    name: 'Alex Johnson',
    email: 'customer@example.com',
    password: 'password123',
    role: 'customer',
  });
  console.log(`Customer created: ${customer.email}`);

  // Products linked to admin
  const createdProducts = await Product.insertMany(
    products.map((p) => ({ ...p, manufacturer: admin._id }))
  );
  console.log(`${createdProducts.length} products created`);

  // QR codes per product
  let totalQR = 0;
  for (let i = 0; i < createdProducts.length; i++) {
    const product = createdProducts[i];
    const count = qrBatches[i];
    const codes = [];

    for (let j = 0; j < count; j++) {
      const uuid = uuidv4();
      codes.push({
        uuid,
        claimUrl: `${CUSTOMER_APP_URL}/claim/${uuid}`,
        product: product._id,
        status: j < Math.floor(count * 0.3) ? 'claimed' : 'unclaimed',
        claimedBy: j < Math.floor(count * 0.3) ? customer._id : null,
        claimedAt: j < Math.floor(count * 0.3) ? new Date() : null,
      });
    }

    await QRCode.insertMany(codes);
    totalQR += count;
    console.log(`  ${product.name}: ${count} QR codes (${Math.floor(count * 0.3)} claimed)`);
  }

  console.log(`\nSeed complete!`);
  console.log(`  Total QR codes: ${totalQR}`);
  console.log(`\nLogin credentials:`);
  console.log(`  Admin  → admin@omniwarranty.com / password123`);
  console.log(`  Customer → customer@example.com / password123`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
