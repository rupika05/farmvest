import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import batchRoutes from './routes/batchRoutes.js';
import priceRoutes from './services/priceSuggestion/routes.js';
import authRoutes from './services/authService/routes.js';
import { securityHeaders } from './middleware/security.js';
import { compression } from './middleware/compression.js';
import { createRateLimiter } from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BATCHES_FILE = path.resolve(__dirname, 'data/batches.json');
const FRONTEND_DIST = path.resolve(__dirname, '../frontend/dist');

const app = express();
const PORT = process.env.PORT || 5001;

// Operational telemetry counters
let totalRequests = 0;
let apiErrors = 0;

// 1. Security & Infrastructure Middlewares
app.use(securityHeaders);
app.use(compression());

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Encoding']
}));

app.use(express.json({ limit: '5mb' }));

// Request telemetry logger
app.use((req, res, next) => {
  totalRequests++;
  const start = Date.now();
  res.on('finish', () => {
    if (res.statusCode >= 500) apiErrors++;
  });
  next();
});

// Rate limiters for sensitive endpoints
const authLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts. Please try again shortly.'
});

const batchLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Rate limit exceeded for batch operations.'
});

// 2. Health & Observability Endpoints
app.get('/api/health', (req, res) => {
  const memUsage = process.memoryUsage();
  let batchCount = 0;
  try {
    if (fs.existsSync(BATCHES_FILE)) {
      const data = JSON.parse(fs.readFileSync(BATCHES_FILE, 'utf-8') || '{}');
      batchCount = Object.keys(data).length;
    }
  } catch (e) {
    // non-fatal
  }

  res.json({
    status: 'ok',
    service: 'FarmChain AI Ledger & Market API',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    activeBatches: batchCount,
    memory: {
      rssMb: parseFloat((memUsage.rss / 1024 / 1024).toFixed(2)),
      heapUsedMb: parseFloat((memUsage.heapUsed / 1024 / 1024).toFixed(2))
    }
  });
});

app.get('/api/metrics', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    success: true,
    telemetry: {
      uptimeSeconds: Math.floor(process.uptime()),
      totalRequests,
      apiErrors,
      errorRate: totalRequests > 0 ? ((apiErrors / totalRequests) * 100).toFixed(2) + '%' : '0%',
      memory: {
        rssMb: (memUsage.rss / 1024 / 1024).toFixed(2),
        heapTotalMb: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
        heapUsedMb: (memUsage.heapUsed / 1024 / 1024).toFixed(2)
      }
    }
  });
});

// 3. API Routes with Caching Policies
app.use('/api/auth', authLimiter, authRoutes);
app.use('/auth', authLimiter, authRoutes);

// Price Suggestion: Cache-friendly static benchmark data
app.use('/api/price-suggestion', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=180, stale-while-revalidate=360');
  next();
}, priceRoutes);
app.use('/price-suggestion', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=180, stale-while-revalidate=360');
  next();
}, priceRoutes);

// Batches & Ledger: Dynamic transaction routes with no-cache guarantees
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
}, batchLimiter, batchRoutes);
app.use('/', (req, res, next) => {
  // Let static serving take non-API routes when configured
  if (req.path.startsWith('/batch') || req.path === '/batches') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return batchLimiter(req, res, () => batchRoutes(req, res, next));
  }
  next();
});

// 4. Production Static File & SPA Serving
if (process.env.NODE_ENV === 'production' || process.env.SERVE_STATIC === 'true' || fs.existsSync(FRONTEND_DIST)) {
  if (fs.existsSync(FRONTEND_DIST)) {
    // Immutable cached static assets
    app.use('/assets', express.static(path.join(FRONTEND_DIST, 'assets'), {
      maxAge: '1y',
      immutable: true
    }));

    // Root public assets (robots.txt, sitemap.xml, manifest.json, favicon)
    app.use(express.static(FRONTEND_DIST, {
      maxAge: '1d'
    }));

    // SPA fallback: Return index.html for client-side routing on unhandled non-API paths
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/price-suggestion')) {
        return next();
      }
      res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    });
  }
}

// 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`🌾 FarmChain AI Backend & Ledger running on http://localhost:${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log(`📊 Metrics: http://localhost:${PORT}/api/metrics`);
  console.log(`📈 Price suggestion: http://localhost:${PORT}/api/price-suggestion/strawberries`);
  console.log(`📦 Batches API: http://localhost:${PORT}/api/batches`);
});

// Graceful Shutdown Handlers
let isShuttingDown = false;
const handleShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down FarmChain AI server...`);

  server.close(() => {
    console.log('✅ FarmChain AI HTTP server terminated cleanly.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('⚠️ Forcefully terminating after timeout');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
