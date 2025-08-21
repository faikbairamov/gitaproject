import { Request, Response, NextFunction } from 'express';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '30', 10);

const hits = new Map<string, { count: number; start: number }>();

const rateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip;
  const now = Date.now();
  const entry = hits.get(ip) || { count: 0, start: now };

  if (now - entry.start > windowMs) {
    entry.count = 0;
    entry.start = now;
  }

  entry.count += 1;
  hits.set(ip, entry);

  if (entry.count > maxRequests) {
    res.status(429).json({ error: 'RateLimited', message: 'Too many requests' });
    return;
  }

  next();
};

export default rateLimit;
