import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { getEnv } from '../config/env.js';

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, getEnv('JWT_SECRET'));
  req.user = await User.findById(decoded.id).select('-password');

  if (!req.user) {
    return res.status(401).json({ message: 'User no longer exists' });
  }

  next();
};

export const restrictTo = (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
