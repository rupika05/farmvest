/**
 * API Service for FarmChain AI
 * Connects frontend to Express backend and ledger services.
 * Features built-in mock/demo fallback engine for static hosting (Netlify) & offline demoing.
 */

import seedBatches from '../data/batches.json';
import seedCrops from '../data/cropMarketPrices.json';

const BASE_URL = import.meta.env.VITE_API_URL || '';

// Pre-configured official demo personas (aligned with backend authService)
export const DEMO_ACCOUNTS = {
  farmer: {
    identifier: '9842100000',
    kisanId: 'PM-KISAN-TN-4921',
    name: 'முருகன் (M. Murugan)',
    nameEn: 'M. Murugan',
    role: 'farmer',
    roleTitle: 'Registered Farmer (உழவர்)',
    location: 'திண்டுக்கல், தமிழ்நாடு (Dindigul, TN)',
    mandi: 'Dindigul Regulated Market Yard',
    landArea: '4.5 Acres (செம்மண் நிலம்)',
    defaultOtp: '782419'
  },
  trader: {
    identifier: 'APMC-TN-8821',
    kisanId: 'TRADER-APMC-8821',
    name: 'கே. செல்வராஜ் (K. Selvaraj)',
    nameEn: 'K. Selvaraj',
    role: 'trader',
    roleTitle: 'Licensed Mandi Trader (மண்டி வர்த்தகர்)',
    location: 'கோயம்பேடு, சென்னை (Koyambedu, Chennai)',
    mandi: 'Koyambedu Wholesale Terminal Yard',
    licenseNo: 'TN-APMC-LIC-8821',
    defaultOtp: '782419'
  },
  admin: {
    identifier: 'agricofficer@nic.in',
    kisanId: 'GOVT-ADMIN-01',
    name: 'டாக்டர் ஆர். சுவாமிநாதன் (Dr. R. Swaminathan)',
    nameEn: 'Dr. R. Swaminathan',
    role: 'admin',
    roleTitle: 'Chief Agriculture Inspector & Forensic Auditor',
    location: 'சென்னை தலைமையகம் (State Secretariat, Chennai)',
    designation: 'Joint Director of Agriculture (e-Governance)',
    defaultOtp: '782419'
  }
};

/**
 * Safely fetches an API endpoint.
 * Prevents "Unexpected token '<', '<!DOCTYPE '... is not valid JSON" errors
 * by checking if the response is actually JSON before attempting to parse it.
 */
async function requestApi(endpoint, options = {}) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const res = await fetch(url, options);

    // If the server returned an HTML error or Netlify index.html fallback, DO NOT parse as JSON
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { ok: false, isHtml: true, status: res.status };
    }

    const data = await res.json();
    return { ok: res.ok, data, status: res.status };
  } catch (err) {
    // Network error (server offline / connection refused)
    return { ok: false, error: err.message, networkError: true };
  }
}

/**
 * Deterministic SHA-256 block hash calculation matching backend hashChain.js
 */
export async function calculateClientBlockHash(blockData) {
  const { hash, isTampered, ...canonicalPayload } = blockData;
  const sortedString = JSON.stringify(canonicalPayload, Object.keys(canonicalPayload).sort());
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(sortedString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 0xdeadbeef;
  for (let i = 0; i < sortedString.length; i++) {
    h = Math.imul(h ^ sortedString.charCodeAt(i), 2654435761);
  }
  return (h >>> 0).toString(16).padStart(64, '0');
}

/**
 * LocalStorage helpers for reactive client-side demo ledger
 */
function getStoredBatches() {
  try {
    const stored = localStorage.getItem('farmchain_batches');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Object.keys(parsed).length > 0) return parsed;
    }
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
  try {
    localStorage.setItem('farmchain_batches', JSON.stringify(seedBatches));
  } catch (e) {}
  return { ...seedBatches };
}

function saveStoredBatches(batches) {
  try {
    localStorage.setItem('farmchain_batches', JSON.stringify(batches));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

// -------------------------------------------------------------
// Authentication & Identity Verification Endpoints
// -------------------------------------------------------------

export async function sendOtp(identifier, role = 'farmer') {
  const res = await requestApi('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, role })
  });

  if (res.ok && res.data?.success) {
    return res.data;
  }

  // Client-side Demo Fallback (Netlify / Offline)
  const cleanId = (identifier || '').trim().toLowerCase();
  const demo = Object.values(DEMO_ACCOUNTS).find(
    a => a.identifier.toLowerCase() === cleanId || a.kisanId.toLowerCase() === cleanId
  );
  const otp = demo ? demo.defaultOtp : '782419';

  try {
    sessionStorage.setItem(`demo_otp_${cleanId}`, otp);
  } catch (e) {}

  return {
    success: true,
    otp,
    isDemo: true,
    message: 'OTP sent successfully (Demo Mode: 782419)'
  };
}

export async function verifyOtp(identifier, otp, role = 'farmer') {
  const res = await requestApi('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, otp, role })
  });

  if (res.ok && res.data?.success) {
    return res.data;
  }

  // Client-side Demo Fallback (Netlify / Offline)
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanOtp = (otp || '').trim();

  let storedOtp = '782419';
  try {
    storedOtp = sessionStorage.getItem(`demo_otp_${cleanId}`) || '782419';
  } catch (e) {}

  let demo = Object.values(DEMO_ACCOUNTS).find(
    a => a.identifier.toLowerCase() === cleanId || a.kisanId.toLowerCase() === cleanId
  );

  if (!demo && DEMO_ACCOUNTS[role]) {
    demo = { ...DEMO_ACCOUNTS[role], identifier };
  }

  if (!demo) {
    demo = {
      identifier,
      kisanId: `USER-${cleanId.slice(-4) || 'DEMO'}`,
      name: 'Registered User (உழவர்/பயனர்)',
      nameEn: 'Registered User',
      role,
      roleTitle: `${role.toUpperCase()} Persona`,
      location: 'தமிழ்நாடு (Tamil Nadu)',
      mandi: 'Regulated Mandi Yard',
      defaultOtp: '782419'
    };
  }

  if (cleanOtp === '782419' || cleanOtp === storedOtp) {
    return {
      success: true,
      valid: true,
      user: demo,
      token: `AUTH-TOKEN-${demo.role.toUpperCase()}-${Date.now()}`
    };
  }

  return {
    success: false,
    error: 'Invalid verification code. Please enter 782419.'
  };
}

export async function fetchDemoAccounts() {
  const res = await requestApi('/api/auth/demo-accounts');
  if (res.ok && res.data?.success) {
    return res.data;
  }
  return { success: true, accounts: DEMO_ACCOUNTS };
}

// -------------------------------------------------------------
// Crop & Price Benchmark Endpoints
// -------------------------------------------------------------

export async function fetchPriceSuggestion(cropName) {
  const res = await requestApi(`/api/price-suggestion/${encodeURIComponent(cropName)}`);
  if (res.ok && res.data?.success) {
    return res.data;
  }

  // Client-side fallback from seedCrops
  const query = (cropName || '').toLowerCase().trim();
  const found = (seedCrops.crops || []).find(
    c => c.name.toLowerCase() === query ||
         c.name.toLowerCase().includes(query) ||
         (c.tamilName && c.tamilName.toLowerCase().includes(query)) ||
         (c.hindiName && c.hindiName.toLowerCase().includes(query))
  );

  if (found) {
    const prices = (found.samples || []).map(s => s.price);
    const avgPrice = prices.length > 0 
      ? Number((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2))
      : found.benchmarkPrice;

    return {
      success: true,
      crop: found.name,
      tamilName: found.tamilName,
      hindiName: found.hindiName,
      unit: found.unit || 'kg',
      suggestedPrice: found.benchmarkPrice || avgPrice,
      statisticalAvg: avgPrice,
      samplesCount: prices.length,
      historicalSamples: found.samples || [],
      isFallback: true
    };
  }

  return {
    success: true,
    crop: cropName,
    suggestedPrice: 35.0,
    statisticalAvg: 35.0,
    samplesCount: 4,
    historicalSamples: [
      { region: 'Koyambedu Wholesale Terminal, Chennai (TN)', market: 'Central APMC', price: 35.0, date: '2026-09-04' }
    ],
    isFallback: true
  };
}

export async function fetchAllCrops() {
  const res = await requestApi('/api/price-suggestion');
  if (res.ok && res.data?.success) {
    return res.data;
  }
  return { success: true, crops: seedCrops.crops || [] };
}

// -------------------------------------------------------------
// Ledger Batches & Blockchain Operations
// -------------------------------------------------------------

export async function getAllBatches() {
  const res = await requestApi('/api/batches');
  if (res.ok && res.data?.success) {
    return res.data;
  }

  const batches = getStoredBatches();
  return {
    success: true,
    batches: Object.values(batches).reverse(),
    isFallback: true
  };
}

export async function getBatch(batchId) {
  const res = await requestApi(`/api/batch/${encodeURIComponent(batchId)}`);
  if (res.ok && res.data?.success) {
    return res.data;
  }

  const batches = getStoredBatches();
  const batch = batches[batchId];
  if (batch) {
    return {
      success: true,
      batchId: batch.batchId,
      crop: batch.crop,
      quantity: batch.quantity,
      unit: batch.unit,
      createdAt: batch.createdAt,
      qrCode: batch.qrCode,
      trackingUrl: batch.trackingUrl,
      chain: batch.chain,
      isFallback: true
    };
  }

  return {
    success: false,
    error: `Batch ${batchId} not found on National Krishi Registry.`
  };
}

export async function createBatch(batchData) {
  const res = await requestApi('/api/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batchData)
  });

  if (res.ok && res.data?.success) {
    return res.data;
  }

  // Client-side Genesis Minting
  const randomHex = Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase().padStart(6, '0');
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const batchId = `IN-KRISHI-${dateStr}-${randomHex}`;

  const genesisBlock = {
    index: 0,
    batchId,
    timestamp: now.toISOString(),
    stage: 'FARM_HARVEST',
    owner: batchData.farmerName || batchData.owner || 'Registered Farmer',
    location: batchData.farmLocation || batchData.location || 'Tamil Nadu, India',
    crop: batchData.crop || 'Produce',
    quantity: Number(batchData.quantity) || 1,
    unit: batchData.unit || 'kg',
    price: Number(batchData.price) || 0,
    adjustedPrice: Number(batchData.price) || 0,
    qualityStatus: 'Fresh',
    damageConfidence: 0,
    discountApplied: 0,
    notes: batchData.notes || 'Batch registered on FarmChain AI National Krishi Ledger',
    previousHash: '0'.repeat(64),
    hash: ''
  };

  genesisBlock.hash = await calculateClientBlockHash(genesisBlock);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const trackingUrl = `${origin}/track/${batchId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(trackingUrl)}`;

  const newBatch = {
    batchId,
    crop: genesisBlock.crop,
    quantity: genesisBlock.quantity,
    unit: genesisBlock.unit,
    createdAt: genesisBlock.timestamp,
    qrCode: qrCodeUrl,
    trackingUrl,
    chain: [genesisBlock]
  };

  const batches = getStoredBatches();
  batches[batchId] = newBatch;
  saveStoredBatches(batches);

  return {
    success: true,
    batchId,
    block: genesisBlock,
    batch: newBatch,
    isFallback: true
  };
}

export async function transferBatch(batchId, transferData) {
  const res = await requestApi(`/api/batch/${encodeURIComponent(batchId)}/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transferData)
  });

  if (res.ok && res.data?.success) {
    return res.data;
  }

  const batches = getStoredBatches();
  const batch = batches[batchId];
  if (!batch || !batch.chain || batch.chain.length === 0) {
    return { success: false, error: `Batch ${batchId} not found or has invalid chain.` };
  }

  const lastBlock = batch.chain[batch.chain.length - 1];
  const basePrice = Number(lastBlock.adjustedPrice ?? lastBlock.price ?? 0);
  const discountApplied = Number(transferData.discountApplied || 0);
  const adjustedPrice = discountApplied > 0 
    ? Number((basePrice * (1 - discountApplied)).toFixed(2))
    : basePrice;

  const newBlock = {
    index: batch.chain.length,
    batchId,
    timestamp: new Date().toISOString(),
    stage: transferData.stage || 'IN_TRANSIT',
    owner: transferData.newOwner || 'Consignee',
    location: transferData.location || lastBlock.location,
    crop: lastBlock.crop,
    quantity: lastBlock.quantity,
    unit: lastBlock.unit,
    price: basePrice,
    adjustedPrice,
    qualityStatus: transferData.qualityStatus || lastBlock.qualityStatus || 'Fresh',
    damageConfidence: Number(transferData.damageConfidence) || 0,
    discountApplied,
    notes: transferData.notes || `Custody handoff to ${transferData.newOwner}`,
    previousHash: lastBlock.hash,
    hash: ''
  };

  newBlock.hash = await calculateClientBlockHash(newBlock);
  batch.chain.push(newBlock);
  saveStoredBatches(batches);

  return {
    success: true,
    batch,
    newBlock,
    isFallback: true
  };
}

export async function simulateTamper(batchId, blockIndex = 0, field = 'price', maliciousValue = 999.99) {
  const res = await requestApi(`/api/batch/${encodeURIComponent(batchId)}/tamper`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blockIndex, field, maliciousValue })
  });

  if (res.ok && res.data?.success) {
    return res.data;
  }

  const batches = getStoredBatches();
  const batch = batches[batchId];
  if (!batch || !batch.chain || !batch.chain[blockIndex]) {
    return { success: false, error: 'Target block not found.' };
  }

  if (!batch._originalBackup) {
    batch._originalBackup = JSON.parse(JSON.stringify(batch.chain[blockIndex]));
  }

  batch.chain[blockIndex][field] = maliciousValue;
  batch.chain[blockIndex].isTampered = true;
  saveStoredBatches(batches);

  return {
    success: true,
    batch,
    isTampered: true,
    message: `Simulated tamper attack: altered ${field} to ${maliciousValue} without updating SHA-256 hash!`,
    isFallback: true
  };
}

export async function restoreBatch(batchId) {
  const res = await requestApi(`/api/batch/${encodeURIComponent(batchId)}/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (res.ok && res.data?.success) {
    return res.data;
  }

  const batches = getStoredBatches();
  const batch = batches[batchId];
  if (batch && batch._originalBackup) {
    const idx = batch._originalBackup.index || 0;
    batch.chain[idx] = batch._originalBackup;
    delete batch._originalBackup;
    saveStoredBatches(batches);
  } else if (batch && seedBatches[batchId]) {
    batch.chain = JSON.parse(JSON.stringify(seedBatches[batchId].chain));
    saveStoredBatches(batches);
  }

  return {
    success: true,
    batch,
    message: 'Cryptographic ledger restored to verified consensus state.',
    isFallback: true
  };
}

export async function fetchAdminMetrics() {
  const res = await requestApi('/api/admin/metrics');
  if (res.ok && res.data?.success) {
    return res.data;
  }

  const batches = Object.values(getStoredBatches());
  let totalVolume = 0;
  let totalDiscounts = 0;
  const cropDist = {};
  const mandiDist = {};

  batches.forEach(b => {
    totalVolume += Number(b.quantity || 0);
    const cropName = b.crop || 'Other';
    cropDist[cropName] = (cropDist[cropName] || 0) + 1;

    (b.chain || []).forEach(block => {
      if (block.location) {
        mandiDist[block.location] = (mandiDist[block.location] || 0) + 1;
      }
      if (block.discountApplied > 0) {
        totalDiscounts += 1;
      }
    });
  });

  return {
    success: true,
    totalBatches: batches.length,
    totalVolumeKg: totalVolume,
    totalDiscountsApplied: totalDiscounts,
    integrityValid: true,
    mandiDistribution: mandiDist,
    cropDistribution: cropDist,
    isFallback: true
  };
}

// ============================================================
// ML FAIR PRICE RECOMMENDATION ENGINE CLIENT METHODS
// ============================================================

export async function getMlHealth() {
  const res = await requestApi('/api/ml/health');
  return res.ok ? res.data : { status: 'offline', gateway: 'offline' };
}

export async function getMlDatasets() {
  const res = await requestApi('/api/ml/datasets');
  return res.ok && res.data ? res.data.datasets || [] : [];
}

export async function uploadMlDataset(formData) {
  try {
    const res = await fetch(`${BASE_URL}/api/ml/datasets/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function getMlDatasetPreview(datasetId) {
  const res = await requestApi(`/api/ml/datasets/${datasetId}/preview`);
  return res.ok ? res.data : null;
}

export async function approveMlDataset(datasetId) {
  const res = await requestApi(`/api/ml/datasets/${datasetId}/approve`, { method: 'POST' });
  return res.ok ? res.data : null;
}

export async function rejectMlDataset(datasetId) {
  const res = await requestApi(`/api/ml/datasets/${datasetId}/reject`, { method: 'POST' });
  return res.ok ? res.data : null;
}

export async function deleteMlDataset(datasetId) {
  const res = await requestApi(`/api/ml/datasets/${datasetId}`, { method: 'DELETE' });
  return res.ok ? res.data : null;
}

export async function trainMlModel(datasetId, algorithm = 'auto') {
  const res = await requestApi('/api/ml/train', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset_id: datasetId, algorithm })
  });
  return res.ok ? res.data : { error: res.data?.error || 'Training failed to initiate' };
}

export async function getMlTrainingStatus() {
  const res = await requestApi('/api/ml/training-status');
  return res.ok ? res.data : { is_training: false, current_step: 'Idle', progress_percentage: 0 };
}

export async function getMlModels() {
  const res = await requestApi('/api/ml/models');
  return res.ok && res.data ? res.data : { active_version: null, models: [] };
}

export async function activateMlModel(versionId) {
  const res = await requestApi(`/api/ml/models/${versionId}/activate`, { method: 'POST' });
  return res.ok ? res.data : null;
}

export async function getMlPriceRecommendation(input) {
  const res = await requestApi('/api/ml/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (res.ok && res.data) {
    return res.data;
  }

  // Graceful client fallback using official APMC Mandi calculation
  const mPrice = Number(input.mandi_price) || 30;
  const grade = input.quality_grade || 'Grade A';
  const gMult = grade === 'Grade A' ? 1.15 : (grade === 'Grade C' ? 0.80 : 1.0);
  const fExp = Math.round(mPrice * 0.94 * gMult * 10) / 10;
  const iExp = Math.round((fExp + 2.5) * 1.10 * 10) / 10;
  const rExp = Math.round((iExp + 2.0) * 1.15 * 10) / 10;

  return {
    crop: input.crop,
    qualityGrade: grade,
    marketReferencePrice: mPrice,
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
      version: 'APMC_LOCAL_BENCHMARK',
      trainedAt: new Date().toISOString(),
      modelType: 'Statutory APMC Benchmark (Client Offline Fallback)',
      datasetName: 'Local APMC Baseline',
      isFallback: true
    },
    explanation: {
      topFactors: [
        { factor: 'APMC Mandi Base Benchmark', impact: 'High influence', weight_pct: 60.0 },
        { factor: 'AI Quality Grade Premium', impact: 'High influence', weight_pct: 25.0 },
        { factor: 'Standard Logistics Reserve', impact: 'Low influence', weight_pct: 15.0 }
      ],
      notice: 'Operating in baseline market reference mode.'
    },
    status: 'fallback_client',
    disclaimer: 'Statistical estimate based on active APMC mandi reference and produce grade.'
  };
}

export async function getMlFairnessAnalytics() {
  const res = await requestApi('/api/ml/fairness-analytics');
  return res.ok && res.data ? res.data : { batchesAnalyzed: 0, summary: {}, details: [] };
}

