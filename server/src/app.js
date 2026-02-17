import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import qrcodeRoutes from './routes/qrcode.routes.js';
import claimRoutes from './routes/claim.routes.js';
import adminRoutes from './routes/admin.routes.js';
import errorHandler from './middleware/error.middleware.js';
import requestContext from './middleware/requestContext.middleware.js';
import { startExpiryNotifier } from './jobs/expiryNotifier.job.js';
import { getEnv, validateEnv } from './config/env.js';

const app = express();
const startedAt = new Date().toISOString();

app.use(helmet());
app.use(
  cors({
    origin: [
      getEnv('ADMIN_APP_URL', 'http://localhost:5174'),
      getEnv('CUSTOMER_APP_URL', 'http://localhost:5173'),
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(requestContext);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'omniwarranty-server',
    startedAt,
    requestId: req.requestId,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/qrcodes', qrcodeRoutes);
app.use('/api/claim', claimRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

const PORT = getEnv('PORT', 5000);

validateEnv();

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    startExpiryNotifier();
  })
  .catch((err) => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });
