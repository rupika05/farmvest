import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFarmVest } from '../../context/FarmVestContext';
import { getCropImage } from '../../utils/cropImages';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck, CheckCircle2, AlertTriangle, QrCode, ArrowLeft,
  Sprout, Clock, MapPin, Award, Layers, Lock, ExternalLink,
  ChevronDown, ChevronUp, RefreshCw, X, Package
} from 'lucide-react';

/**
 * PublicVerifyPage — No login required
 * Shows the full product passport for a given batchId
 * Accessed via /verify/:batchId URL or from the batchId state prop
 */
export default function PublicVerifyPage({ batchId: propBatchId }) {
  const { setActiveView } = useAuth();
  const { products, batches, blocks } = useFarmVest();

  const [loading, setLoading] = useState(true);
  const [passport, setPassport] = useState(null);
  const [error, setError] = useState(null);
  const [inputBatchId, setInputBatchId] = useState(propBatchId || '');
  const [showLedger, setShowLedger] = useState(false);
  const [showJourney, setShowJourney] = useState(true);

  // Resolve batch from URL hash or state
  useEffect(() => {
    // Check URL hash or path: /verify/FV-TOM-123
    const hash = window.location.hash;
    const path = window.location.pathname;
    const match = hash.match(/\/verify\/([^/?#]+)/) || path.match(/\/verify\/([^/?#]+)/);
    const urlBatchId = match ? match[1] : null;
    const resolvedId = propBatchId || urlBatchId;
    if (resolvedId) {
      setInputBatchId(resolvedId);
      loadPassport(resolvedId);
    } else {
      setLoading(false);
    }
  }, [propBatchId]);

  const loadPassport = async (id) => {
    setLoading(true);
    setError(null);
    try {
      // Try server first
      const res = await fetch(`http://localhost:5000/api/verify/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPassport(data);
        setLoading(false);
        return;
      }
    } catch { }

    // Fallback to localStorage
    const product = products.find(p => p.batchId === id);
    const batch = batches.find(b => b.batchId === id);
    const ledger = blocks.filter(b => b.batchId === id);

    if (!product && !batch) {
      setError(`No product found for batch ID: "${id}". Please check the QR code or batch ID.`);
      setLoading(false);
      return;
    }

    // Local chain integrity check
    const chainIssues = [];
    for (let i = 1; i < ledger.length; i++) {
      if (ledger[i].previousHash !== ledger[i-1].hash && ledger[i].previousId !== ledger[i-1].id) {
        chainIssues.push({ at: i, event: ledger[i].event });
      }
    }

    setPassport({
      batchId: id,
      product: product || null,
      batch: batch || null,
      ledger,
      chainVerification: { valid: chainIssues.length === 0, totalEntries: ledger.length, issues: chainIssues, verifiedAt: new Date().toISOString() },
      source: 'local',
    });
    setLoading(false);
  };

  const handleSearch = () => {
    if (inputBatchId.trim()) loadPassport(inputBatchId.trim().toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#E6EFE3] flex items-center justify-center mx-auto animate-pulse">
            <ShieldCheck className="w-8 h-8 text-[#2B4C26]" />
          </div>
          <p className="text-sm font-bold text-[#1F361C]">Verifying product passport…</p>
        </div>
      </div>
    );
  }

  const prod = passport?.product;
  const batch = passport?.batch;
  const ledger = passport?.ledger || [];
  const chain = passport?.chainVerification;
  const item = prod || batch;
  const cropImg = item ? getCropImage(item) : 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="min-h-screen bg-[#FAF7F0] pb-16">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-[#FAF7F0]/95 backdrop-blur border-b border-[#7DA972]/20 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setActiveView('landing')} className="flex items-center gap-1.5 text-xs font-bold text-[#2B4C26] hover:underline cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" /> FarmVest Home
        </button>
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#2B4C26]">
          <QrCode className="w-4 h-4" /> Product Passport Verification
        </div>
        <div className="w-20" />
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">

        {/* Search bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputBatchId}
            onChange={e => setInputBatchId(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Enter Batch ID (e.g. FV-TOM-123)"
            className="flex-1 p-3 rounded-2xl border border-[#7DA972]/30 text-sm font-mono focus:outline-none focus:border-[#2B4C26] bg-white shadow-sm"
          />
          <button onClick={handleSearch} className="px-5 py-3 rounded-2xl bg-[#2B4C26] text-white font-bold text-xs cursor-pointer hover:bg-[#386332] shadow-md flex items-center gap-1.5">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Verify
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Product Not Found</div>
              <div className="text-xs mt-0.5">{error}</div>
            </div>
          </div>
        )}

        {!passport && !error && !loading && (
          <div className="ghibli-card p-10 text-center bg-white space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#E6EFE3] text-3xl flex items-center justify-center mx-auto">🔍</div>
            <h3 className="font-display font-bold text-xl text-[#1F361C]">Scan or Enter Batch ID</h3>
            <p className="text-xs text-[#62432B]/80 max-w-sm mx-auto">
              Enter the Batch ID printed on the product QR label or scan the QR code with your camera to verify authenticity and trace the supply chain journey.
            </p>
            <div className="text-[10px] text-[#62432B]/60">No login required — public access</div>
          </div>
        )}

        {/* Product Passport */}
        {passport && item && (
          <div className="space-y-4">
            {/* Hero card */}
            <div className="ghibli-card-elevated overflow-hidden bg-white">
              <div className="relative h-48">
                <img src={cropImg} alt={item.name || item.productName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1F361C]/90 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display font-extrabold text-2xl">{item.name || item.productName}</h2>
                      <div className="text-sm text-white/80">
                        {item.category} • {item.quantity || item.totalQuantity} {item.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#A5D6A7]">BATCH</div>
                      <div className="font-mono text-sm font-bold">{passport.batchId}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chain integrity badge */}
              <div className={`px-5 py-3 flex items-center justify-between ${chain?.valid ? 'bg-[#E6EFE3]' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2">
                  {chain?.valid
                    ? <CheckCircle2 className="w-5 h-5 text-[#4EA858]" />
                    : <AlertTriangle className="w-5 h-5 text-red-600" />
                  }
                  <div>
                    <div className={`text-sm font-bold ${chain?.valid ? 'text-[#2B4C26]' : 'text-red-800'}`}>
                      {chain?.valid ? 'Provenance Verified' : 'Verification Issues Found'}
                    </div>
                    <div className="text-[10px] text-[#5F8A55]">
                      {chain?.totalEntries || 0} ledger entries • Checked at {new Date(chain?.verifiedAt || Date.now()).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <QRCodeSVG value={`${window.location.origin}/verify/${passport.batchId}`} size={52} level="H" />
              </div>

              {/* Key info */}
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    { label: '🌾 Farmer', value: item.farmerName || batch?.farmerName || '—' },
                    { label: '📍 Origin', value: item.location || item.farmerLocation || batch?.location || '—' },
                    { label: '📅 Harvest', value: item.harvestDate || batch?.harvestDate || '—' },
                    { label: '⚖️ Quantity', value: `${item.quantity || item.totalQuantity || '—'} ${item.unit || 'kg'}` },
                    { label: '💰 Price', value: `₹${item.pricePerKg || '—'}/${item.unit || 'kg'}` },
                    { label: '📦 Custodian', value: item.currentCustodianRole === 'merchant' ? `🏪 ${item.currentCustodianName}` : `🌾 ${item.currentCustodianName || '—'}` },
                  ].map(row => (
                    <div key={row.label} className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/20">
                      <div className="text-[10px] text-[#62432B] uppercase font-bold">{row.label}</div>
                      <div className="font-bold text-[#1F361C] mt-0.5 leading-tight">{row.value}</div>
                    </div>
                  ))}
                </div>

                {/* AI Grade */}
                {(item.aiGrade || batch?.aiGrade) && (() => {
                  const grade = item.aiGrade || batch?.aiGrade;
                  return (
                    <div className={`p-3 rounded-xl border flex items-center justify-between ${grade.grade?.includes('A') ? 'bg-[#E6EFE3] border-[#7DA972]/40' : 'bg-amber-50 border-amber-200'}`}>
                      <div>
                        <div className="text-[10px] font-bold text-[#62432B] uppercase">AI Quality Grade</div>
                        <div className="font-display font-extrabold text-lg text-[#2B4C26]">{grade.grade}</div>
                        <div className="text-[10px] text-[#5F8A55]">Score: {grade.score}/100 • Confidence: {grade.confidence}%</div>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-[#2B4C26] text-white flex flex-col items-center justify-center">
                        <span className="font-extrabold text-lg leading-none">{grade.score}</span>
                        <span className="text-[9px]">/100</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Authenticity report */}
                {(item.authenticityReport || batch?.authenticityReport) && (() => {
                  const auth = item.authenticityReport || batch?.authenticityReport;
                  return (
                    <div className={`p-3 rounded-xl border text-xs ${auth.level === 'high' ? 'bg-[#E6EFE3] border-[#4EA858]/40' : 'bg-amber-50 border-amber-200'}`}>
                      <div className="font-bold text-[#1F361C] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Authenticity: {auth.levelLabel}
                      </div>
                      <div className="text-[#62432B] text-[10px] mt-0.5">{auth.passedCount}/{auth.totalChecks} verification checks passed</div>
                      {auth.location && <div className="text-[10px] text-[#5F8A55]">📍 GPS verified: {auth.location.lat}, {auth.location.lng}</div>}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Supply Chain Journey */}
            {(batch?.journey || []).length > 0 && (
              <div className="ghibli-card bg-white">
                <button onClick={() => setShowJourney(!showJourney)} className="w-full p-4 flex items-center justify-between text-sm font-bold text-[#1F361C] cursor-pointer">
                  <span className="flex items-center gap-2"><Layers className="w-4 h-4 text-[#0284C7]" /> Supply Chain Journey</span>
                  {showJourney ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showJourney && (
                  <div className="px-4 pb-4 space-y-2">
                    {batch.journey.map((step, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold ${
                          step.role === 'farmer' ? 'bg-[#2B4C26]' : step.role === 'merchant' ? 'bg-[#D9822B]' : 'bg-[#0284C7]'
                        }`}>{i + 1}</div>
                        <div className="flex-1 pt-1">
                          <div className="font-bold text-[#1F361C]">{step.event}</div>
                          <div className="text-[#62432B] mt-0.5">{step.note}</div>
                          <div className="text-[10px] text-[#5F8A55]">{step.actor} ({step.role}) • {new Date(step.timestamp).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Ledger entries */}
            {ledger.length > 0 && (
              <div className="ghibli-card bg-white">
                <button onClick={() => setShowLedger(!showLedger)} className="w-full p-4 flex items-center justify-between text-sm font-bold text-[#1F361C] cursor-pointer">
                  <span className="flex items-center gap-2"><Lock className="w-4 h-4 text-[#0284C7]" /> Ledger Entries ({ledger.length})</span>
                  {showLedger ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showLedger && (
                  <div className="px-4 pb-4 space-y-2">
                    {ledger.map((entry, i) => (
                      <div key={entry.id || i} className="p-3 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/20 text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-[10px] bg-[#0284C7] text-white px-1.5 py-0.5 rounded-full">#{entry.blockIndex}</span>
                          <span className="font-bold text-[#1F361C]">{entry.event}</span>
                        </div>
                        <div className="text-[#62432B]/80">{typeof entry.details === 'string' ? entry.details.slice(0, 100) : ''}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9px] text-[#5F8A55]">{new Date(entry.timestamp).toLocaleString()}</span>
                          <span className="font-mono text-[9px] text-[#62432B]/50">{(entry.hash || entry.txHash || '').slice(0, 20)}…</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-[10px] text-amber-800 leading-relaxed">
              <strong>⚠️ Transparency Notice:</strong> This product passport is provided by FarmVest. The supply chain data is recorded in a <strong>private hash-chained server-side ledger</strong>, not a public decentralized blockchain. Provenance data is maintained by the FarmVest platform operator. AI quality grades are simulation estimates.
            </div>

            {/* Footer CTA */}
            <div className="text-center text-xs text-[#62432B]/70 pb-4">
              Powered by <strong className="text-[#2B4C26]">FarmVest</strong> — Cultivating Fair Trade 🌱
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
