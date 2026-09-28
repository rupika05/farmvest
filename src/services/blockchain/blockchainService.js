// Blockchain Ledger & Smart Contract Abstraction
// Simulated Polygon Amoy Testnet & Chainlink Oracle for Agricultural Traceability

export class BlockchainService {
  constructor() {
    this.networkName = 'Polygon Amoy Proof-of-Stake Testnet (Chain ID 80002)';
    this.contractAddress = '0x8f3c75B71e6211eB85635C7A2870197b1A14cD29';
    this.blocks = [
      {
        blockNumber: 18492038,
        timestamp: '2026-09-21T08:15:00Z',
        hash: '0x3a7e9f12bc56de7890abcdef1234567890abcdef1234567890abcdef12345678',
        previousHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        event: 'ContractInitialized',
        details: 'FarmVest Fair Trade Escrow & Master QR Registry deployed',
        gasUsed: '142,850 Gwei'
      }
    ];
  }

  generateHash() {
    const chars = '0123456789abcdef';
    let result = '0x';
    for (let i = 0; i < 64; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  recordTransaction(eventType, payload) {
    const lastBlock = this.blocks[this.blocks.length - 1];
    const newBlockNumber = lastBlock ? lastBlock.blockNumber + 1 : 18492039;
    const txHash = this.generateHash();
    
    const record = {
      blockNumber: newBlockNumber,
      txHash,
      timestamp: new Date().toISOString(),
      event: eventType,
      payload,
      network: 'Polygon PoS Testnet (Simulated)',
      status: 'Confirmed (64 Block Confirmations)',
      gasFee: '0.0024 MATIC',
      gasPrice: '32.5 Gwei'
    };

    this.blocks.push({
      blockNumber: newBlockNumber,
      timestamp: record.timestamp,
      hash: txHash,
      previousHash: lastBlock ? lastBlock.hash : '0x0000',
      event: eventType,
      details: typeof payload === 'string' ? payload : JSON.stringify(payload),
      gasUsed: '135,210 Gwei'
    });

    return record;
  }

  getRecentTransactions() {
    return [...this.blocks].reverse();
  }
}

export const blockchain = new BlockchainService();
