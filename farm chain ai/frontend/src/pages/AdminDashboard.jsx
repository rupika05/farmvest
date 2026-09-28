import React, { useState, useEffect } from 'react';
import { 
  Database, ShieldCheck, ShieldAlert, Cpu, Terminal, RefreshCw, 
  AlertTriangle, CheckCircle2, TrendingUp, BarChart3, PieChart, 
  FileText, Activity, Layers, Lock, Unlock, Server, Download, ChevronDown, ChevronUp,
  MapPin
} from 'lucide-react';
import { getAllBatches, getBatch, simulateTamper, restoreBatch, fetchAdminMetrics } from '../services/api';
import { translations } from '../locales/translations';
import AdminMLSection from '../components/AdminML/AdminMLSection';

export default function AdminDashboard({ 
  batches = [], 
  currentLang = 'en',
  onSelectBatch, 
  onRefreshBatches 
}) {
  const t = translations[currentLang] || translations.en;

  const [adminMainView, setAdminMainView] = useState('ml-pricing'); // 'ml-pricing' | 'ledger'
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.batchId || '');
  const [batchData, setBatchData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedBlockIdx, setSelectedBlockIdx] = useState(0);
  const [maliciousField, setMaliciousField] = useState('price');
  const [maliciousValue, setMaliciousValue] = useState('999.00');
  const [tamperLog, setTamperLog] = useState([]);
  const [expandedRawJson, setExpandedRawJson] = useState({});
  const [adminMetrics, setAdminMetrics] = useState(null);

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

  // Fetch macro analytics metrics from backend or client fallback
  const fetchAdminStats = async () => {
    try {
      const data = await fetchAdminMetrics();
      if (data?.success) {
        setAdminMetrics(data);
      }
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, [batches]);

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
      const res = await simulateTamper(
        selectedBatchId, 
        Number(selectedBlockIdx), 
        maliciousField, 
        isNaN(maliciousValue) ? maliciousValue : Number(maliciousValue)
      );
      setTamperLog(prev => [
        `[${new Date().toLocaleTimeString()}] AUDIT ALARM: Alteration injected at Block #${selectedBlockIdx} -> Field "${maliciousField}" = "${maliciousValue}". Chain Integrity: ${res.integrity.isValid ? 'VALID' : 'BROKEN 🚨'}`,
        ...prev
      ]);
      await fetchBatchDetails(selectedBatchId);
      await fetchAdminStats();
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
        `[${new Date().toLocaleTimeString()}] AUDIT RESTORE: Cryptographic chain verified as ${res.isValid ? 'CERTIFIED HEALTHY ✅' : 'INVALID ❌'}`,
        ...prev
      ]);
      await fetchBatchDetails(selectedBatchId);
      await fetchAdminStats();
      if (onRefreshBatches) onRefreshBatches();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleRawJson = (idx) => {
    setExpandedRawJson(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // KPI calculations fallback
  const totalVolumeTonnes = adminMetrics?.kpis?.totalTonnageMetricTonnes || 12.5;
  const totalValueLakhs = adminMetrics?.kpis?.totalEconomicValueLakhs || 4.8;
  const defectRate = adminMetrics?.kpis?.defectRatePercent || 14.2;
  const auditCompliance = adminMetrics?.kpis?.cryptographicCompliancePercent || 100;

  return (
    <div className="admin-dashboard-page">
      {/* Header */}
      <header className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="admin-seal-badge">Official Oversight</span>
              <span style={{ fontSize: '0.78rem', color: '#6ee7b7' }}>NIC & Ministry of Agriculture Node #01</span>
            </div>
            <h1 className="page-title" style={{ marginTop: '0.4rem' }}>
              <Database className="w-8 h-8 text-emerald-400" />
              {t.adminHeroTitle}
            </h1>
            <p className="page-subtitle">
              {t.adminHeroDesc}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => {
                fetchAdminStats();
                if (selectedBatchId) fetchBatchDetails(selectedBatchId);
              }}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.5rem 0.9rem' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-primary"
              style={{ fontSize: '0.82rem', padding: '0.5rem 0.9rem' }}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Print Audit Certificate</span>
            </button>
          </div>
        </div>
      </header>

      {/* Admin Module Switcher */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.4rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <button
          type="button"
          onClick={() => setAdminMainView('ml-pricing')}
          style={{
            flex: 1,
            padding: '0.7rem 1.25rem',
            borderRadius: '8px',
            border: adminMainView === 'ml-pricing' ? '1px solid rgba(46, 204, 113, 0.4)' : '1px solid transparent',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            background: adminMainView === 'ml-pricing' ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.25), rgba(16, 185, 129, 0.15))' : 'transparent',
            color: adminMainView === 'ml-pricing' ? '#34d399' : '#94a3b8',
            boxShadow: adminMainView === 'ml-pricing' ? '0 2px 8px rgba(46, 204, 113, 0.2)' : 'none'
          }}
        >
          <Cpu className="w-4 h-4" />
          <span>AI Fair Price Recommendation Engine</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminMainView('ledger')}
          style={{
            flex: 1,
            padding: '0.7rem 1.25rem',
            borderRadius: '8px',
            border: adminMainView === 'ledger' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            background: adminMainView === 'ledger' ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(14, 165, 233, 0.15))' : 'transparent',
            color: adminMainView === 'ledger' ? '#38bdf8' : '#94a3b8',
            boxShadow: adminMainView === 'ledger' ? '0 2px 8px rgba(56, 189, 248, 0.2)' : 'none'
          }}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Central Blockchain Audit & Tamper Simulator</span>
        </button>
      </div>

      {adminMainView === 'ml-pricing' && (
        <AdminMLSection />
      )}

      {adminMainView === 'ledger' && (
        <>
      {/* KPI Cards Strip */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="kpi-icon-box bg-emerald">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="kpi-label">{t.kpiTotalBatches}</span>
            <div className="kpi-value">{batches.length}</div>
            <span className="kpi-subtext">Registered across Mandis</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box bg-blue">
            <TrendingUp className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <span className="kpi-label">{t.kpiTotalTonnage}</span>
            <div className="kpi-value">{totalVolumeTonnes} <span style={{ fontSize: '0.9rem' }}>MT</span></div>
            <span className="kpi-subtext">Metric Tonnes tracked</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box bg-amber">
            <BarChart3 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="kpi-label">{t.kpiTotalValue}</span>
            <div className="kpi-value">₹{totalValueLakhs} <span style={{ fontSize: '0.9rem' }}>Lakhs</span></div>
            <span className="kpi-subtext">Gross Mandi Turnover</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box bg-red">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <span className="kpi-label">{t.kpiDefectRate}</span>
            <div className="kpi-value">{defectRate}%</div>
            <span className="kpi-subtext">-20% Markdown Triggered</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-icon-box bg-purple">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <span className="kpi-label">{t.kpiAuditHealth}</span>
            <div className="kpi-value" style={{ color: auditCompliance === 100 ? '#34d399' : '#f87171' }}>
              {auditCompliance}%
            </div>
            <span className="kpi-subtext">SHA-256 Cryptographic Pass</span>
          </div>
        </div>
      </div>

      {/* Regional Mandi Inflow Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>{t.mandiDistributionTitle}</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="mandi-stat-row">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#e2e8f0', marginBottom: '0.25rem' }}>
                <span>Koyambedu Wholesale Market, Chennai (TN)</span>
                <span style={{ fontWeight: 700, color: '#34d399' }}>38% Volume</span>
              </div>
              <div className="mandi-progress-track"><div className="mandi-progress-fill" style={{ width: '38%' }}></div></div>
            </div>

            <div className="mandi-stat-row">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#e2e8f0', marginBottom: '0.25rem' }}>
                <span>Erode Regulated Market (Turmeric Capital, TN)</span>
                <span style={{ fontWeight: 700, color: '#34d399' }}>26% Volume</span>
              </div>
              <div className="mandi-progress-track"><div className="mandi-progress-fill" style={{ width: '26%' }}></div></div>
            </div>

            <div className="mandi-stat-row">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#e2e8f0', marginBottom: '0.25rem' }}>
                <span>Lasalgaon APMC, Nashik (Onion Capital, MH)</span>
                <span style={{ fontWeight: 700, color: '#34d399' }}>20% Volume</span>
              </div>
              <div className="mandi-progress-track"><div className="mandi-progress-fill" style={{ width: '20%' }}></div></div>
            </div>

            <div className="mandi-stat-row">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#e2e8f0', marginBottom: '0.25rem' }}>
                <span>Dindigul & Theni Regulated Yards (TN)</span>
                <span style={{ fontWeight: 700, color: '#34d399' }}>16% Volume</span>
              </div>
              <div className="mandi-progress-track"><div className="mandi-progress-fill" style={{ width: '16%' }}></div></div>
            </div>
          </div>
        </div>

        {/* Commodity Distribution */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart className="w-4 h-4 text-emerald-400" />
            <span>{t.cropBreakdownTitle}</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="commodity-badge-card">
              <span style={{ fontSize: '1.5rem' }}>🍅</span>
              <div>
                <span className="commodity-name">தக்காளி (Tomatoes)</span>
                <span className="commodity-stat">₹32/kg Avg Mandi</span>
              </div>
            </div>

            <div className="commodity-badge-card">
              <span style={{ fontSize: '1.5rem' }}>🧅</span>
              <div>
                <span className="commodity-name">வெங்காயம் (Onions)</span>
                <span className="commodity-stat">₹28/kg Avg Mandi</span>
              </div>
            </div>

            <div className="commodity-badge-card">
              <span style={{ fontSize: '1.5rem' }}>🌿</span>
              <div>
                <span className="commodity-name">மஞ்சள் (Turmeric)</span>
                <span className="commodity-stat">₹135/kg Erode Hub</span>
              </div>
            </div>

            <div className="commodity-badge-card">
              <span style={{ fontSize: '1.5rem' }}>🍌</span>
              <div>
                <span className="commodity-name">வாழைப்பழம் (Banana)</span>
                <span className="commodity-stat">₹26/kg Theni Yard</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Target Batch Selector Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>
            Target Krishi Batch ID:
          </label>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <select
              className="form-select"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
            >
              {batches.map((b) => (
                <option key={b.batchId} value={b.batchId}>
                  {b.batchId} — {b.crop} (Custodian: {b.currentOwner}) [{b.isValid ? 'Verified' : 'Tampered'}]
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
            <span>Audit Batch</span>
          </button>
        </div>
      </div>

      {/* Cryptographic Forensic Lab & Raw JSON Explorer */}
      {batchData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {/* Forensic Attack Simulator */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Terminal className="w-5 h-5 text-amber-400" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff' }}>Central Forensic Tamper Simulator</h3>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
              Test cryptographic security by injecting malicious unauthorized edits into historical records. The SHA-256 verification algorithm recalculates hash linkages and immediately flags fraud.
            </p>

            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label className="form-label">Select Target Block Index</label>
              <select
                className="form-select"
                value={selectedBlockIdx}
                onChange={(e) => setSelectedBlockIdx(e.target.value)}
              >
                {(batchData?.chain || []).map((blk) => (
                  <option key={blk.index} value={blk.index}>
                    Block #{blk.index} — {blk.stage} ({blk.owner})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label className="form-label">Field to Maliciously Mutate</label>
              <select
                className="form-select"
                value={maliciousField}
                onChange={(e) => setMaliciousField(e.target.value)}
              >
                <option value="price">price (Alter Historical Purchase Rate)</option>
                <option value="owner">owner (Forge Trader Custody Name)</option>
                <option value="qualityStatus">qualityStatus (Cover Up Produce Damage)</option>
                <option value="crop">crop (Substitute Agricultural Commodity)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Malicious Injection Value</label>
              <input
                type="text"
                className="form-input"
                value={maliciousValue}
                onChange={(e) => setMaliciousValue(e.target.value)}
                placeholder="e.g. 999.00 or Fraudulent Trader Corp"
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                id="btn-admin-tamper"
                onClick={handleTamper}
                className="btn btn-danger"
                style={{ flex: 1 }}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{t.btnRunTamperTest}</span>
              </button>

              <button
                type="button"
                id="btn-admin-restore"
                onClick={handleRestore}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.btnRestoreAudit}</span>
              </button>
            </div>

            {/* Terminal Log */}
            <div style={{ marginTop: '1.5rem', background: '#000', border: '1px solid #334155', borderRadius: '8px', padding: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#38bdf8', maxHeight: '160px', overflowY: 'auto' }}>
              <div style={{ color: '#64748b', marginBottom: '0.35rem' }}>// Central Regulatory Audit Log</div>
              {tamperLog.length === 0 ? (
                <div style={{ color: '#475569' }}>Forensic auditor active. Standing by for penetration test...</div>
              ) : (
                tamperLog.map((log, idx) => (
                  <div key={idx} style={{ marginBottom: '0.25rem' }}>{log}</div>
                ))
              )}
            </div>
          </div>

          {/* Detailed Block-by-Block Cryptographic Explorer with Raw JSON */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cpu className="w-5 h-5 text-emerald-400" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff' }}>Sequential Block Ledger Tree</h3>
              </div>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: batchData.integrity?.isValid ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: batchData.integrity?.isValid ? '#34d399' : '#f87171', fontWeight: 700 }}>
                {batchData.integrity?.isValid ? 'SHA-256 VERIFIED' : 'TAMPER ALARM ACTIVE'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '520px', overflowY: 'auto', paddingRight: '0.4rem' }}>
              {(batchData?.chain || []).map((block, idx) => {
                const isGenesis = block.index === 0;
                const isExpanded = expandedRawJson[idx];

                return (
                  <div key={block.hash || idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="block-index-badge">Block #{block.index}</span>
                        <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{block.stage}</strong>
                      </div>
                      <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.95rem' }}>
                        ₹{Number(block.adjustedPrice ?? block.price).toFixed(2)}/{block.unit || 'kg'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
                      <strong>Custodian:</strong> {block.owner} ({block.location}) • <strong>Quality:</strong> {block.qualityStatus}
                    </div>

                    <div className="hash-proof-box" style={{ fontSize: '0.68rem', padding: '0.5rem' }}>
                      <div className="hash-row">
                        <span className="hash-label">Current Hash:</span>
                        <span style={{ color: '#f1f5f9' }}>{block.hash}</span>
                      </div>
                      <div className="hash-row">
                        <span className="hash-label">Prev Link:</span>
                        <span style={{ color: '#94a3b8' }}>{block.previousHash}</span>
                      </div>
                    </div>

                    {/* Collapsible Raw JSON Inspector */}
                    <div style={{ marginTop: '0.6rem' }}>
                      <button
                        type="button"
                        onClick={() => toggleRawJson(idx)}
                        style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <span>{isExpanded ? 'Hide Raw Canonical JSON' : 'Inspect Raw Canonical Block JSON'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {isExpanded && (
                        <pre style={{ marginTop: '0.5rem', background: '#080c14', border: '1px solid #1e293b', borderRadius: '6px', padding: '0.75rem', fontSize: '0.68rem', color: '#4ade80', overflowX: 'auto', fontFamily: 'var(--font-mono)' }}>
                          {JSON.stringify(block, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
