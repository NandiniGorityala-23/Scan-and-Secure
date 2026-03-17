import { Router } from 'express';
import { getClaimInfo, activateClaim, downloadCertificate, getMyWarranties } from '../controllers/claim.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = Router();

// Customer warranties list
router.get('/my/warranties', protect, restrictTo('customer'), getMyWarranties);

// Public — anyone with the URL can view product info
router.get('/:uuid', getClaimInfo);

// Customer auth required for these
router.post('/:uuid/activate', protect, restrictTo('customer'), activateClaim);
router.get('/:uuid/certificate', protect, restrictTo('customer'), downloadCertificate);

export default router;
