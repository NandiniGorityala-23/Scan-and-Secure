import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.model.js';
import Product from './models/Product.model.js';

const newProducts = [
  // Electronics
  {
    name: 'Apple MacBook Pro 14"', modelNumber: 'MBP14-M3-2024', category: 'Electronics',
    specifications: 'M3 Pro Chip, 18GB RAM, 512GB SSD, Liquid Retina XDR', warrantyDurationMonths: 12,
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
      'https://images.unsplash.com/photo-1611186871525-8b44219a01e4?w=400&q=80',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80',
    ],
  },
  {
    name: 'Apple iPad Air 11"', modelNumber: 'MUWC3LL/A', category: 'Electronics',
    specifications: 'M2 Chip, 256GB, Wi-Fi + Cellular, Starlight', warrantyDurationMonths: 12,
    images: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80',
      'https://images.unsplash.com/photo-1587756096614-c0c31aaae374?w=400&q=80',
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=400&q=80',
    ],
  },
  {
    name: 'LG OLED 65" 4K TV', modelNumber: 'OLED65C4PSA', category: 'Electronics',
    specifications: '65", OLED evo, 4K, 120Hz, Dolby Vision, webOS 24', warrantyDurationMonths: 24,
    images: [
      'https://images.unsplash.com/photo-1593359677879-a4bb92f4834c?w=400&q=80',
      'https://images.unsplash.com/photo-1571415060716-baff5f717c37?w=400&q=80',
      'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=400&q=80',
    ],
  },
  {
    name: 'Bose SoundLink Max Speaker', modelNumber: 'SLM-BLACK', category: 'Electronics',
    specifications: 'IP67, 20hr Battery, Bluetooth 5.3, USB-C', warrantyDurationMonths: 12,
    images: [
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80',
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    ],
  },
  {
    name: 'GoPro HERO 13 Black', modelNumber: 'CHDHX-131', category: 'Electronics',
    specifications: '5.3K60, HyperSmooth 7.0, 27MP Photo, Waterproof to 10m', warrantyDurationMonths: 12,
    images: [
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&q=80',
      'https://images.unsplash.com/photo-1614470098555-8f2d73b3e7ae?w=400&q=80',
      'https://images.unsplash.com/photo-1548438294-1ad5d5f4f063?w=400&q=80',
    ],
  },
  {
    name: 'Logitech MX Master 3S', modelNumber: 'MX-MASTER-3S', category: 'Electronics',
    specifications: '8000 DPI, Quiet Clicks, USB-C, Multi-Device, Ergo', warrantyDurationMonths: 24,
    images: [
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80',
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&q=80',
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80',
    ],
  },

  // Appliances
  {
    name: 'Breville Barista Express', modelNumber: 'BES870XL', category: 'Appliances',
    specifications: '15-bar Pump, Built-in Grinder, PID Temp Control, 67oz Tank', warrantyDurationMonths: 24,
    images: [
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80',
    ],
  },
  {
    name: 'Instant Pot Duo 7-in-1', modelNumber: 'IP-DUO80', category: 'Appliances',
    specifications: '8Qt, 7-in-1 Multi-Use, 13 Smart Programs, Up to 70% faster', warrantyDurationMonths: 12,
    images: [
      'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80',
      'https://images.unsplash.com/photo-1574484284002-952d92a03a05?w=400&q=80',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80',
    ],
  },
  {
    name: 'Shark AI Robot Vacuum', modelNumber: 'AV2001WD', category: 'Appliances',
    specifications: 'HEPA Filter, Wi-Fi, Home Mapping, Self-Empty Base, 60-day Capacity', warrantyDurationMonths: 24,
    images: [
      'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=400&q=80',
      'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80',
      'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&q=80',
    ],
  },
  {
    name: 'Whirlpool French Door Refrigerator', modelNumber: 'WRF555SDFZ', category: 'Appliances',
    specifications: '25 Cu.Ft, Fingerprint Resistant, LED Lighting, Ice & Water', warrantyDurationMonths: 12,
    images: [
      'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80',
      'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&q=80',
      'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&q=80',
    ],
  },

  // Automotive
  {
    name: 'NOCO Boost Plus Jump Starter', modelNumber: 'GB40', category: 'Automotive',
    specifications: '1000A, 12V UltraSafe, Up to 6.0L Gas / 3.0L Diesel Engines', warrantyDurationMonths: 12,
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
      'https://images.unsplash.com/photo-1504222490345-c075b7b7bf5d?w=400&q=80',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400&q=80',
    ],
  },
  {
    name: 'Garmin DriveSmart 76 GPS', modelNumber: 'DriveSmart-76-MT-S', category: 'Automotive',
    specifications: '7" Display, Live Traffic, Speed Cameras, Bright Sunlight Readable', warrantyDurationMonths: 12,
    images: [
      'https://images.unsplash.com/photo-1600861194942-f883de0dfe96?w=400&q=80',
      'https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?w=400&q=80',
      'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=400&q=80',
    ],
  },

  // Tools
  {
    name: 'Milwaukee M18 FUEL Circular Saw', modelNumber: '2732-21', category: 'Tools',
    specifications: '7-1/4", 5,000 RPM, 6-1/2" Depth of Cut, M18 REDLITHIUM', warrantyDurationMonths: 60,
    images: [
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&q=80',
      'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400&q=80',
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80',
    ],
  },
  {
    name: 'Makita 18V LXT Combo Kit', modelNumber: 'XT269M', category: 'Tools',
    specifications: '2-Pc Combo: Drill-Driver + Impact Driver, (2) 4.0Ah Batteries', warrantyDurationMonths: 36,
    images: [
      'https://images.unsplash.com/photo-1609010697446-11f2155278f0?w=400&q=80',
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80',
      'https://images.unsplash.com/photo-1567361672830-f7aa558d9f5e?w=400&q=80',
    ],
  },

  // Furniture
  {
    name: 'Herman Miller Aeron Chair', modelNumber: 'AER1B23DWALP', category: 'Furniture',
    specifications: 'Size B (Medium), PostureFit SL, Graphite Frame, Tilt Limiter', warrantyDurationMonths: 144,
    images: [
      'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&q=80',
      'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&q=80',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
    ],
  },
  {
    name: 'IKEA BEKANT Standing Desk', modelNumber: 'BEKANT-160x80', category: 'Furniture',
    specifications: '160x80cm, Electric Height Adjustable, 70–120 cm Height Range', warrantyDurationMonths: 60,
    images: [
      'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80',
      'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400&q=80',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&q=80',
    ],
  },
];

async function addProducts() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.error('No admin user found. Run the seed script first.');
    process.exit(1);
  }

  const toInsert = newProducts.map((p) => ({ ...p, manufacturer: admin._id }));
  const inserted = await Product.insertMany(toInsert, { ordered: false });

  console.log(`Added ${inserted.length} products for admin: ${admin.email}\n`);
  inserted.forEach((p) => console.log(`  [${p.category}] ${p.name} — ${p.modelNumber}`));

  await mongoose.disconnect();
}

addProducts().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
