const buckets = new Map();

const getClientKey = (req) =>
  `${req.ip || req.socket?.remoteAddress || 'unknown'}:${req.originalUrl}`;

export const createRateLimit = ({
  windowMs = 15 * 60 * 1000,
  max = 20,
  message = 'Too many requests. Please try again later.',
} = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    const key = getClientKey(req);
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;

    if (bucket.count > max) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json({
        message,
        requestId: req.requestId,
      });
    }

    return next();
  };
};

