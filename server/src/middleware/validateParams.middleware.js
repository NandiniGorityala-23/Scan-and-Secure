import mongoose from 'mongoose';

export const validateObjectIdParam = (paramName) => (req, res, next) => {
  const value = req.params[paramName];

  if (!mongoose.Types.ObjectId.isValid(value)) {
    return res.status(400).json({
      message: `Invalid ${paramName}`,
      requestId: req.requestId,
    });
  }

  return next();
};

