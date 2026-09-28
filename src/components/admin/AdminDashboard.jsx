import React, { useState } from 'react';
import { useFarmVest } from '../../context/FarmVestContext';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Cpu, 
  Layers, 
  TrendingUp, 
  Users, 
  Truck, 
  Store, 
  Coins, 
  Activity, 
  Sparkles,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Search,
  Eye,
  XCircle,
  AlertTriangle,
  Package,
  FileText,
  ArrowLeft
} from 'lucide-react';

export default function AdminDashboard() {
  const { blocks, products, orders, activeOrder } = useFarmVest();
  const { setActiveView } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'trades', 'ledger'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState(null);

  // Combine orders and activeOrder for full trade list
  const allTrades = [...(orders || [])];
  if (activeOrder && !allTrades.find(o => o.id === activeOrder.id)) {
    allTrades.unshift(activeOrder);
  }

  const filteredTrades = allTrades.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.productName || '').toLowerCase().includes(q) ||
      (t.batchId || '').toLowerCase().includes(q) ||
      (t.farmerName || '').toLowerCase().includes(q) ||
      (t.retailerName || '').toLowerCase().includes(q) ||
      (t.status || '').toLowerCase().includes(q) ||
      (t.id || '').toLowerCase().includes(q)
    );
  });

  // Summary metrics
  const totalTrades = allTrades.length;
  const deliveredTrades = allTrades.filter(t => t.status === 'Delivered').length;
  const inTransitTrades = allTrades.filter(t => ['In Transit', 'Waiting for Pickup', 'Pickup Requested', 'Driver Arrived at Destination', 'Delivery Requested'].includes(t.status)).length;
  const totalEscrowValue = allTrades.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  const metrics = [
    { label: 'Total Trades', value: totalTrades || '0', change: `${deliveredTrades} completed`, icon: Layers, color: 'text-[#2B4C26]' },
    { label: 'In Transit', value: inTransitTrades || '0', change: 'Active shipments', icon: Truck, color: 'text-[#D9822B]' },
    { label: 'Products Listed', value: products?.length || '0', change: 'AI graded batches', icon: Package, color: 'text-[#0284C7]' },
    { label: 'Total Escrow Value', value: `₹${totalEscrowValue.toLocaleString()}`, change: '0% platform cut', icon: Coins, color: 'text-[#4EA858]' }
  ];

  const getStatusBadge = (status) => {
    const statusMap = {
      'Ordered': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: '🛒' },
      'Waiting for Pickup': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: '⏳' },
      'Pickup Requested': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: '📦' },
      'In Transit': { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', icon: '🚚' },
      'Driver Arrived at Destination': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: '📍' },
      'Delivery Requested': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: '🏪' },
      'Delivered': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '✅' }
    };
    const s = statusMap[status] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: '❓' };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${s.bg} ${s.border} ${s.text} border`}>
        {s.icon} {status}
      </span>
    );
  };

  const sidebarTabs = [
    { id: 'overview', label: 'Overview & KPIs', icon: TrendingUp },
    { id: 'trades', label: 'Trade Audit', icon: FileText },
    { id: 'ledger', label: 'Blockchain Ledger', icon: Activity },
  ];

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="ghibli-card-elevated p-6 sm:p-8 bg-gradient-to-r from-[#192E16] to-[#2B4C26] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-[#A5D6A7] font-semibold border border-white/10 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Officer Audit & Compliance Portal
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
            🛡️ Officer Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#CBE0C4] mt-1">
            Monitor trades, verify escrow settlements, audit AI quality grades & blockchain integrity.
          </p>
        </div>

        <button
          onClick={() => setActiveView('landing')}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all self-start sm:self-auto flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 flex-wrap">
        {sidebarTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#2B4C26] text-white shadow-md'
                  : 'bg-white text-[#1F361C] border border-[#7DA972]/30 hover:bg-[#E6EFE3]'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════ OVERVIEW TAB ═══════════════════ */}
      {activeTab === 'overview' && (
        <>
          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {metrics.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div key={idx} className="ghibli-card p-5 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase text-[#62432B]">{m.label}</span>
                    <Icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                  <div className="font-display font-extrabold text-2xl text-[#1F361C]">{m.value}</div>
                  <div className="text-[10px] text-[#5F8A55] font-semibold mt-0.5">{m.change}</div>
                </div>
              );
            })}
          </div>

          {/* Recent Trades Quick View */}
          <div className="ghibli-card-elevated p-6 bg-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#7DA972]/20">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2B4C26]" />
                <h3 className="font-display font-bold text-lg text-[#1F361C]">Recent Trades</h3>
              </div>
              <button onClick={() => setActiveTab('trades')} className="text-xs font-bold text-[#2B4C26] hover:underline flex items-center gap-1 cursor-pointer">
                View All <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {allTrades.length === 0 ? (
              <div className="text-center py-8 text-[#62432B]/60 text-xs">
                <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-[#7DA972]/40" />
                No trades recorded yet. Trades will appear here once merchants place orders.
              </div>
            ) : (
              <div className="space-y-2">
                {allTrades.slice(0, 5).map((trade, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/15 hover:border-[#7DA972]/40 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white border border-[#7DA972]/20 flex items-center justify-center text-lg flex-shrink-0">
                        {trade.productImage ? <img src={trade.productImage} className="w-7 h-7 rounded object-cover" /> : '📦'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#1F361C]">{trade.productName || 'Product'}</div>
                        <div className="text-[10px] text-[#62432B]">{trade.batchId} • {trade.farmerName} → {trade.retailerName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(trade.status)}
                      <span className="text-xs font-extrabold text-[#1F361C]">₹{(trade.totalAmount || 0).toLocaleString()}</span>
                      <button onClick={() => { setSelectedTrade(trade); setActiveTab('trades'); }} className="p-1.5 rounded-lg hover:bg-white cursor-pointer">
                        <Eye className="w-3.5 h-3.5 text-[#5F8A55]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════ TRADE AUDIT TAB ═══════════════════ */}
      {activeTab === 'trades' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="ghibli-card p-4 bg-white flex items-center gap-3">
            <Search className="w-4 h-4 text-[#5F8A55] flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by product, batch ID, farmer, merchant, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-transparent outline-none text-[#1F361C] placeholder:text-[#62432B]/40"
            />
            <span className="text-[10px] font-bold text-[#5F8A55] flex-shrink-0">{filteredTrades.length} trades</span>
          </div>

          {/* Trade Detail Inspector */}
          {selectedTrade && (
            <div className="ghibli-card-elevated p-6 bg-white space-y-4 border-2 border-[#4EA858]/40">
              <div className="flex items-center justify-between pb-3 border-b border-[#7DA972]/20">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#2B4C26]" />
                  <h3 className="font-display font-bold text-lg text-[#1F361C]">Trade Inspector</h3>
                </div>
                <button onClick={() => setSelectedTrade(null)} className="p-1.5 rounded-lg hover:bg-[#FAF7F0] cursor-pointer">
                  <XCircle className="w-4 h-4 text-[#62432B]" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Left: Trade Info */}
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/15 space-y-2">
                    <div className="text-[10px] font-bold uppercase text-[#62432B]">Trade Summary</div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#62432B]">Order ID</span>
                        <span className="font-mono font-bold text-[#2B4C26]">{selectedTrade.id}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#62432B]">Batch ID</span>
                        <span className="font-mono font-bold text-[#2B4C26]">{selectedTrade.batchId}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#62432B]">Product</span>
                        <span className="font-bold text-[#1F361C]">{selectedTrade.productName}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#62432B]">Quantity</span>
                        <span className="font-bold text-[#1F361C]">{selectedTrade.quantity} kg</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#62432B]">Rate</span>
                        <span className="font-bold text-[#1F361C]">₹{selectedTrade.pricePerKg}/kg</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#62432B]">Status</span>
                        {getStatusBadge(selectedTrade.status)}
                      </div>
                    </div>
                  </div>

                  {/* AI Quality Grade */}
                  {selectedTrade.aiGrade && (
                    <div className="p-3 rounded-xl bg-[#E6EFE3] border border-[#7DA972]/20 space-y-2">
                      <div className="text-[10px] font-bold uppercase text-[#2B4C26]">🤖 AI Quality Certificate</div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#2B4C26]">Grade</span>
                          <span className="font-extrabold text-[#2B4C26]">{selectedTrade.aiGrade.grade}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#2B4C26]">Score</span>
                          <span className="font-bold text-[#1F361C]">{selectedTrade.aiGrade.score}/100</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#2B4C26]">Freshness</span>
                          <span className="font-bold text-[#1F361C]">{selectedTrade.aiGrade.freshness || '—'}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#2B4C26]">Defects</span>
                          <span className="font-bold text-[#1F361C]">{selectedTrade.aiGrade.defects || '—'}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Participants & Escrow */}
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/15 space-y-2">
                    <div className="text-[10px] font-bold uppercase text-[#62432B]">Participants</div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#62432B]">🌾 Farmer</span>
                        <span className="font-bold text-[#1F361C]">{selectedTrade.farmerName || '—'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#62432B]">📍 Farm Location</span>
                        <span className="font-bold text-[#1F361C] text-right max-w-[180px] truncate">{selectedTrade.farmerLocation || '—'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#62432B]">🏪 Merchant</span>
                        <span className="font-bold text-[#1F361C]">{selectedTrade.retailerName || '—'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#62432B]">🚚 Driver</span>
                        <span className="font-bold text-[#1F361C]">{selectedTrade.driver?.name || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FDF3E3] border border-[#F6D28B]/40 space-y-2">
                    <div className="text-[10px] font-bold uppercase text-[#D9822B]">💰 Escrow Breakdown</div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#825D3E]">Farmer Payout</span>
                        <span className="font-extrabold text-[#2B4C26]">₹{(selectedTrade.farmerAmount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#825D3E]">Driver Payout</span>
                        <span className="font-extrabold text-[#D9822B]">₹{(selectedTrade.driverAmount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#825D3E]">Platform Fee</span>
                        <span className="font-bold text-[#4EA858]">₹0 (Fair Trade)</span>
                      </div>
                      <div className="border-t border-dashed border-[#F6D28B]/60 my-1" />
                      <div className="flex justify-between text-xs">
                        <span className="font-extrabold text-[#1F361C]">Grand Total</span>
                        <span className="font-extrabold text-[#1F361C]">₹{(selectedTrade.totalAmount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order History / Timeline */}
              {selectedTrade.history && selectedTrade.history.length > 0 && (
                <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/15 space-y-2">
                  <div className="text-[10px] font-bold uppercase text-[#62432B]">📋 Event Timeline</div>
                  <div className="space-y-1">
                    {selectedTrade.history.map((h, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs py-1">
                        {h.done ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#4EA858] flex-shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-[#7DA972]/30 flex-shrink-0" />
                        )}
                        <span className={`font-semibold ${h.done ? 'text-[#1F361C]' : 'text-[#62432B]/50'}`}>{h.status}</span>
                        {h.detail && <span className="text-[10px] text-[#5F8A55]">— {h.detail}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trade List Table */}
          <div className="ghibli-card-elevated p-6 bg-white space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#7DA972]/20">
              <ShieldCheck className="w-5 h-5 text-[#2B4C26]" />
              <h3 className="font-display font-bold text-lg text-[#1F361C]">All Trades Audit</h3>
            </div>

            {filteredTrades.length === 0 ? (
              <div className="text-center py-10 text-[#62432B]/60 text-xs">
                <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-[#F6D28B]" />
                {searchQuery ? 'No trades match your search query.' : 'No trades recorded yet.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#7DA972]/20 text-[#62432B] font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Batch</th>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Farmer → Merchant</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">Escrow (₹)</th>
                      <th className="py-2.5 px-3">AI Grade</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#7DA972]/15">
                    {filteredTrades.map((trade, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F0] transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[#2B4C26] text-[10px]">{trade.id}</td>
                        <td className="py-3 px-3 font-mono text-[10px] text-[#5F8A55]">{trade.batchId}</td>
                        <td className="py-3 px-3 font-semibold text-[#1F361C]">{trade.productName}</td>
                        <td className="py-3 px-3 text-[#62432B] text-[10px]">{trade.farmerName || '—'} → {trade.retailerName || '—'}</td>
                        <td className="py-3 px-3 font-bold text-[#1F361C]">{trade.quantity} kg</td>
                        <td className="py-3 px-3 font-extrabold text-[#2B4C26]">₹{(trade.totalAmount || 0).toLocaleString()}</td>
                        <td className="py-3 px-3">
                          <span className="px-1.5 py-0.5 rounded-md bg-[#E6EFE3] text-[10px] font-bold text-[#2B4C26]">
                            {trade.aiGrade?.grade || '—'} ({trade.aiGrade?.score || '—'})
                          </span>
                        </td>
                        <td className="py-3 px-3">{getStatusBadge(trade.status)}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedTrade(trade)}
                            className="p-1.5 rounded-lg hover:bg-[#E6EFE3] cursor-pointer transition-colors"
                          >
                            <Eye className="w-4 h-4 text-[#2B4C26]" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════ BLOCKCHAIN LEDGER TAB ═══════════════════ */}
      {activeTab === 'ledger' && (
        <div className="ghibli-card-elevated p-6 bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#7DA972]/20">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#2B4C26]" />
              <h3 className="font-display font-bold text-lg text-[#1F361C]">
                Immutable Blockchain Ledger
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-[#2B4C26] bg-[#E6EFE3] px-3 py-1 rounded-full">
              SHA-256 Hash Chain
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#7DA972]/20 text-[#62432B] font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Block #</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Event</th>
                  <th className="py-2.5 px-3">Transaction Hash</th>
                  <th className="py-2.5 px-3 text-right">Gas Used</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#7DA972]/15">
                {blocks.map((b, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF7F0] transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#2B4C26]">#{b.blockNumber}</td>
                    <td className="py-3 px-3 text-[#62432B]">{new Date(b.timestamp).toLocaleTimeString()}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-[#1F361C] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#4EA858]" />
                        {b.event}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[10px] text-[#5F8A55] truncate max-w-xs">
                      {b.hash}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#825D3E]">
                      {b.gasUsed || '135,210 Gwei'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
