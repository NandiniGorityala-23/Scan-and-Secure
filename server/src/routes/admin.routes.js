import { Router } from 'express';
import {
  getAnalytics,
  getClaims,
  previewExpiryNotifications,
  triggerExpiryNotifications,
} from '../controllers/admin.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect, restrictTo('admin'));

router.get('/analytics', getAnalytics);
router.get('/claims', getClaims);
router.get('/expiry-preview', previewExpiryNotifications);
router.post('/trigger-expiry', triggerExpiryNotifications);

export default router;
