import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { createRateLimit } from '../middleware/rateLimit.middleware.js';

const router = Router();
const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts. Please try again later.',
});

router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.get('/me', protect, getMe);

export default router;
