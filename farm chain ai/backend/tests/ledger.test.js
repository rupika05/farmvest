import { createGenesisBlock, appendTransferBlock, verifyChain, calculateBlockHash } from '../ledger/hashChain.js';

console.log('--- RUNNING HASH-CHAIN LEDGER INTEGRITY TESTS ---');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
  }
}

// TEST 1: Genesis Block Creation & Verification
const batchId = 'FC-TEST-001';
const genesis = createGenesisBlock(batchId, {
  crop: 'Organic Strawberries',
  quantity: 500,
  unit: 'kg',
  price: 4.25,
  owner: 'Green Valley Farms',
  location: 'Salinas, CA'
});

assert(genesis.index === 0, 'Genesis block index must be 0');
assert(genesis.previousHash.length === 64, 'Genesis previousHash is 64 hex characters');
assert(genesis.hash.length === 64, 'Genesis hash is valid 64 hex SHA-256');

let chain = [genesis];
let verification = verifyChain(chain);
assert(verification.valid === true, 'Genesis-only chain verifies as valid');

// TEST 2: Append Transfer Block
const block1 = appendTransferBlock(chain, {
  stage: 'COLD_STORAGE_PROCESSING',
  owner: 'FreshCo Cold Logistics',
  location: 'Fresno, CA',
  price: 4.50,
  qualityStatus: 'Fresh',
  notes: 'Cold storage intake at 2 deg C'
});
chain.push(block1);

assert(block1.index === 1, 'Transfer block has index 1');
assert(block1.previousHash === genesis.hash, 'Transfer block previousHash correctly links to genesis hash');

verification = verifyChain(chain);
assert(verification.valid === true, 'Chain of length 2 verifies as valid');

// TEST 3: Append Second Transfer Block with Damage Discount
const block2 = appendTransferBlock(chain, {
  stage: 'RETAIL_SUPERMARKET',
  owner: 'Metro Supermarket',
  location: 'San Francisco, CA',
  price: 4.50,
  adjustedPrice: 3.60,
  qualityStatus: 'Damaged',
  damageConfidence: 0.92,
  discountApplied: 0.20,
  notes: 'AI damage detected (20% discount applied)'
});
chain.push(block2);

assert(block2.index === 2, 'Transfer block has index 2');
assert(block2.adjustedPrice === 3.60, 'Discounted price correctly recorded in block payload');

verification = verifyChain(chain);
assert(verification.valid === true, 'Chain of length 3 with quality adjustment verifies as valid');

// TEST 4: Tampering Detection - Mutate Genesis Price
const tamperedChainPrice = JSON.parse(JSON.stringify(chain));
tamperedChainPrice[0].price = 100.00; // Maliciously altered historical price

const tamperCheck1 = verifyChain(tamperedChainPrice);
assert(tamperCheck1.valid === false, 'Tampering genesis price correctly invalidated chain');
assert(tamperCheck1.brokenAtIndex === 0, 'Integrity checker accurately pinpointed Block 0 as tampered');
console.log(`   (Tamper message: "${tamperCheck1.error}")`);

// TEST 5: Tampering Detection - Mutate Intermediate Block Data
const tamperedChainMid = JSON.parse(JSON.stringify(chain));
tamperedChainMid[1].owner = 'Hacker LLC';

const tamperCheck2 = verifyChain(tamperedChainMid);
assert(tamperCheck2.valid === false, 'Tampering middle block owner correctly invalidated chain');
assert(tamperCheck2.brokenAtIndex === 1, 'Integrity checker accurately pinpointed Block 1 as tampered');

// TEST 6: Tampering Detection - Mutate Hash Linkage
const tamperedChainLink = JSON.parse(JSON.stringify(chain));
tamperedChainLink[2].previousHash = '000000000000000000000000000000000000000000000000000000000000dead';

const tamperCheck3 = verifyChain(tamperedChainLink);
assert(tamperCheck3.valid === false, 'Broken cryptographic linkage correctly detected');
assert(tamperCheck3.brokenAtIndex === 2, 'Integrity checker flagged broken link at Block 2');

console.log(`\n--- TEST RESULTS: ${passed}/${total} assertions passed ---`);
if (passed === total) {
  console.log('🎉 ALL HASH-CHAIN INTEGRITY TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
} else {
  console.error('❌ SOME TESTS FAILED');
  process.exit(1);
}
