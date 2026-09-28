import zlib from 'zlib';

/**
 * Native Node.js HTTP Response Compression Middleware (Zero external dependencies)
 * Compresses JSON and text responses using Gzip or Deflate based on client Accept-Encoding.
 */
export function compression() {
  return function compressionMiddleware(req, res, next) {
    const acceptEncoding = req.headers['accept-encoding'] || '';

    // Only compress if client supports gzip or deflate
    if (!acceptEncoding.includes('gzip') && !acceptEncoding.includes('deflate')) {
      return next();
    }

    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    const compressAndSend = (body, isJson = false) => {
      // Don't re-compress if content-encoding is already set
      if (res.getHeader('Content-Encoding')) {
        return isJson ? originalJson(body) : originalSend(body);
      }

      const raw = typeof body === 'object' ? JSON.stringify(body) : String(body);
      const buffer = Buffer.from(raw, 'utf-8');

      // Skip compression for tiny payloads (< 512 bytes)
      if (buffer.length < 512) {
        if (isJson) res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return isJson ? originalJson(body) : originalSend(body);
      }

      if (acceptEncoding.includes('gzip')) {
        zlib.gzip(buffer, (err, compressed) => {
          if (err) {
            return isJson ? originalJson(body) : originalSend(body);
          }
          res.setHeader('Content-Encoding', 'gzip');
          res.setHeader('Vary', 'Accept-Encoding');
          if (isJson) res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Content-Length', compressed.length);
          res.end(compressed);
        });
      } else if (acceptEncoding.includes('deflate')) {
        zlib.deflate(buffer, (err, compressed) => {
          if (err) {
            return isJson ? originalJson(body) : originalSend(body);
          }
          res.setHeader('Content-Encoding', 'deflate');
          res.setHeader('Vary', 'Accept-Encoding');
          if (isJson) res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Content-Length', compressed.length);
          res.end(compressed);
        });
      } else {
        return isJson ? originalJson(body) : originalSend(body);
      }
    };

    res.json = (body) => compressAndSend(body, true);
    next();
  };
}
