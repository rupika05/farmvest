import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, ShieldAlert, Cpu, Terminal, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getAllBatches, getBatch, simulateTamper, restoreBatch } from '../services/api';

export default function LedgerInspector({ batches = [], onSelectBatch, onRefreshBatches }) {
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.batchId || '');
  const [batchData, setBatchData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedBlockIdx, setSelectedBlockIdx] = useState(0);
  const [maliciousField, setMaliciousField] = useState('price');
  const [maliciousValue, setMaliciousValue] = useState('999.00');
  const [tamperLog, setTamperLog] = useState([]);

  useEffect(() => {
    if (batches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(batches[0].batchId);
    }
  }, [batches]);

  useEffect(() => {
    if (selectedBatchId) {
      fetchBatchDetails(selectedBatchId);
    }
  }, [selectedBatchId]);

  const fetchBatchDetails = async (id) => {
    setLoading(true);
    try {
      const res = await getBatch(id);
      if (res?.success) {
        setBatchData(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTamper = async () => {
    if (!selectedBatchId) return;
    try {
      const res = await simulateTamper(selectedBatchId, Number(selectedBlockIdx), maliciousField, isNaN(maliciousValue) ? maliciousValue : Number(maliciousValue));
      setTamperLog(prev => [
        `[${new Date().toLocaleTimeString()}] INJECTED CORRUPTION at Block #${selectedBlockIdx} -> Field "${maliciousField}" set to "${maliciousValue}". Chain Integrity: ${res.integrity.isValid ? 'VALID' : 'BROKEN 🚨'}`,
        ...prev
      ]);
      await fetchBatchDetails(selectedBatchId);
      if (onRefreshBatches) onRefreshBatches();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestore = async () => {
    if (!selectedBatchId) return;
    try {
      const res = await restoreBatch(selectedBatchId);
      setTamperLog(prev => [
        `[${new Date().toLocaleTimeString()}] RESTORED LEDGER: Chain verified as ${res.isValid ? 'VALID ✅' : 'INVALID ❌'}`,
        ...prev
      ]);
      await fetchBatchDetails(selectedBatchId);
      if (onRefreshBatches) onRefreshBatches();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="ledger-inspector-page">
      <header className="page-header">
        <h1 className="page-title">
          <Database className="w-8 h-8 text-emerald-400" />
          Ledger Inspector & Cryptographic Tamper Lab
        </h1>
        <p className="page-subtitle">
          Interactive cryptographic diagnostic center. Inspect raw SHA-256 blocks, verify parent-child hash links, and simulate cyber tampering to demonstrate chain immutability.
        </p>
      </header>

      {/* Selector */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>
            Target Ledger Batch:
          </label>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <select
              className="form-select"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
            >
              {batches.map((b) => (
                <option key={b.batchId} value={b.batchId}>
                  {b.batchId} ({b.crop} • {b.blockCount} blocks • {b.isValid ? 'Valid' : 'Compromised!'})
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => fetchBatchDetails(selectedBatchId)}
            className="btn btn-secondary"
            style={{ padding: '0.65rem 1rem' }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {batchData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Left Column: Tamper Experimentation Console */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Terminal className="w-5 h-5 text-amber-400" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff' }}>Simulated Tamper Attack Tool</h3>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
              Modify raw data inside any block without recomputing cryptographic hashes. The hash-chain algorithm recalculates the SHA-256 hashes sequentially to detect the exact block where data was altered.
            </p>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Target Block Index</label>
              <select
                className="form-select"
                value={selectedBlockIdx}
                onChange={(e) => setSelectedBlockIdx(e.target.value)}
              >
                {batchData.chain.map((blk) => (
                  <option key={blk.index} value={blk.index}>
                    Block #{blk.index} — {blk.stage} ({blk.owner})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Field to Maliciously Mutate</label>
              <select
                className="form-select"
                value={maliciousField}
                onChange={(e) => setMaliciousField(e.target.value)}
              >
                <option value="price">price (Alter Historical Price)</option>
                <option value="owner">owner (Forge Custody Name)</option>
                <option value="crop">crop (Substitute Commodity)</option>
                <option value="qualityStatus">qualityStatus (Cover Up Defect)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Malicious Inject Value</label>
              <input
                type="text"
                className="form-input"
                value={maliciousValue}
                onChange={(e) => setMaliciousValue(e.target.value)}
                placeholder="e.g. 999.99 or Fake Farm Corp"
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                id="btn-inspector-tamper"
                onClick={handleTamper}
                className="btn btn-danger"
                style={{ flex: 1 }}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Inject Malicious Edit</span>
              </button>

              <button
                type="button"
                id="btn-inspector-restore"
                onClick={handleRestore}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Restore Chain</span>
              </button>
            </div>

            {/* Audit Terminal Log */}
            <div style={{ marginTop: '1.5rem', background: '#000', border: '1px solid #334155', borderRadius: '8px', padding: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#38bdf8', maxHeight: '160px', overflowY: 'auto' }}>
              <div style={{ color: '#64748b', marginBottom: '0.35rem' }}>// Tamper Experiment Log</div>
              {tamperLog.length === 0 ? (
                <div style={{ color: '#475569' }}>No attacks simulated yet. Ready for input...</div>
              ) : (
                tamperLog.map((log, idx) => (
                  <div key={idx} style={{ marginBottom: '0.25rem' }}>{log}</div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Live Chain Verification State */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cpu className="w-5 h-5 text-emerald-400" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff' }}>Chain Verification Engine</h3>
              </div>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: batchData.integrity?.isValid ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: batchData.integrity?.isValid ? '#34d399' : '#f87171', fontWeight: 700 }}>
                {batchData.integrity?.isValid ? 'HEALTHY' : 'CORRUPT'}
              </span>
            </div>

            <div style={{ padding: '0.75rem', borderRadius: '8px', background: batchData.integrity?.isValid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${batchData.integrity?.isValid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.4)'}`, marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: batchData.integrity?.isValid ? '#34d399' : '#f87171' }}>
                {batchData.integrity?.isValid ? '✅ All Block Hashes & Links Verified' : '❌ Cryptographic Anomaly Flagged'}
              </div>
              {batchData.integrity?.error && (
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: '#fca5a5' }}>
                  {batchData.integrity.error}
                </p>
              )}
            </div>

            {/* Block Stack Listing */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {batchData.chain.map((blk) => (
                <div key={blk.index} style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>
                    <span>Block #{blk.index} — {blk.stage}</span>
                    <span style={{ color: '#34d399' }}>${Number(blk.adjustedPrice ?? blk.price).toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#94a3b8', marginTop: '0.25rem', wordBreak: 'break-all' }}>
                    <div>Hash: {blk.hash}</div>
                    <div style={{ color: '#64748b' }}>Prev: {blk.previousHash}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
