import crypto from 'crypto';

/**
 * Generates a deterministic SHA-256 hash for a block payload.
 * Sorts object keys recursively to ensure consistent serialization.
 * Excludes the 'hash' property itself.
 * 
 * @param {Object} blockData 
 * @returns {string} 64-character hex SHA-256 hash
 */
export function calculateBlockHash(blockData) {
  const { hash, ...canonicalPayload } = blockData;

  // Canonical sorting of keys for deterministic hashing
  const sortedString = JSON.stringify(canonicalPayload, Object.keys(canonicalPayload).sort());
  return crypto.createHash('sha256').update(sortedString).digest('hex');
}

/**
 * Creates the genesis block (Block 0) for a newly harvested crop batch.
 * 
 * @param {string} batchId 
 * @param {Object} payload 
 * @returns {Object} Genesis Block
 */
export function createGenesisBlock(batchId, payload = {}) {
  const block = {
    index: 0,
    batchId,
    timestamp: payload.timestamp || new Date().toISOString(),
    stage: payload.stage || 'FARM_HARVEST',
    owner: payload.owner || 'Farm Producer',
    location: payload.location || 'Farm Origin',
    crop: payload.crop || 'Produce',
    quantity: Number(payload.quantity) || 1,
    unit: payload.unit || 'kg',
    price: Number(payload.price) || 0,
    adjustedPrice: Number(payload.adjustedPrice ?? payload.price) || 0,
    qualityStatus: payload.qualityStatus || 'Fresh',
    damageConfidence: Number(payload.damageConfidence) || 0,
    discountApplied: Number(payload.discountApplied) || 0,
    notes: payload.notes || 'Batch harvested and registered on FarmChain AI ledger',
    previousHash: '0'.repeat(64),
    hash: ''
  };

  block.hash = calculateBlockHash(block);
  return block;
}

/**
 * Appends a new block to an existing chain upon ownership transfer or stage update.
 * 
 * @param {Array<Object>} chain 
 * @param {Object} payload 
 * @returns {Object} Appended Block
 */
export function appendTransferBlock(chain, payload) {
  if (!Array.isArray(chain) || chain.length === 0) {
    throw new Error('Cannot append to an empty or non-existent chain.');
  }

  const previousBlock = chain[chain.length - 1];
  const nextIndex = previousBlock.index + 1;
  const batchId = previousBlock.batchId;

  const currentPrice = Number(payload.price ?? previousBlock.adjustedPrice ?? previousBlock.price);
  const adjustedPrice = payload.adjustedPrice !== undefined ? Number(payload.adjustedPrice) : currentPrice;

  const block = {
    index: nextIndex,
    batchId,
    timestamp: payload.timestamp || new Date().toISOString(),
    stage: payload.stage || 'TRANSFER_IN_TRANSIT',
    owner: payload.owner || 'Custodian',
    location: payload.location || 'Distribution Hub',
    crop: previousBlock.crop,
    quantity: Number(payload.quantity ?? previousBlock.quantity),
    unit: previousBlock.unit,
    price: currentPrice,
    adjustedPrice: adjustedPrice,
    qualityStatus: payload.qualityStatus || previousBlock.qualityStatus || 'Standard',
    damageConfidence: Number(payload.damageConfidence ?? 0),
    discountApplied: Number(payload.discountApplied ?? 0),
    notes: payload.notes || `Transferred custody to ${payload.owner || 'Custodian'}`,
    previousHash: previousBlock.hash,
    hash: ''
  };

  block.hash = calculateBlockHash(block);
  return block;
}

/**
 * Validates the complete cryptographic integrity of a hash-chain.
 * Verifies both internal block SHA-256 hashes and inter-block previousHash linkages.
 * 
 * @param {Array<Object>} chain 
 * @returns {{ valid: boolean, brokenAtIndex?: number, error?: string, blockCount: number }}
 */
export function verifyChain(chain) {
  if (!Array.isArray(chain) || chain.length === 0) {
    return { valid: false, blockCount: 0, error: 'Ledger chain is empty or invalid.' };
  }

  // Verify genesis block
  const genesis = chain[0];
  if (genesis.index !== 0) {
    return {
      valid: false,
      brokenAtIndex: 0,
      blockCount: chain.length,
      error: `Genesis block index must be 0, found ${genesis.index}`
    };
  }

  const genesisHash = calculateBlockHash(genesis);
  if (genesisHash !== genesis.hash) {
    return {
      valid: false,
      brokenAtIndex: 0,
      blockCount: chain.length,
      error: `Genesis block tampering detected! Stored hash: ${genesis.hash}, computed: ${genesisHash}`
    };
  }

  // Verify sequential blocks
  for (let i = 1; i < chain.length; i++) {
    const currentBlock = chain[i];
    const previousBlock = chain[i - 1];

    if (currentBlock.index !== i) {
      return {
        valid: false,
        brokenAtIndex: i,
        blockCount: chain.length,
        error: `Block index sequence mismatch at position ${i}. Expected ${i}, found ${currentBlock.index}`
      };
    }

    // Check linkage
    if (currentBlock.previousHash !== previousBlock.hash) {
      return {
        valid: false,
        brokenAtIndex: i,
        blockCount: chain.length,
        error: `Cryptographic link broken at Block ${i}! previousHash (${currentBlock.previousHash.slice(0, 10)}...) does not match Block ${i - 1} hash (${previousBlock.hash.slice(0, 10)}...)`
      };
    }

    // Check block hash recalculation
    const calculatedHash = calculateBlockHash(currentBlock);
    if (calculatedHash !== currentBlock.hash) {
      return {
        valid: false,
        brokenAtIndex: i,
        blockCount: chain.length,
        error: `Data tampering detected in Block ${i}! Block data was altered. Stored hash: ${currentBlock.hash.slice(0, 10)}..., computed: ${calculatedHash.slice(0, 10)}...`
      };
    }
  }

  return {
    valid: true,
    blockCount: chain.length,
    latestHash: chain[chain.length - 1].hash
  };
}
