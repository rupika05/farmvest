/**
 * Sliding-Window In-Memory Rate Limiter Middleware
 * Protects endpoints from brute-force attacks and abuse without external Redis dependencies.
 */
export function createRateLimiter({
  windowMs = 60 * 1000,   // 1 minute window
  max = 60,                // max requests per window per IP
  message = 'Too many requests from this IP, please try again later.'
} = {}) {
  const requests = new Map(); // IP -> Array of timestamps

  // Periodically cleanup expired entries every 2 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of requests.entries()) {
      const valid = timestamps.filter(t => now - t < windowMs);
      if (valid.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, valid);
      }
    }
  }, 2 * 60 * 1000);

  // Unref interval so it doesn't prevent Node process termination
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return function rateLimiterMiddleware(req, res, next) {
    // Determine client IP (support reverse proxies via X-Forwarded-For)
    const clientIp = 
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      'unknown-ip';

    const now = Date.now();
    const timestamps = (requests.get(clientIp) || []).filter(t => now - t < windowMs);

    if (timestamps.length >= max) {
      const oldest = timestamps[0];
      const retryAfterSec = Math.ceil((windowMs - (now - oldest)) / 1000);

      res.setHeader('Retry-After', retryAfterSec);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil((oldest + windowMs) / 1000));

      return res.status(429).json({
        success: false,
        error: message,
        retryAfterSeconds: retryAfterSec
      });
    }

    timestamps.push(now);
    requests.set(clientIp, timestamps);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - timestamps.length));
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));

    next();
  };
}
