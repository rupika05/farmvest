import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB max

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BATCHES_FILE = path.resolve(__dirname, '../data/batches.json');

// Helper to safely call Python ML Service
async function callMlService(endpoint, options = {}) {
  const url = `${ML_SERVICE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {})
      }
    });

    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return {
      ok: false,
      status: 503,
      error: `ML service offline or unreachable at ${ML_SERVICE_URL}: ${err.message}`
    };
  }
}

// 1. Health check
router.get('/health', async (req, res) => {
  const result = await callMlService('/health');
  if (!result.ok) {
    return res.status(503).json({
      status: 'offline',
      service: 'FarmChain AI ML Gateway',
      pythonMlService: 'offline',
      error: result.error || 'Python FastAPI ML service unreachable'
    });
  }
  return res.json({
    status: 'online',
    gateway: 'FarmChain AI Node.js Express Gateway',
    pythonService: result.data
  });
});

// 2. List Datasets
router.get('/datasets', async (req, res) => {
  const result = await callMlService('/datasets');
  if (!result.ok) {
    return res.status(result.status || 500).json({ error: result.error || 'Failed to list datasets' });
  }
  return res.json(result.data);
});

// 3. Upload Dataset (Multipart CSV)
router.post('/datasets/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file provided in upload request.' });
  }

  try {
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype || 'text/csv' });
    formData.append('file', blob, req.file.originalname);
    formData.append('name', req.body.name || req.file.originalname);
    formData.append('description', req.body.description || '');

    const result = await callMlService('/datasets/upload', {
      method: 'POST',
      body: formData
    });

    if (!result.ok) {
      return res.status(result.status || 500).json({ error: result.data?.detail || result.error || 'Upload failed' });
    }

    return res.json(result.data);
  } catch (err) {
    return res.status(500).json({ error: `Failed to forward upload: ${err.message}` });
  }
});

// 4. Preview Dataset
router.get('/datasets/:id/preview', async (req, res) => {
  const result = await callMlService(`/datasets/${req.params.id}/preview`);
  if (!result.ok) {
    return res.status(result.status || 500).json({ error: result.data?.detail || result.error || 'Preview failed' });
  }
  return res.json(result.data);
});

// 5. Approve Dataset
router.post('/datasets/:id/approve', async (req, res) => {
  const result = await callMlService(`/datasets/${req.params.id}/approve`, { method: 'POST' });
  if (!result.ok) {
    return res.status(result.status || 500).json({ error: result.data?.detail || result.error || 'Approval failed' });
  }
  return res.json(result.data);
});

// 6. Reject Dataset
router.post('/datasets/:id/reject', async (req, res) => {
  const result = await callMlService(`/datasets/${req.params.id}/reject`, { method: 'POST' });
  if (!result.ok) {
    return res.status(result.status || 500).json({ error: result.data?.detail || result.error || 'Rejection failed' });
  }
  return res.json(result.data);
});

// 7. Delete Dataset
router.delete('/datasets/:id', async (req, res) => {
  const result = await callMlService(`/datasets/${req.params.id}`, { method: 'DELETE' });
  if (!result.ok) {
    return res.status(result.status || 500).json({ error: result.data?.detail || result.error || 'Deletion failed' });
  }
  return res.json(result.data);
});

// 8. Trigger Training
router.post('/train', async (req, res) => {
  const result = await callMlService('/train', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body)
  });

  if (!result.ok) {
    return res.status(result.status || 500).json({ error: result.data?.detail || result.error || 'Training initiation failed' });
  }
  return res.json(result.data);
});

// 9. Training Status
router.get('/training-status', async (req, res) => {
  const result = await callMlService('/training-status');
  if (!result.ok) {
    return res.status(result.status || 500).json({ error: result.error || 'Could not fetch training status' });
  }
  return res.json(result.data);
});

// 10. List Models
router.get('/models', async (req, res) => {
  const result = await callMlService('/models');
  if (!result.ok) {
    return res.status(result.status || 500).json({ error: result.error || 'Could not fetch models' });
  }
  return res.json(result.data);
});

// 11. Activate Model
router.post('/models/:id/activate', async (req, res) => {
  const result = await callMlService(`/models/${req.params.id}/activate`, { method: 'POST' });
  if (!result.ok) {
    return res.status(result.status || 500).json({ error: result.data?.detail || result.error || 'Activation failed' });
  }
  return res.json(result.data);
});

// 12. Predict Fair Price Range
router.post('/predict', async (req, res) => {
  const result = await callMlService('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body)
  });

  if (!result.ok) {
    // Graceful Fallback if ML service is offline
    const crop = req.body.crop || 'Produce';
    const mandiPrice = Number(req.body.mandi_price) || 30.0;
    const grade = req.body.quality_grade || 'Grade A';
    const mult = grade === 'Grade A' ? 1.15 : (grade === 'Grade C' ? 0.80 : 1.0);

    const fExp = Math.round(mandiPrice * 0.94 * mult * 10) / 10;
    const iExp = Math.round((fExp + 2.5) * 1.10 * 10) / 10;
    const rExp = Math.round((iExp + 2.0) * 1.15 * 10) / 10;

    return res.json({
      crop,
      qualityGrade: grade,
      marketReferencePrice: mandiPrice,
      currency: 'INR',
      unit: 'kg',
      recommendations: {
        farmerToIntermediary: {
          lower: Math.round(fExp * 0.94 * 10) / 10,
          expected: fExp,
          upper: Math.round(fExp * 1.06 * 10) / 10
        },
        intermediaryToRetailer: {
          lower: Math.round(iExp * 0.95 * 10) / 10,
          expected: iExp,
          upper: Math.round(iExp * 1.06 * 10) / 10
        },
        retailerToConsumer: {
          lower: Math.round(rExp * 0.94 * 10) / 10,
          expected: rExp,
          upper: Math.round(rExp * 1.07 * 10) / 10
        }
      },
      model: {
        version: 'APMC_GATEWAY_FALLBACK',
        trainedAt: new Date().toISOString(),
        modelType: 'Standard APMC Benchmark (ML Service Offline)',
        datasetName: 'Local APMC Baseline',
        isFallback: true
      },
      explanation: {
        topFactors: [
          { factor: 'APMC Mandi Benchmark', impact: 'High influence', weight_pct: 60.0 },
          { factor: 'Quality Grade Multiplier', impact: 'High influence', weight_pct: 25.0 },
          { factor: 'Standard Logistics Estimate', impact: 'Low influence', weight_pct: 15.0 }
        ],
        offlineNotice: 'ML inference engine unreachable; displaying statutory APMC baseline benchmark.'
      },
      status: 'fallback_offline',
      disclaimer: 'ESTIMATE: Displaying statutory APMC benchmark. The ML microservice is initializing or offline.'
    });
  }

  return res.json(result.data);
});

// 13. Price Fairness Analytics (Recommended vs Actual)
router.get('/fairness-analytics', async (req, res) => {
  try {
    if (!fs.existsSync(BATCHES_FILE)) {
      return res.json({ batchesAnalyzed: 0, summary: {}, details: [] });
    }

    const batches = JSON.parse(fs.readFileSync(BATCHES_FILE, 'utf-8') || '{}');
    const details = [];
    let withinRangeCount = 0;
    let belowRangeCount = 0;
    let aboveRangeCount = 0;
    let totalAnalyzed = 0;

    for (const [id, batch] of Object.entries(batches)) {
      const lastBlock = batch.chain?.[batch.chain.length - 1];
      const actualPrice = batch.price || batch.nominalPrice || lastBlock?.adjustedPrice || lastBlock?.price;
      const rec = batch.mlRecommendation;

      if (rec && rec.expected && actualPrice) {
        totalAnalyzed++;
        const lower = rec.lower || (rec.expected * 0.95);
        const upper = rec.upper || (rec.expected * 1.05);

        let status = 'Within recommended range';
        if (actualPrice < lower) {
          status = 'Below recommended range';
          belowRangeCount++;
        } else if (actualPrice > upper) {
          status = 'Above recommended range';
          aboveRangeCount++;
        } else {
          withinRangeCount++;
        }

        const diff = Math.round((actualPrice - rec.expected) * 100) / 100;
        const pctDiff = Math.round(((actualPrice - rec.expected) / rec.expected) * 1000) / 10;

        details.push({
          batchId: id,
          crop: batch.crop,
          qualityGrade: batch.qualityGrade || 'Grade A',
          actualPrice,
          recommendedLower: lower,
          recommendedExpected: rec.expected,
          recommendedUpper: upper,
          difference: diff,
          percentageDifference: pctDiff,
          fairnessStatus: status,
          modelVersion: rec.modelVersion || 'v1.0'
        });
      }
    }

    return res.json({
      batchesAnalyzed: totalAnalyzed,
      summary: {
        withinRecommendedRangePct: totalAnalyzed > 0 ? Math.round((withinRangeCount / totalAnalyzed) * 100) : 100,
        belowRecommendedRangePct: totalAnalyzed > 0 ? Math.round((belowRangeCount / totalAnalyzed) * 100) : 0,
        aboveRecommendedRangePct: totalAnalyzed > 0 ? Math.round((aboveRangeCount / totalAnalyzed) * 100) : 0,
        withinRangeCount,
        belowRangeCount,
        aboveRangeCount
      },
      details
    });
  } catch (err) {
    return res.status(500).json({ error: `Analytics error: ${err.message}` });
  }
});

export default router;
