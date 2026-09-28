/**
 * Zero-overhead HTTP Security Headers Middleware
 * Protects against XSS, clickjacking, MIME sniffing, and enforces modern CSP.
 */
export function securityHeaders(req, res, next) {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent Clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Modern Cross-Site Scripting filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // HTTP Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Privacy & Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict sensitive device APIs
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://fonts.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' http://localhost:* ws://localhost:* https://teachablemachine.withgoogle.com https://cdn.jsdelivr.net",
      "frame-ancestors 'self'"
    ].join('; ')
  );

  next();
}
