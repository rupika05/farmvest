import express from 'express';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createGenesisBlock, appendTransferBlock, verifyChain } from '../ledger/hashChain.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../data/batches.json');

const router = express.Router();

function readBatches() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2));
      return {};
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (error) {
    console.error('Failed to read batches.json:', error.message);
    return {};
  }
}

function writeBatches(batches) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(batches, null, 2));
  } catch (error) {
    console.error('Failed to save to batches.json:', error.message);
    throw error;
  }
}

/**
 * GET /admin/metrics or /api/admin/metrics
 * In-depth administrative analytics and cryptographic ledger audit data
 */
router.get(['/admin/metrics', '/admin/stats'], (req, res) => {
  try {
    const batches = readBatches();
    const batchList = Object.values(batches);

    let totalQuantityKg = 0;
    let totalEconomicValueInr = 0;
    let totalBlocksMined = 0;
    let damagedBlockCount = 0;
    let totalDiscountInr = 0;
    let healthyChains = 0;
    let compromisedChains = 0;

    const mandiDistribution = {};
    const cropDistribution = {};

    batchList.forEach(item => {
      const chain = item.chain || [];
      totalBlocksMined += chain.length;

      const verification = verifyChain(chain);
      if (verification.valid) {
        healthyChains++;
      } else {
        compromisedChains++;
      }

      const genesis = chain[0] || {};
      const lastBlock = chain[chain.length - 1] || genesis;

      const qty = Number(item.quantity) || 100;
      const unit = (item.unit || 'kg').toLowerCase();
      const multiplier = unit.includes('quintal') ? 100 : (unit.includes('ton') ? 1000 : 1);
      const effectiveKg = qty * multiplier;
      totalQuantityKg += effectiveKg;

      const currentPrice = Number(lastBlock.adjustedPrice ?? lastBlock.price) || 0;
      totalEconomicValueInr += (currentPrice * effectiveKg);

      // Analyze defect frequency & discount relief across blocks
      chain.forEach(b => {
        if (b.qualityStatus === 'Damaged' || b.discountApplied > 0) {
          damagedBlockCount++;
          const nominal = Number(b.price) || 0;
          const adjusted = Number(b.adjustedPrice) || nominal;
          totalDiscountInr += Math.max(0, nominal - adjusted) * effectiveKg;
        }

        // Mandi / Location aggregation
        const loc = b.location || 'Central Mandi';
        mandiDistribution[loc] = (mandiDistribution[loc] || 0) + 1;
      });

      const cropKey = item.crop || 'Staple Produce';
      cropDistribution[cropKey] = (cropDistribution[cropKey] || 0) + 1;
    });

    const defectRatePercent = totalBlocksMined > 0 
      ? Math.round((damagedBlockCount / totalBlocksMined) * 1000) / 10 
      : 0;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      portalName: 'National Krishi Transparency & Provenance Registry (தேசிய உழவர் தளம்)',
      kpis: {
        totalBatches: batchList.length,
        totalTonnageMetricTonnes: Math.round((totalQuantityKg / 1000) * 100) / 100,
        totalEconomicValueLakhs: Math.round((totalEconomicValueInr / 100000) * 100) / 100,
        totalBlocksMined,
        damagedBlockCount,
        defectRatePercent,
        totalQualityMarkdownReliefInr: Math.round(totalDiscountInr),
        healthyChains,
        compromisedChains,
        cryptographicCompliancePercent: batchList.length > 0 
          ? Math.round((healthyChains / batchList.length) * 100) 
          : 100
      },
      mandiDistribution,
      cropDistribution
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /batches or /api/batches
 */
router.get(['/batches', '/batch'], (req, res) => {
  try {
    const batches = readBatches();
    const list = Object.values(batches).map(item => {
      const lastBlock = item.chain[item.chain.length - 1];
      const verification = verifyChain(item.chain);
      return {
        batchId: item.batchId,
        crop: item.crop,
        quantity: item.quantity,
        unit: item.unit,
        originFarmer: item.chain[0]?.owner,
        originLocation: item.chain[0]?.location,
        currentOwner: lastBlock?.owner,
        currentStage: lastBlock?.stage,
        currentPrice: lastBlock?.adjustedPrice ?? lastBlock?.price,
        qualityStatus: lastBlock?.qualityStatus,
        blockCount: item.chain.length,
        createdAt: item.createdAt,
        isValid: verification.valid
      };
    }).reverse();

    res.json({ success: true, count: list.length, batches: list });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /batch or /api/batch
 * Creates a new agricultural produce batch on the national ledger
 */
router.post(['/batch', '/batches'], async (req, res) => {
  try {
    const { 
      crop, 
      quantity, 
      unit = 'kg', 
      price, 
      owner, 
      location, 
      notes, 
      harvestDate,
      farmerAadhaarOrKisanId
    } = req.body;

    if (!crop || !price || !owner) {
      return res.status(400).json({
        success: false,
        error: 'Crop name, mandi price (₹), and farmer name are required.'
      });
    }

    // Generate Indian Krishi Batch ID: IN-KRISHI-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const batchId = `IN-KRISHI-${dateStr}-${randomHex}`;

    // Tracking QR code URL
    const trackingUrl = `http://localhost:5173/track/${batchId}`;
    const qrCode = await QRCode.toDataURL(trackingUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      scale: 8,
      color: {
        dark: '#002147', // Ashoka Deep Navy
        light: '#ffffff'
      }
    });

    // Create Genesis Block #0 (Kisan Harvest Gate)
    const genesisBlock = createGenesisBlock(batchId, {
      crop: crop.trim(),
      quantity: Number(quantity) || 100,
      unit: unit.trim() || 'kg',
      price: Number(price),
      owner: owner.trim(),
      location: (location || 'Mandi Farm Gate').trim(),
      stage: 'FARM_GATE_HARVEST',
      qualityStatus: 'Fresh',
      damageConfidence: 0.02,
      discountApplied: 0,
      notes: notes || `Farmer Harvest recorded by ${owner} [Kisan Registry]`
    });

    const chain = [genesisBlock];
    const verification = verifyChain(chain);

    const newBatchRecord = {
      batchId,
      crop: crop.trim(),
      quantity: Number(quantity) || 100,
      unit: unit.trim() || 'kg',
      farmerAadhaarOrKisanId: farmerAadhaarOrKisanId || 'KISAN-TN-2026',
      createdAt: new Date().toISOString(),
      qrCode,
      trackingUrl,
      chain
    };

    const batches = readBatches();
    batches[batchId] = newBatchRecord;
    writeBatches(batches);

    res.status(201).json({
      success: true,
      message: 'Produce batch registered on National Krishi Blockchain Ledger.',
      batchId,
      qrCode,
      trackingUrl,
      block: genesisBlock,
      chain,
      isValid: verification.valid
    });
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /batch/:id or /api/batch/:id
 */
router.get(['/batch/:id', '/batches/:id'], (req, res) => {
  try {
    const { id } = req.params;
    const batches = readBatches();
    const record = batches[id];

    if (!record) {
      return res.status(404).json({
        success: false,
        error: `Batch "${id}" was not found in National Krishi Registry.`
      });
    }

    const verification = verifyChain(record.chain);
    const lastBlock = record.chain[record.chain.length - 1];

    res.json({
      success: true,
      batchId: record.batchId,
      crop: record.crop,
      quantity: record.quantity,
      unit: record.unit,
      createdAt: record.createdAt,
      qrCode: record.qrCode,
      trackingUrl: record.trackingUrl,
      currentOwner: lastBlock.owner,
      currentLocation: lastBlock.location,
      currentStage: lastBlock.stage,
      currentPrice: lastBlock.adjustedPrice ?? lastBlock.price,
      nominalPrice: lastBlock.price,
      qualityStatus: lastBlock.qualityStatus,
      damageConfidence: lastBlock.damageConfidence,
      discountApplied: lastBlock.discountApplied,
      chain: record.chain,
      blockCount: record.chain.length,
      integrity: {
        isValid: verification.valid,
        brokenAtIndex: verification.brokenAtIndex ?? null,
        error: verification.error ?? null,
        latestHash: verification.latestHash ?? null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /batch/:id/transfer or /api/batch/:id/transfer
 */
router.post(['/batch/:id/transfer', '/batches/:id/transfer'], (req, res) => {
  try {
    const { id } = req.params;
    const batches = readBatches();
    const record = batches[id];

    if (!record) {
      return res.status(404).json({
        success: false,
        error: `Batch "${id}" not found.`
      });
    }

    const {
      stage,
      owner,
      location,
      price,
      adjustedPrice,
      qualityStatus,
      damageConfidence,
      discountApplied,
      notes
    } = req.body;

    if (!stage || !owner) {
      return res.status(400).json({
        success: false,
        error: 'Supply stage and custodian name are required for Mandi handoff.'
      });
    }

    // Verify existing chain
    const preVerification = verifyChain(record.chain);
    if (!preVerification.valid) {
      return res.status(409).json({
        success: false,
        error: 'Cannot append transfer: Preceding chain integrity has been compromised!',
        details: preVerification.error
      });
    }

    const newBlock = appendTransferBlock(record.chain, {
      stage,
      owner,
      location: location || 'APMC Yard',
      price,
      adjustedPrice,
      qualityStatus,
      damageConfidence,
      discountApplied,
      notes
    });

    record.chain.push(newBlock);
    writeBatches(batches);

    const postVerification = verifyChain(record.chain);

    res.status(201).json({
      success: true,
      message: 'Custody transfer sealed on National Krishi Ledger.',
      batchId: id,
      block: newBlock,
      chain: record.chain,
      isValid: postVerification.valid
    });
  } catch (error) {
    console.error('Error transferring batch:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /batch/:id/tamper
 */
router.post(['/batch/:id/tamper', '/batches/:id/tamper'], (req, res) => {
  try {
    const { id } = req.params;
    const { blockIndex = 0, field = 'price', maliciousValue = 999.00 } = req.body;

    const batches = readBatches();
    const record = batches[id];

    if (!record) return res.status(404).json({ success: false, error: 'Batch not found' });
    if (!record.chain[blockIndex]) return res.status(400).json({ success: false, error: `Block ${blockIndex} not found` });

    if (!record._unalteredBackup) {
      record._unalteredBackup = JSON.parse(JSON.stringify(record.chain));
    }

    record.chain[blockIndex][field] = maliciousValue;
    writeBatches(batches);

    const verification = verifyChain(record.chain);

    res.json({
      success: true,
      message: `Audit alert: Malicious alteration injected at Block #${blockIndex} (Field "${field}" changed to "${maliciousValue}").`,
      tamperedBlockIndex: blockIndex,
      integrity: {
        isValid: verification.valid,
        brokenAtIndex: verification.brokenAtIndex,
        error: verification.error
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /batch/:id/restore
 */
router.post(['/batch/:id/restore', '/batches/:id/restore'], (req, res) => {
  try {
    const { id } = req.params;
    const batches = readBatches();
    const record = batches[id];

    if (!record) return res.status(404).json({ success: false, error: 'Batch not found' });

    if (record._unalteredBackup) {
      record.chain = JSON.parse(JSON.stringify(record._unalteredBackup));
      delete record._unalteredBackup;
      writeBatches(batches);
    }

    const verification = verifyChain(record.chain);

    res.json({
      success: true,
      message: 'Ledger restored to verified state under government audit seal.',
      isValid: verification.valid
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
