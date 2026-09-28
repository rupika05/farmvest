import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle, 
  Clock, MapPin, DollarSign, Sprout, Truck, Store, UserCheck, 
  ExternalLink, RefreshCw, Key, ChevronDown, ChevronUp, Lock
} from 'lucide-react';
import { getBatch, simulateTamper, restoreBatch } from '../services/api';
import { getCropImage } from '../config/crops';
import { translations } from '../locales/translations';

export default function ConsumerTracker({ 
  batchId, 
  batches = [], 
  currentLang = 'en',
  onSelectBatch 
}) {
  const t = translations[currentLang] || translations.en;

  const [currentId, setCurrentId] = useState(batchId || '');
  const [batchData, setBatchData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [tampering, setTampering] = useState(false);
  const [expandedHashes, setExpandedHashes] = useState({});

  useEffect(() => {
    if (batchId) {
      setCurrentId(batchId);
      loadBatch(batchId);
    } else if (batches.length > 0 && !currentId) {
      setCurrentId(batches[0].batchId);
      loadBatch(batches[0].batchId);
    }
  }, [batchId, batches]);

  const loadBatch = async (id) => {
    if (!id) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getBatch(id);
      if (res?.success) {
        setBatchData(res);
      } else {
        setErrorMsg(res?.error || 'Batch not found on National Krishi Registry.');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleHashView = (index) => {
    setExpandedHashes(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleTamperAttack = async () => {
    if (!currentId) return;
    setTampering(true);
    try {
      await simulateTamper(currentId, 0, 'price', 999.00);
      await loadBatch(currentId);
    } catch (err) {
      console.error(err);
    } finally {
      setTampering(false);
    }
  };

  const handleRestoreLedger = async () => {
    if (!currentId) return;
    setTampering(true);
    try {
      await restoreBatch(currentId);
      await loadBatch(currentId);
    } catch (err) {
      console.error(err);
    } finally {
      setTampering(false);
    }
  };

  const getStageIcon = (stage, isDamaged) => {
    if (isDamaged) return <AlertTriangle className="w-4 h-4 text-red-400" />;
    switch (stage) {
      case 'FARM_GATE_HARVEST':
      case 'FARM_HARVEST':
        return <Sprout className="w-4 h-4 text-emerald-400" />;
      case 'APMC_MANDI_AUCTION':
      case 'COLD_STORAGE_PROCESSING':
      case 'GOVT_COLD_STORAGE':
        return <Lock className="w-4 h-4 text-sky-400" />;
      case 'HIGHWAY_LOGISTICS':
      case 'STATE_TRANSPORT':
      case 'WHOLESALE_DISTRIBUTION':
        return <Truck className="w-4 h-4 text-amber-400" />;
      case 'RETAIL_KIRANA_RATION':
      case 'RETAIL_SUPERMARKET':
        return <Store className="w-4 h-4 text-emerald-400" />;
      default:
        return <UserCheck className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="consumer-tracker-page">
      <header className="page-header">
        <h1 className="page-title">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          {t.consumerHeroTitle}
        </h1>
        <p className="page-subtitle">
          {t.consumerHeroDesc}
        </p>
      </header>

      {/* Quick Lookup Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>
            {t.enterBatchId}
          </span>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
              value={currentId}
              onChange={(e) => setCurrentId(e.target.value)}
              placeholder="e.g. IN-KRISHI-20260904-XXXX"
            />
          </div>
          <button
            type="button"
            id="btn-search-tracker-batch"
            onClick={() => loadBatch(currentId)}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.25rem' }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{t.btnVerifyInspect}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <ShieldAlert className="w-12 h-12 text-red-400" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Record Not Found</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{errorMsg}</p>
        </div>
      )}

      {batchData && (
        <div>
          {/* Cryptographic Integrity Status Banner */}
          <div className={`integrity-banner ${batchData.integrity?.isValid ? 'valid' : 'invalid'}`}>
            <div className="integrity-info">
              {batchData.integrity?.isValid ? (
                <ShieldCheck className="w-8 h-8 text-emerald-400 flex-shrink-0" />
              ) : (
                <ShieldAlert className="w-8 h-8 text-red-500 flex-shrink-0" />
              )}
              <div>
                <div className="integrity-status-text" style={{ color: batchData.integrity?.isValid ? '#34d399' : '#f87171' }}>
                  {batchData.integrity?.isValid
                    ? t.chainVerifiedTitle
                    : t.chainCompromisedTitle}
                </div>
                <div className="integrity-status-desc">
                  {batchData.integrity?.isValid
                    ? `${t.chainVerifiedDesc} (${batchData.blockCount} blocks verified).`
                    : batchData.integrity?.error || 'Security alert: Data mismatch detected!'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {batchData.integrity?.isValid ? (
                <button
                  type="button"
                  id="btn-simulate-tamper"
                  onClick={handleTamperAttack}
                  disabled={tampering}
                  className="btn btn-danger"
                  style={{ fontSize: '0.75rem', padding: '0.45rem 0.8rem' }}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{t.btnSimulateTamper}</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-restore-ledger"
                  onClick={handleRestoreLedger}
                  disabled={tampering}
                  className="btn btn-primary"
                  style={{ fontSize: '0.75rem', padding: '0.45rem 0.8rem' }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.btnRestoreLedger}</span>
                </button>
              )}
            </div>
          </div>

          {/* Citizen Overview Passport Card */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <img 
                  src={getCropImage(batchData.crop)}
                  alt={batchData.crop}
                  style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '16px',
                    objectFit: 'cover',
                    border: '2px solid rgba(52, 211, 153, 0.4)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
                    flexShrink: 0
                  }}
                />
                <div>
                  <span className="minted-badge">🇮🇳 {currentLang === 'ta' ? 'அரசு அங்கீகரிக்கப்பட்ட உழவர் பாஸ்போர்ட்' : 'Verified Krishi Passport'}</span>
                  <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '0.25rem 0' }}>
                    {batchData.crop}
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    Krishi Passport ID: <span style={{ fontFamily: 'var(--font-mono)', color: '#6ee7b7' }}>{batchData.batchId}</span>
                  </p>
                </div>
              </div>

              {batchData.qrCode && (
                <div style={{ textAlign: 'center', background: '#fff', padding: '0.6rem', borderRadius: '10px', maxWidth: '130px' }}>
                  <img src={batchData.qrCode} alt="Batch QR" style={{ width: '100%', display: 'block' }} />
                  <span style={{ fontSize: '0.65rem', color: '#002147', fontWeight: 800 }}>
                    {currentLang === 'ta' ? 'உழவர் QR' : 'Official QR'}
                  </span>
                </div>
              )}
            </div>

            {/* KPI Metrics in ₹ */}
            <div className="block-meta-grid" style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.35)', padding: '1rem', borderRadius: '10px' }}>
              <div className="meta-item">
                <span className="meta-label">{t.originFarm}</span>
                <span className="meta-val">{batchData.chain[0]?.owner}</span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{batchData.chain[0]?.location}</span>
              </div>

              <div className="meta-item">
                <span className="meta-label">{t.currentCustodian}</span>
                <span className="meta-val">{batchData.currentOwner}</span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{batchData.currentLocation}</span>
              </div>

              <div className="meta-item">
                <span className="meta-label">{t.currentPrice}</span>
                <span className="meta-val" style={{ fontSize: '1.35rem', color: '#34d399', fontWeight: 800 }}>
                  ₹{Number(batchData.currentPrice).toFixed(2)} / {batchData.unit}
                </span>
                {batchData.discountApplied > 0 && (
                  <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 700 }}>
                    -{(batchData.discountApplied * 100).toFixed(0)}% {currentLang === 'ta' ? 'தர குறைப்பு தள்ளுபடி' : 'Quality Discount Applied'}
                  </span>
                )}
              </div>

              <div className="meta-item">
                <span className="meta-label">{t.overallGrade}</span>
                <span className="meta-val" style={{ color: batchData.qualityStatus === 'Damaged' ? '#f87171' : '#34d399', fontWeight: 700 }}>
                  {batchData.qualityStatus === 'Damaged' 
                    ? (currentLang === 'ta' ? '⚠️ சேதமடைந்தது (-20%)' : '⚠️ Damaged (-20%)') 
                    : (currentLang === 'ta' ? 'முதல் தரம் (Grade-A)' : 'Grade-A Fresh')}
                </span>
              </div>
            </div>
          </div>

          {/* Chronological Supply Journey Timeline */}
          <div className="card">
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{t.provenanceJourneyTitle}</span>
              <span style={{ fontSize: '0.8rem', color: '#6ee7b7', background: 'rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                {batchData.blockCount} {currentLang === 'ta' ? 'அங்கீகரிக்கப்பட்ட நிலைகள்' : 'Verified Milestones'}
              </span>
            </h3>

            <div className="provenance-timeline">
              {batchData.chain.map((block, index) => {
                const isGenesis = block.index === 0;
                const isDamaged = block.qualityStatus === 'Damaged';
                const hasDiscount = block.discountApplied > 0;
                const isExpanded = expandedHashes[index];

                return (
                  <div key={block.hash || index} className="timeline-block-item">
                    <div className={`timeline-node-icon ${isDamaged ? 'damaged' : ''}`}>
                      {getStageIcon(block.stage, isDamaged)}
                    </div>

                    <div className="block-card">
                      <div className="block-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span className="block-index-badge">Stage #{block.index}</span>
                          <span className="block-stage-name">
                            {isGenesis ? (currentLang === 'ta' ? '🌱 உழவர் அறுவடை & பதிவு' : '🌱 Farmer Harvest Gate') : block.stage.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {isDamaged ? (
                            <span style={{ fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                              ⚠️ Defect: Damaged (-20%)
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                              {currentLang === 'ta' ? 'முதல் தரம்' : 'Grade-A Fresh'}
                            </span>
                          )}
                          <span className="block-timestamp">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(block.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="block-meta-grid">
                        <div className="meta-item">
                          <span className="meta-label">பொறுப்பாளர் (Custodian)</span>
                          <span className="meta-val">{block.owner}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">இடம் (Location)</span>
                          <span className="meta-val">{block.location}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">மண்டி விலை (Price)</span>
                          <span className="meta-val">
                            {hasDiscount ? (
                              <>
                                <span style={{ textDecoration: 'line-through', color: '#94a3b8', marginRight: '0.4rem' }}>
                                  ₹{Number(block.price).toFixed(2)}
                                </span>
                                <span style={{ color: '#34d399', fontWeight: 700 }}>
                                  ₹{Number(block.adjustedPrice).toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span>₹{Number(block.adjustedPrice ?? block.price).toFixed(2)} / {block.unit || 'kg'}</span>
                            )}
                          </span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">தர ஆய்வு (Inspection)</span>
                          <span className="meta-val">
                            {block.damageConfidence > 0
                              ? `${(block.damageConfidence * 100).toFixed(1)}% Confidence`
                              : 'Grade-A Certified'}
                          </span>
                        </div>
                      </div>

                      {block.notes && (
                        <p style={{ margin: '0.5rem 0', fontSize: '0.8rem', color: '#cbd5e1', fontStyle: 'italic' }}>
                          "{block.notes}"
                        </p>
                      )}

                      <div style={{ marginTop: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={() => toggleHashView(index)}
                          style={{ background: 'transparent', border: 'none', color: '#6ee7b7', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
                        >
                          <Key className="w-3 h-3" />
                          <span>{isExpanded ? t.hideHashProof : t.showHashProof}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {isExpanded && (
                          <div className="hash-proof-box">
                            <div className="hash-row">
                              <span className="hash-label">Block Hash:</span>
                              <span style={{ color: '#e2e8f0' }}>{block.hash}</span>
                            </div>
                            <div className="hash-row">
                              <span className="hash-label">Prev Link:</span>
                              <span style={{ color: '#94a3b8' }}>{block.previousHash}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
