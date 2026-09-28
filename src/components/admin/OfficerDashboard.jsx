import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFarmVest } from '../../context/FarmVestContext';
import { getCropImage } from '../../utils/cropImages';
import {
  ShieldCheck, Layers, TrendingUp, Package, Coins, Activity,
  Search, Eye, CheckCircle2, AlertTriangle, BarChart3, RefreshCw,
  Users, Lock, FileText, ArrowRight, Sprout, Clock, CheckCircle,
  QrCode, ChevronDown, ChevronRight, X, Award
} from 'lucide-react';

function MetricCard({ label, value, sub, icon: Icon, color = 'text-[#1F361C]', bg = 'bg-white' }) {
  return (
    <div className={`ghibli-card p-4 ${bg} space-y-1`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase text-[#62432B]">{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${color}`} />}
      </div>
      <div className={`font-display font-extrabold text-2xl ${color}`}>{value}</div>
      {sub && <span className="text-[10px] text-[#5F8A55]">{sub}</span>}
    </div>
  );
}

const STATUS_STYLES = {
  'Created':           { bg: 'bg-gray-100',   text: 'text-gray-700',   icon: '📦' },
  'Ordered':           { bg: 'bg-blue-100',    text: 'text-blue-800',   icon: '🛒' },
  'Waiting for Handover': { bg: 'bg-amber-100', text: 'text-amber-800', icon: '⏳' },
  'Handover Accepted': { bg: 'bg-indigo-100',  text: 'text-indigo-800', icon: '🤝' },
  'Inspected':         { bg: 'bg-purple-100',  text: 'text-purple-800', icon: '🔍' },
  'With Merchant':     { bg: 'bg-cyan-100',    text: 'text-cyan-800',   icon: '🏪' },
  'Delivered':         { bg: 'bg-green-100',   text: 'text-green-800',  icon: '✅' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: '❓' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${s.bg} ${s.text}`}>
      {s.icon} {status}
    </span>
  );
}

export default function OfficerDashboard() {
  const { currentUser } = useAuth();
  const { products, orders, batches, blocks, verifyChain, clearAllData } = useFarmVest();
  const [nav, setNav] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [chainReport, setChainReport] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [serverLedger, setServerLedger] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Metrics
  const totalBatches = batches.length;
  const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
  const activeOrders = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length;
  const totalEscrow = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const uniqueFarmers = new Set(products.map(p => p.farmerId || p.farmerName)).size;
  const uniqueMerchants = new Set(orders.map(o => o.merchantId || o.merchantName)).size;

  // Filtered batches
  const filteredBatches = batches.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (b.batchId || '').toLowerCase().includes(q) ||
           (b.productName || '').toLowerCase().includes(q) ||
           (b.farmerName || '').toLowerCase().includes(q) ||
           (b.merchantName || '').toLowerCase().includes(q) ||
           (b.status || '').toLowerCase().includes(q);
  });

  const filteredOrders = orders.filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (o.productName || '').toLowerCase().includes(q) ||
           (o.batchId || '').toLowerCase().includes(q) ||
           (o.farmerName || '').toLowerCase().includes(q) ||
           (o.merchantName || '').toLowerCase().includes(q);
  });

  // Run chain integrity check
  const runVerification = async () => {
    setVerifying(true);
    await new Promise(r => setTimeout(r, 800)); // brief UX delay
    const report = verifyChain();
    setChainReport(report);
    setVerifying(false);
  };

  // Fetch server-side ledger
  const fetchServerLedger = async () => {
    const token = localStorage.getItem('farmvest_token_v3');
    if (!token) return;
    setLoadingLedger(true);
    try {
      const res = await fetch('http://localhost:5000/api/ledger', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setServerLedger(data.ledger || []);
      }
    } catch { }
    setLoadingLedger(false);
  };

  useEffect(() => {
    if (nav === 'ledger') fetchServerLedger();
  }, [nav]);

  const ledgerEntries = serverLedger.length > 0 ? serverLedger : blocks;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'batches', label: 'All Batches', icon: Layers, badge: totalBatches },
    { id: 'orders', label: 'Trade Orders', icon: Package, badge: orders.length },
    { id: 'ledger', label: 'Supply Chain Ledger', icon: Lock },
    { id: 'users', label: 'Network Participants', icon: Users },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#E0F2FE] to-[#BAE6FD] border border-[#BAE6FD] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#0284C7]/10 text-xs text-[#0284C7] font-semibold border border-[#0284C7]/20">
            🛡️ Officer Portal • {currentUser?.businessName || currentUser?.name}
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0c1a2e]">
            Welcome, {currentUser?.name?.split(' ')[0] || currentUser?.businessName || 'Officer'} 🛡️
          </h1>
          <p className="text-xs text-[#0369A1]">Monitor all batches, verify hash-chain integrity, audit trades & ensure compliance</p>
        </div>
        <button onClick={runVerification} disabled={verifying}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#0284C7] to-[#0369A1] text-white font-extrabold text-xs shadow-lg flex items-center gap-2 cursor-pointer self-start">
          {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          Verify Chain Integrity
        </button>
      </div>

      {/* Chain verification result */}
      {chainReport && (
        <div className={`p-4 rounded-2xl border flex items-start justify-between gap-4 ${chainReport.valid ? 'bg-[#E6EFE3] border-[#4EA858]' : 'bg-red-50 border-red-300'}`}>
          <div className="flex items-start gap-3">
            {chainReport.valid ? <CheckCircle2 className="w-5 h-5 text-[#4EA858] flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
            <div>
              <div className={`font-bold text-sm ${chainReport.valid ? 'text-[#2B4C26]' : 'text-red-800'}`}>
                {chainReport.valid ? '✓ Local Ledger Chain Integrity Verified' : '⚠ Chain Integrity Issues Detected'}
              </div>
              <div className="text-xs text-[#62432B] mt-0.5">
                {chainReport.totalBlocks} blocks verified • {chainReport.issues?.length || 0} issues found • Verified at {new Date(chainReport.verifiedAt).toLocaleTimeString()}
              </div>
              {chainReport.issues?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {chainReport.issues.map((issue, i) => (
                    <div key={i} className="text-[10px] text-red-700 font-mono">Block #{issue.blockIndex}: {issue.event} — hash mismatch</div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setChainReport(null)} className="p-1 hover:bg-black/10 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-3">
          <div className="ghibli-card p-3 bg-white space-y-1.5 shadow-sm sticky top-24">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#825D3E] px-3 py-1 block">Officer Controls</span>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setNav(item.id)}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  nav === item.id ? 'bg-[#0284C7] text-white shadow-md' : 'text-[#1F361C] hover:bg-[#FAF7F0]'
                }`}>
                <div className="flex items-center gap-2.5">
                  <item.icon className={`w-4 h-4 ${nav === item.id ? 'text-white' : 'text-[#0284C7]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge != null && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${nav === item.id ? 'bg-white/20 text-white' : 'bg-[#E0F2FE] text-[#0369A1]'}`}>{item.badge}</span>
                )}
              </button>
            ))}
            <div className="pt-2 border-t border-[#7DA972]/20">
              <button onClick={clearAllData} className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" /> Reset All Data
              </button>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="lg:col-span-9 space-y-6">

          {/* ── OVERVIEW ── */}
          {nav === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
                <MetricCard label="Total Batches" value={totalBatches} sub={`${deliveredOrders} delivered`} icon={Layers} color="text-[#2B4C26]" />
                <MetricCard label="Active Trades" value={activeOrders} sub="In progress" icon={Activity} color="text-[#D9822B]" />
                <MetricCard label="Ledger Entries" value={blocks.length} sub="Hash-chained" icon={Lock} color="text-[#0284C7]" />
                <MetricCard label="Farmers" value={uniqueFarmers} sub="Network nodes" icon={Sprout} color="text-[#4EA858]" />
                <MetricCard label="Merchants" value={uniqueMerchants} sub="Buyers" icon={Package} color="text-[#D9822B]" />
                <MetricCard label="Total Escrow" value={`₹${totalEscrow.toLocaleString()}`} sub="0% platform cut" icon={Coins} color="text-[#2B4C26]" />
              </div>

              {/* Recent activity */}
              <div className="ghibli-card-elevated p-5 bg-white space-y-3">
                <h3 className="font-display font-bold text-lg text-[#1F361C]">Recent Supply Chain Activity</h3>
                {blocks.slice(0, 8).map((block, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/20 text-xs">
                    <div className="w-6 h-6 rounded-full bg-[#0284C7] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">{block.blockIndex}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#1F361C] truncate">{block.event}</div>
                      {block.batchId && <div className="text-[10px] font-mono text-[#5F8A55]">Batch: {block.batchId}</div>}
                      <div className="text-[10px] text-[#62432B]/70">{new Date(block.timestamp).toLocaleString()}</div>
                    </div>
                    <div className="text-[10px] font-mono text-[#62432B]/60 hidden sm:block truncate max-w-[120px]">{(block.hash || block.txHash || '').slice(0, 16)}…</div>
                  </div>
                ))}
                {blocks.length === 0 && <div className="text-xs text-[#62432B] text-center py-4">No ledger entries yet.</div>}
              </div>
            </div>
          )}

          {/* ── ALL BATCHES ── */}
          {nav === 'batches' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-display font-bold text-xl text-[#1F361C]">All Batches</h3>
                  <p className="text-xs text-[#62432B]/80">Full supply chain view of every batch in the network</p>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#5F8A55] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search batches..."
                    className="pl-9 pr-3 py-2 rounded-xl border border-[#7DA972]/30 text-xs focus:outline-none w-52 bg-white" />
                </div>
              </div>

              {filteredBatches.length === 0 ? (
                <div className="ghibli-card p-10 text-center bg-white text-xs text-[#62432B]">No batches in the system yet.</div>
              ) : (
                <div className="space-y-3">
                  {filteredBatches.map(batch => (
                    <div key={batch.id} className={`ghibli-card p-4 bg-white border cursor-pointer hover:border-[#0284C7]/40 transition-all ${selectedBatch?.id === batch.id ? 'border-[#0284C7]' : 'border-[#7DA972]/30'}`}
                      onClick={() => setSelectedBatch(selectedBatch?.id === batch.id ? null : batch)}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-[#5F8A55]">{batch.batchId}</span>
                            <StatusBadge status={batch.journeyStatus || batch.status} />
                          </div>
                          <div className="font-bold text-sm text-[#1F361C] mt-0.5">{batch.productName} — {batch.quantity} {batch.unit}</div>
                          <div className="text-xs text-[#62432B] mt-0.5">
                            🌾 {batch.farmerName} {batch.merchantName ? `→ 🏪 ${batch.merchantName}` : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {batch.aiGrade?.grade && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E6EFE3] text-[#2B4C26]">
                              {batch.aiGrade.grade}
                            </span>
                          )}
                          {selectedBatch?.id === batch.id ? <ChevronDown className="w-4 h-4 text-[#62432B]" /> : <ChevronRight className="w-4 h-4 text-[#62432B]" />}
                        </div>
                      </div>

                      {selectedBatch?.id === batch.id && (
                        <div className="mt-4 pt-4 border-t border-[#7DA972]/20 space-y-4">
                          {/* Journey timeline */}
                          <div>
                            <div className="text-xs font-bold text-[#1F361C] mb-2">Supply Chain Journey</div>
                            <div className="space-y-2">
                              {(batch.journey || []).map((j, i) => (
                                <div key={i} className="flex items-start gap-2.5 text-[11px]">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[9px] font-bold ${
                                    j.role === 'farmer' ? 'bg-[#2B4C26]' : j.role === 'merchant' ? 'bg-[#D9822B]' : 'bg-[#0284C7]'
                                  }`}>{i + 1}</div>
                                  <div className="flex-1">
                                    <span className="font-bold text-[#1F361C]">{j.event}</span>
                                    <span className="text-[#62432B] ml-1">— {j.note}</span>
                                    <div className="text-[9px] text-[#5F8A55]">{j.actor} ({j.role}) • {new Date(j.timestamp).toLocaleString()}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Tech details */}
                          {batch.genesisBlockHash && (
                            <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/20">
                              <div className="text-[10px] font-bold text-[#1F361C] mb-1">Genesis Block Hash</div>
                              <div className="font-mono text-[9px] text-[#5F8A55] break-all">{batch.genesisBlockHash}</div>
                            </div>
                          )}

                          {/* Authenticity report */}
                          {batch.authenticityReport && (
                            <div className={`p-2.5 rounded-xl border text-[10px] ${batch.authenticityReport.level === 'high' ? 'bg-[#E6EFE3] border-[#4EA858]/40' : 'bg-amber-50 border-amber-200'}`}>
                              <div className="font-bold text-[#1F361C]">Authenticity: {batch.authenticityReport.levelLabel}</div>
                              <div className="text-[#62432B]">{batch.authenticityReport.passedCount}/{batch.authenticityReport.totalChecks} checks passed</div>
                              {batch.authenticityReport.location && (
                                <div className="text-[#5F8A55]">📍 GPS: {batch.authenticityReport.location.lat}, {batch.authenticityReport.location.lng}</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TRADE ORDERS ── */}
          {nav === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-display font-bold text-xl text-[#1F361C]">All Trade Orders</h3>
                  <p className="text-xs text-[#62432B]/80">Full visibility into every Farmer↔Merchant transaction</p>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#5F8A55] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search orders..."
                    className="pl-9 pr-3 py-2 rounded-xl border border-[#7DA972]/30 text-xs focus:outline-none w-52 bg-white" />
                </div>
              </div>
              {filteredOrders.length === 0 ? (
                <div className="ghibli-card p-10 text-center bg-white text-xs text-[#62432B]">No orders in the system.</div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map(order => (
                    <div key={order.id} className="ghibli-card p-4 bg-white border border-[#7DA972]/30 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-[#1F361C]">{order.productName}</div>
                          <div className="text-xs text-[#5F8A55]">{order.quantity} {order.unit || 'kg'} • ₹{order.totalAmount} • {order.farmerName} → {order.merchantName}</div>
                          <div className="text-[10px] font-mono text-[#62432B]">Batch: {order.batchId} • Order: {order.id}</div>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                      {order.damageInspection && (
                        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800">
                          🔍 Inspection: {order.damageInspection.summary} {order.damageInspection.adjustmentPct > 0 ? `(${order.damageInspection.adjustmentPct}% deduction)` : ''}
                        </div>
                      )}
                      {order.paymentTxId && (
                        <div className="text-[10px] font-mono text-[#4EA858]">✓ TxID: {order.paymentTxId}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SUPPLY CHAIN LEDGER ── */}
          {nav === 'ledger' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-display font-bold text-xl text-[#1F361C]">Supply Chain Ledger</h3>
                  <p className="text-xs text-[#62432B]/80">Hash-chained provenance log — NOT a public blockchain, this is a private server-side ledger</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={fetchServerLedger} disabled={loadingLedger} className="px-3 py-2 rounded-xl border border-[#7DA972]/30 text-xs font-bold text-[#2B4C26] hover:bg-[#E6EFE3] cursor-pointer flex items-center gap-1.5">
                    {loadingLedger ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
                  </button>
                  <button onClick={runVerification} disabled={verifying} className="px-3 py-2 rounded-xl bg-[#0284C7] text-white text-xs font-bold cursor-pointer flex items-center gap-1.5">
                    {verifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />} Verify
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-800">
                ⚠️ <strong>Transparency Notice:</strong> This ledger is a <strong>private hash-chained server-side record</strong> — not a public decentralized blockchain. It is tamper-evident within the FarmVest system but is managed by the FarmVest operator. Hashes use SHA-256.
              </div>

              {ledgerEntries.length === 0 ? (
                <div className="ghibli-card p-10 text-center bg-white text-xs text-[#62432B]">No ledger entries yet. Create a batch to begin.</div>
              ) : (
                <div className="space-y-2">
                  {ledgerEntries.slice(0, 50).map((entry, i) => (
                    <div key={entry.id || i} className="ghibli-card p-3.5 bg-white border border-[#7DA972]/20 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#0284C7] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {entry.blockIndex}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="font-bold text-xs text-[#1F361C]">{entry.event}</div>
                        {entry.batchId && <div className="text-[10px] font-mono text-[#0284C7]">Batch: {entry.batchId}</div>}
                        <div className="text-[10px] text-[#62432B]/70 truncate">{typeof entry.details === 'string' ? entry.details.slice(0, 120) : JSON.stringify(entry.details).slice(0, 120)}</div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-[#5F8A55]">
                          <span>Actor: {entry.actor}</span>
                          <span>{new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="hidden sm:block text-[9px] font-mono text-[#62432B]/50 text-right max-w-[100px]">
                        <div>Hash:</div>
                        <div className="truncate">{(entry.hash || entry.txHash || '').slice(0, 16)}…</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── NETWORK PARTICIPANTS ── */}
          {nav === 'users' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-display font-bold text-xl text-[#1F361C]">Network Participants</h3>
                <p className="text-xs text-[#62432B]/80">Farmers and merchants in the FarmVest supply chain</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Farmers */}
                <div className="ghibli-card p-4 bg-white space-y-3">
                  <h4 className="font-bold text-sm text-[#1F361C] flex items-center gap-2"><Sprout className="w-4 h-4 text-[#4EA858]" /> Farmers ({uniqueFarmers})</h4>
                  {products.length === 0 ? <div className="text-xs text-[#62432B]">No farmers yet.</div> : (
                    [...new Map(products.map(p => [p.farmerId || p.farmerName, p])).values()].map(p => (
                      <div key={p.farmerId || p.farmerName} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/20">
                        <div className="w-8 h-8 rounded-full bg-[#2B4C26] text-white flex items-center justify-center text-xs font-bold">
                          {(p.farmerName || 'F').charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-[#1F361C]">{p.farmerName}</div>
                          <div className="text-[10px] text-[#5F8A55]">{p.location} • {products.filter(pr => pr.farmerId === p.farmerId || pr.farmerName === p.farmerName).length} products</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Merchants */}
                <div className="ghibli-card p-4 bg-white space-y-3">
                  <h4 className="font-bold text-sm text-[#1F361C] flex items-center gap-2"><Package className="w-4 h-4 text-[#D9822B]" /> Merchants ({uniqueMerchants})</h4>
                  {orders.length === 0 ? <div className="text-xs text-[#62432B]">No merchants yet.</div> : (
                    [...new Map(orders.filter(o => o.merchantName).map(o => [o.merchantId || o.merchantName, o])).values()].map(o => (
                      <div key={o.merchantId || o.merchantName} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FDF3E3] border border-[#F6D28B]/40">
                        <div className="w-8 h-8 rounded-full bg-[#D9822B] text-white flex items-center justify-center text-xs font-bold">
                          {(o.merchantName || 'M').charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-[#1F361C]">{o.merchantName}</div>
                          <div className="text-[10px] text-[#D9822B]">{orders.filter(or => or.merchantId === o.merchantId || or.merchantName === o.merchantName).length} orders placed</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
