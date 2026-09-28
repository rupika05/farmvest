// FarmVest Cryptographic Provenance Ledger
// SHA-256 Hash-Chained Local Ledger (NOT a decentralized public blockchain)
// Ready for future upgrade to Hyperledger Fabric or Polygon PoS

const LEDGER_KEY = 'farmvest_ledger_v4';

// SHA-256 hash using Web Crypto API (returns hex string)
async function sha256(data) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(typeof data === 'string' ? data : JSON.stringify(data));
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export class BlockchainService {
  constructor() {
    this.networkName = 'FarmVest Private Hash-Chain Ledger (Local)';
    this.blocks = this._loadFromStorage();
    if (this.blocks.length === 0) {
      this._initGenesis();
    }
  }

  _loadFromStorage() {
    try {
      const saved = localStorage.getItem(LEDGER_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  _saveToStorage() {
    try {
      localStorage.setItem(LEDGER_KEY, JSON.stringify(this.blocks));
    } catch (e) {
      console.warn('Ledger storage failed:', e);
    }
  }

  _initGenesis() {
    // Synchronous genesis block (hash computed lazily for display)
    const genesis = {
      blockIndex: 0,
      timestamp: '2026-09-01T00:00:00.000Z',
      hash: '0000000000000000000000000000000000000000000000000000000000000000',
      previousHash: 'GENESIS',
      event: 'FarmVestLedgerInitialized',
      batchId: null,
      details: 'FarmVest Fair Trade Supply-Chain Provenance Ledger initialized',
      status: 'Confirmed',
      actor: 'System'
    };
    this.blocks.push(genesis);
    this._saveToStorage();
  }

  // Record a new ledger block (async due to SHA-256)
  async recordBlock(eventType, batchId, payload, actor = 'System') {
    const lastBlock = this.blocks[this.blocks.length - 1];
    const blockData = {
      blockIndex: lastBlock ? lastBlock.blockIndex + 1 : 1,
      timestamp: new Date().toISOString(),
      event: eventType,
      batchId: batchId || null,
      details: typeof payload === 'string' ? payload : JSON.stringify(payload),
      actor,
      previousHash: lastBlock ? lastBlock.hash : 'GENESIS',
      status: 'Confirmed'
    };

    // Compute SHA-256 hash of block content
    const hashInput = `${blockData.blockIndex}|${blockData.timestamp}|${blockData.event}|${blockData.batchId}|${blockData.details}|${blockData.previousHash}`;
    blockData.hash = await sha256(hashInput);

    this.blocks.push(blockData);
    this._saveToStorage();
    return blockData;
  }

  // Synchronous version for non-async contexts (uses timestamp-based pseudo-hash)
  recordTransaction(eventType, payload, batchId = null, actor = 'System') {
    const lastBlock = this.blocks[this.blocks.length - 1];
    const blockData = {
      blockIndex: lastBlock ? lastBlock.blockIndex + 1 : 1,
      timestamp: new Date().toISOString(),
      event: eventType,
      batchId: batchId || null,
      details: typeof payload === 'string' ? payload : JSON.stringify(payload),
      actor,
      previousHash: lastBlock ? lastBlock.hash : 'GENESIS',
      status: 'Confirmed',
      // pseudo-hash for sync context — will be re-confirmed async
      hash: this._pseudoHash(`${Date.now()}|${eventType}|${JSON.stringify(payload)}|${lastBlock?.hash || 'GENESIS'}`)
    };
    blockData.txHash = blockData.hash; // compat alias

    this.blocks.push(blockData);
    this._saveToStorage();

    // Fire-and-forget: recompute with real SHA-256
    const idx = this.blocks.length - 1;
    const hashInput = `${blockData.blockIndex}|${blockData.timestamp}|${blockData.event}|${blockData.batchId}|${blockData.details}|${blockData.previousHash}`;
    sha256(hashInput).then(realHash => {
      if (this.blocks[idx]) {
        this.blocks[idx].hash = realHash;
        this.blocks[idx].txHash = realHash;
        this._saveToStorage();
      }
    }).catch(() => {});

    return blockData;
  }

  _pseudoHash(input) {
    // Deterministic pseudo-hash for sync contexts (NOT cryptographically secure)
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = ((h << 5) - h) + input.charCodeAt(i);
      h |= 0;
    }
    const hex = Math.abs(h).toString(16).padStart(8, '0');
    return '0x' + hex.repeat(8).slice(0, 64);
  }

  // Get all blocks for a specific batch
  getBlocksForBatch(batchId) {
    return this.blocks.filter(b => b.batchId === batchId);
  }

  // Get recent transactions (all blocks, newest first)
  getRecentTransactions() {
    return [...this.blocks].reverse();
  }

  // Verify chain integrity — checks that each block's previousHash matches the previous block's hash
  verifyChainIntegrity() {
    const issues = [];
    for (let i = 1; i < this.blocks.length; i++) {
      const block = this.blocks[i];
      const prevBlock = this.blocks[i - 1];
      if (block.previousHash !== prevBlock.hash) {
        issues.push({
          blockIndex: block.blockIndex,
          expected: prevBlock.hash,
          found: block.previousHash,
          event: block.event
        });
      }
    }
    return {
      valid: issues.length === 0,
      totalBlocks: this.blocks.length,
      issues,
      verifiedAt: new Date().toISOString()
    };
  }

  // Clear the ledger (admin only)
  clearLedger() {
    this.blocks = [];
    this._initGenesis();
  }
}

export const blockchain = new BlockchainService();
