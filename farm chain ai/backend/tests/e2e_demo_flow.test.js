import assert from 'assert';

console.log('========================================================================');
console.log('🇮🇳 RUNNING NATIONAL KRISHI TRANSPARENCY PORTAL E2E DEMO TEST 🇮🇳');
console.log('========================================================================\n');

const BASE_URL = 'http://localhost:5001/api';

async function runE2E() {
  // 1. HEALTH CHECK
  console.log('STEP 1: Checking Central Health Endpoint...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  assert.strictEqual(health.status, 'ok');
  console.log('✅ Server online & healthy:', health.service);

  // 2. QUERY TAMIL CROP MANDI BENCHMARK
  console.log('\nSTEP 2: Query APMC Mandi Benchmark for தக்காளி (Tomato)...');
  const priceRes = await fetch(`${BASE_URL}/price-suggestion/${encodeURIComponent('தக்காளி')}`);
  const priceData = await priceRes.json();
  assert.strictEqual(priceData.success, true);
  assert.strictEqual(priceData.currency, 'INR');
  assert.strictEqual(priceData.averagePrice, 32);
  console.log(`✅ APMC Benchmark Found: ₹${priceData.averagePrice}/${priceData.unit} (${priceData.tamilName})`);
  console.log(`   Source: ${priceData.historicalSamples[0].region} - ₹${priceData.historicalSamples[0].price}/${priceData.unit}`);

  // 3. MINT DIGITAL MANDI PASS (KISAN HARVEST)
  console.log('\nSTEP 3: Register Produce & Generate Digital Mandi Pass...');
  const mintRes = await fetch(`${BASE_URL}/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      crop: 'தக்காளி (Tomatoes)',
      quantity: 500,
      unit: 'kg',
      price: priceData.averagePrice,
      owner: 'முருகன் (M. Murugan)',
      location: 'திண்டுக்கல் மார்க்கெட், தமிழ்நாடு (Dindigul, TN)',
      harvestDate: '2026-09-04',
      notes: 'முதல் தரம், இயற்கை உரம் மூலம் விளைவிக்கப்பட்டது.'
    })
  });
  const mintData = await mintRes.json();
  assert.strictEqual(mintData.success, true);
  const batchId = mintData.batchId;
  assert.ok(batchId.startsWith('IN-KRISHI-'));
  assert.ok(mintData.qrCode.startsWith('data:image/png;base64,'));
  console.log(`✅ Digital Mandi Pass Created: ${batchId}`);
  console.log(`   Genesis Block #0 Hash: ${mintData.block.hash}`);

  // 4. TRANSFER TO KOYAMBEDU APMC + AI QUALITY CHECK (-20% DISCOUNT)
  console.log('\nSTEP 4: Transfer to Koyambedu APMC + AI Produce Quality Check...');
  const originalPrice = 32.0;
  const discountedPrice = Math.round(originalPrice * 0.80 * 100) / 100; // ₹25.60

  const transfer1Res = await fetch(`${BASE_URL}/batch/${batchId}/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stage: 'APMC_MANDI_AUCTION',
      owner: 'கோயம்பேடு மொத்த வர்த்தக சங்கம் (Koyambedu APMC Traders)',
      location: 'கோயம்பேடு மொத்த அங்காடி, சென்னை (Chennai, TN)',
      price: originalPrice,
      adjustedPrice: discountedPrice,
      qualityStatus: 'Damaged',
      damageConfidence: 0.94,
      discountApplied: 0.20,
      notes: 'AI கேமரா சேதம் கண்டறிந்தது; 20% அரசு தர தள்ளுபடி வழங்கப்பட்டது.'
    })
  });
  const transfer1Data = await transfer1Res.json();
  assert.strictEqual(transfer1Data.success, true);
  assert.strictEqual(transfer1Data.block.adjustedPrice, 25.60);
  console.log(`✅ Block #1 Sealed: Transferred to Koyambedu APMC`);
  console.log(`   Nominal Price: ₹${transfer1Data.block.price} ➔ Adjusted Price: ₹${transfer1Data.block.adjustedPrice} (-20%)`);

  // 5. ADMIN METRICS API AUDIT
  console.log('\nSTEP 5: Central Admin Metrics Audit API...');
  const adminRes = await fetch(`${BASE_URL}/admin/metrics`);
  const adminData = await adminRes.json();
  assert.strictEqual(adminData.success, true);
  assert.ok(adminData.kpis.totalBatches >= 1);
  console.log(`✅ Central Admin Metrics Verified:`);
  console.log(`   Total Batches: ${adminData.kpis.totalBatches}`);
  console.log(`   Total Volume: ${adminData.kpis.totalTonnageMetricTonnes} Metric Tonnes`);
  console.log(`   Total Blocks Mined: ${adminData.kpis.totalBlocksMined}`);
  console.log(`   Audit Compliance: ${adminData.kpis.cryptographicCompliancePercent}%`);

  // 6. CITIZEN PROVENANCE PASSPORT INSPECTION
  console.log('\nSTEP 6: Citizen Provenance Passport (GET /api/batch/:id)...');
  const citizenRes = await fetch(`${BASE_URL}/batch/${batchId}`);
  const citizenData = await citizenRes.json();
  assert.strictEqual(citizenData.success, true);
  assert.strictEqual(citizenData.currentPrice, 25.60);
  assert.strictEqual(citizenData.integrity.isValid, true);
  console.log(`✅ Citizen Passport Verified for ${citizenData.crop}`);
  console.log(`   Current Price: ₹${citizenData.currentPrice}/${citizenData.unit}`);

  // 7. TAMPER AUDIT TEST
  console.log('\nSTEP 7: Regulatory Tamper Alarm Penetration Test...');
  const tamperRes = await fetch(`${BASE_URL}/batch/${batchId}/tamper`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blockIndex: 0, field: 'price', maliciousValue: 999.00 })
  });
  const tamperData = await tamperRes.json();
  assert.strictEqual(tamperData.integrity.isValid, false);
  console.log('✅ Central Tamper Alarm Triggered (SHA-256 Hash Broken):', tamperData.integrity.error);

  // 8. RESTORE AUDIT
  console.log('\nSTEP 8: Restore Central Audit Integrity...');
  const restoreRes = await fetch(`${BASE_URL}/batch/${batchId}/restore`, { method: 'POST' });
  const restoreData = await restoreRes.json();
  assert.strictEqual(restoreData.isValid, true);
  console.log('✅ Ledger Restored to 100% Cryptographically Verified State!');

  console.log('\n========================================================================');
  console.log('🎉 ALL 8 STAGES OF THE NATIONAL KRISHI PORTAL E2E TEST PASSED! 🎉');
  console.log('========================================================================\n');
}

runE2E().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
