import { randomUUID } from 'crypto';

const requestContext = (req, res, next) => {
  const requestId = req.get('x-request-id') || randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  next();
};

export default requestContext;

