import { Router } from 'express';
import {
  generate,
  getStats,
  getBatches,
  exportBatchCSV,
  generatePDFFromCSV,
} from '../controllers/qrcode.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { uploadCSV } from '../middleware/upload.middleware.js';
import { validateObjectIdParam } from '../middleware/validateParams.middleware.js';

const router = Router();

router.use(protect, restrictTo('admin'));

router.post('/generate', generate);
router.get('/stats', getStats);
router.get('/batches', getBatches);
router.get('/batches/:batchId/export', validateObjectIdParam('batchId'), exportBatchCSV);
router.post('/pdf', uploadCSV.single('file'), generatePDFFromCSV);

export default router;
