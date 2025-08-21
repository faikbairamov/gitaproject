const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '30', 10);

const hits = new Map();

module.exports = (req, res, next) => {
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
    return res.status(429).json({ error: 'RateLimited', message: 'Too many requests' });
  }
  next();
};
