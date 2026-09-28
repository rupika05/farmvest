import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Layers, ArrowRight } from 'lucide-react';
import { getBatch, transferBatch } from '../services/api';
import DamageCheck from '../components/DamageCheck/DamageCheck';
import { getCropImage } from '../config/crops';
import { translations } from '../locales/translations';
import confetti from 'canvas-confetti';

const INDIAN_STAGE_OPTIONS = [
  { value: 'APMC_MANDI_AUCTION', labelEn: '🏪 APMC Mandi Yard & Auction (வேளாண் விளைபொருள் அங்காடி)', labelTa: '🏪 APMC மண்டி மற்றும் ஏலம் (APMC Mandi)' },
  { value: 'GOVT_COLD_STORAGE', labelEn: '❄️ Central Warehousing & Cold Storage (அரசு குளிர்பதன கிடங்கு)', labelTa: '❄️ அரசு குளிர்பதன கிடங்கு (Cold Storage)' },
  { value: 'HIGHWAY_LOGISTICS', labelEn: '🚚 National Highway Transport (தேசிய போக்குவரத்து)', labelTa: '🚚 தேசிய நெடுஞ்சாலை போக்குவரத்து (Logistics)' },
  { value: 'WHOLESALE_TRADER', labelEn: '🏢 Wholesale Trader / Mandi Hub (மொத்த வர்த்தக மையம்)', labelTa: '🏢 மொத்த வர்த்தக மையம் (Wholesale Hub)' },
  { value: 'RETAIL_KIRANA_RATION', labelEn: '🛒 Fair Price Ration / Retail Store (நியாயவிலை கடை / அங்காடி)', labelTa: '🛒 சில்லறை நியாயவிலை கடை (Retail Store)' }
];

export default function TransferPortal({ 
  initialBatchId, 
  batches = [], 
  currentLang = 'en',
  onTransferCompleted, 
  onNavigateTrack 
}) {
  const t = translations[currentLang] || translations.en;

  const [selectedBatchId, setSelectedBatchId] = useState(initialBatchId || '');
  const [batchData, setBatchData] = useState(null);
  const [loadingBatch, setLoadingBatch] = useState(false);

  const [stage, setStage] = useState('APMC_MANDI_AUCTION');
  const [newOwner, setNewOwner] = useState(currentLang === 'ta' ? 'கோயம்பேடு மொத்த வர்த்தக சங்கம்' : 'Koyambedu APMC Trader Co-op');
  const [location, setLocation] = useState(currentLang === 'ta' ? 'கோயம்பேடு மார்க்கெட், சென்னை' : 'Koyambedu Terminal Yard, Chennai');
  const [notes, setNotes] = useState(currentLang === 'ta' ? 'மண்டி எடை சரிபார்க்கப்பட்டது, தர பரிசோதனை முடிந்தது.' : 'Mandi weighment verified at gate.');

  const [inspectionData, setInspectionData] = useState({
    qualityStatus: 'Standard',
    confidence: 0,
    discountApplied: 0,
    adjustedPrice: 0,
    originalPrice: 0
  });

  const [submitting, setSubmitting] = useState(false);
  const [successBlock, setSuccessBlock] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (initialBatchId) {
      setSelectedBatchId(initialBatchId);
      loadBatchDetails(initialBatchId);
    } else if (batches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(batches[0].batchId);
      loadBatchDetails(batches[0].batchId);
    }
  }, [initialBatchId, batches]);

  const loadBatchDetails = async (id) => {
    if (!id) return;
    setLoadingBatch(true);
    setErrorMsg(null);
    setSuccessBlock(null);
    try {
      const res = await getBatch(id);
      if (res?.success) {
        setBatchData(res);
        setInspectionData(prev => ({
          ...prev,
          originalPrice: res.currentPrice,
          adjustedPrice: res.currentPrice
        }));
      } else {
        setErrorMsg(res?.error || 'Batch not found.');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoadingBatch(false);
    }
  };

  const handleInspectionComplete = (data) => {
    setInspectionData(data);
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatchId) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const currentNominal = batchData?.currentPrice || 0;
      const finalAdjusted = inspectionData?.adjustedPrice !== undefined && inspectionData?.qualityStatus === 'Damaged'
        ? inspectionData.adjustedPrice
        : currentNominal;

      const payload = {
        stage,
        owner: newOwner,
        location,
        price: currentNominal,
        adjustedPrice: finalAdjusted,
        qualityStatus: inspectionData?.qualityStatus || 'Standard',
        damageConfidence: inspectionData?.confidence || 0,
        discountApplied: inspectionData?.discountApplied || 0,
        notes: notes + (inspectionData?.qualityStatus === 'Damaged' ? ' [AI Damage Detected: 20% markdown applied]' : '')
      };

      const result = await transferBatch(selectedBatchId, payload);

      if (result?.success) {
        setSuccessBlock(result.block);
        if (onTransferCompleted) onTransferCompleted(selectedBatchId);
        loadBatchDetails(selectedBatchId);
        try {
          confetti({ particleCount: 70, spread: 50, origin: { y: 0.7 } });
        } catch (e) {}
      } else {
        setErrorMsg(result?.error || 'Transfer failed.');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="transfer-portal-page">
      <header className="page-header">
        <h1 className="page-title">
          <ArrowRightLeft className="w-8 h-8 text-emerald-400" />
          {t.transferHeroTitle}
        </h1>
        <p className="page-subtitle">
          {t.transferHeroDesc}
        </p>
      </header>

      {/* Batch Selector Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>
            {t.selectBatchToTransfer}
          </label>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <select
              className="form-select"
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                loadBatchDetails(e.target.value);
              }}
            >
              <option value="">-- Choose Batch ID --</option>
              {batches.map((b) => (
                <option key={b.batchId} value={b.batchId}>
                  {b.batchId} — {b.crop} ({b.currentOwner})
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => loadBatchDetails(selectedBatchId)}
            className="btn btn-secondary"
            style={{ padding: '0.65rem 1rem' }}
          >
            <RefreshCw className={`w-4 h-4 ${loadingBatch ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {batchData && (
        <div className="card">
          {/* Current Batch Status Banner */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img 
                  src={getCropImage(batchData.crop)}
                  alt={batchData.crop}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    objectFit: 'cover',
                    border: '1.5px solid rgba(52, 211, 153, 0.4)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    flexShrink: 0
                  }}
                />
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
                    {t.currentCustodyRecord}
                  </span>
                  <h3 style={{ margin: '0.2rem 0', fontSize: '1.3rem', color: '#fff' }}>
                    {batchData.crop} ({batchData.quantity} {batchData.unit})
                  </h3>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{t.currentStageAndPrice}</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                  {batchData.currentStage} • <span style={{ color: '#34d399' }}>₹{Number(batchData.currentPrice).toFixed(2)}/{batchData.unit}</span>
                </div>
              </div>
            </div>

            <div className="block-meta-grid" style={{ marginTop: '0.75rem', background: 'transparent', padding: 0 }}>
              <div className="meta-item">
                <span className="meta-label">தற்போதைய பொறுப்பாளர் (Custodian)</span>
                <span className="meta-val">{batchData.currentOwner}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">இடம் (Location)</span>
                <span className="meta-val">{batchData.currentLocation}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">பதிவு தொகுதிகள் (Blocks)</span>
                <span className="meta-val">{batchData.blockCount} blocks</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">அரசு தணிக்கை (Audit)</span>
                <span className="meta-val" style={{ color: batchData.integrity?.isValid ? '#34d399' : '#ef4444' }}>
                  {batchData.integrity?.isValid ? 'VERIFIED HEALTHY' : 'COMPROMISED'}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleTransferSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">{t.nextStageLabel}</label>
                <select
                  className="form-select"
                  value={stage}
                  onChange={(e) => {
                    setStage(e.target.value);
                    if (e.target.value === 'GOVT_COLD_STORAGE') {
                      setNewOwner(currentLang === 'ta' ? 'அரசு குளிர்பதன கிடங்கு வாரியம்' : 'Tamil Nadu State Warehousing Corp');
                      setLocation(currentLang === 'ta' ? 'திண்டுக்கல் கிடங்கு, தமிழ்நாடு' : 'Dindigul Cold Hub, TN');
                    } else if (e.target.value === 'WHOLESALE_TRADER') {
                      setNewOwner(currentLang === 'ta' ? 'ஈரோடு மொத்த வர்த்தக சங்கம்' : 'Erode Wholesale Mandi Traders Assn');
                      setLocation(currentLang === 'ta' ? 'ஈரோடு APMC யார்டு' : 'Erode Regulated Market Yard');
                    } else if (e.target.value === 'RETAIL_KIRANA_RATION') {
                      setNewOwner(currentLang === 'ta' ? 'சென்னை கூட்டுறவு நியாயவிலை அங்காடி' : 'Chennai Consumer Co-op Supermarket');
                      setLocation(currentLang === 'ta' ? 'அண்ணா நகர், சென்னை' : 'Anna Nagar, Chennai');
                    }
                  }}
                  required
                >
                  {INDIAN_STAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {currentLang === 'ta' ? opt.labelTa : opt.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t.newOwnerLabel}</label>
                <input
                  type="text"
                  className="form-input"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.transferLocationLabel}</label>
                <input
                  type="text"
                  className="form-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">{t.transferNotesLabel}</label>
                <textarea
                  className="form-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Subagent 4: Multilingual AI Produce Quality Scanner */}
            <DamageCheck
              originalPrice={batchData.currentPrice}
              cropName={batchData.crop}
              currentLang={currentLang}
              onInspectionComplete={handleInspectionComplete}
            />

            {errorMsg && (
              <div style={{ margin: '1rem 0', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="submit"
                id="btn-submit-mandi-transfer"
                disabled={submitting}
                className="btn btn-primary"
                style={{ padding: '0.85rem 2rem', fontSize: '1.05rem', fontWeight: 700 }}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t.signingTransfer}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t.btnSignTransfer}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Success Banner */}
          {successBlock && (
            <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h4 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>
                      {t.transferSuccessTitle} (Block #{successBlock.index})
                    </h4>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>
                      SHA-256 Link: {successBlock.previousHash.slice(0, 16)}... ➔ {successBlock.hash.slice(0, 16)}...
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTrack(selectedBatchId)}
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                >
                  <span>{t.btnViewPublicTracker}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
