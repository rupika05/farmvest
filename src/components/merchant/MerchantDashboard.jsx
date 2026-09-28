import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFarmVest } from '../../context/FarmVestContext';
import { calculateEscrowBreakdown } from '../../services/payments/escrowService';
import { getCropImage } from '../../utils/cropImages';
import {
  Store, Package, ShoppingCart, Home, CreditCard, Search, Sparkles,
  QrCode, ArrowRight, CheckCircle2, Clock, Handshake, AlertTriangle,
  IndianRupee, TrendingUp, Eye, Award, Layers, X, Minus, Plus,
  RefreshCw, ShieldCheck, FileText, CheckCircle
} from 'lucide-react';

const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Dairy'];

function GradeTag({ grade }) {
  const isA = grade?.includes('A');
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
      isA ? 'bg-[#E6EFE3] text-[#2B4C26]' : 'bg-amber-50 text-amber-700 border border-amber-200'
    }`}>
      <Sparkles className="w-2.5 h-2.5" /> {grade || 'Ungraded'}
    </span>
  );
}

function StatCard({ label, value, sub, color = 'text-[#1F361C]' }) {
  return (
    <div className="ghibli-card p-4 bg-white">
      <span className="text-[10px] font-bold uppercase text-[#62432B] block">{label}</span>
      <div className={`font-display font-extrabold text-2xl my-1 ${color}`}>{value}</div>
      <span className="text-[10px] text-[#5F8A55]">{sub}</span>
    </div>
  );
}

export default function MerchantDashboard() {
  const { currentUser } = useAuth();
  const { products, orders, batches, placeOrder, acceptHandover, recordDamageInspection, releasePayment, setSelectedQrBatch, loadSampleHarvest, getOrderForBatch, getBatchForProduct } = useFarmVest();

  const [nav, setNav] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [orderModal, setOrderModal] = useState(null);   // product being ordered
  const [quantity, setQuantity] = useState(10);
  const [inspectModal, setInspectModal] = useState(null); // order being inspected
  const [dmgNotes, setDmgNotes] = useState('');
  const [dmgPct, setDmgPct] = useState(0);
  const [processing, setProcessing] = useState(false);

  const merchantName = currentUser?.businessName || currentUser?.name || 'Merchant';
  const myOrders = orders.filter(o => o.merchantId === currentUser?.id || o.merchantName === merchantName);
  const activeOrders = myOrders.filter(o => !['Delivered', 'Cancelled'].includes(o.status));
  const completedOrders = myOrders.filter(o => o.status === 'Delivered');
  const totalSpent = completedOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  const availableProducts = products.filter(p => {
    const stock = p.availableQuantity ?? p.totalQuantity;
    return p.status !== 'Sold' && p.status !== 'sold' && stock > 0;
  });

  const filteredProducts = availableProducts.filter(p => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.farmerName || '').toLowerCase().includes(searchQuery.toLowerCase()) || (p.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // ── Place order ────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!orderModal || quantity <= 0) return;
    setProcessing(true);
    await placeOrder({ product: orderModal, quantityKg: quantity, merchantUser: currentUser });
    setProcessing(false);
    setOrderModal(null);
    setNav('orders');
  };

  // ── Accept handover ────────────────────────────────────────────────────────
  const handleAcceptHandover = async (orderId) => {
    setProcessing(true);
    await acceptHandover(orderId, currentUser);
    setProcessing(false);
  };

  // ── Submit damage inspection ───────────────────────────────────────────────
  const handleInspection = async () => {
    if (!inspectModal) return;
    setProcessing(true);
    const report = {
      summary: dmgNotes || 'No visible damage. Quality as per AI grade.',
      adjustmentPct: Number(dmgPct),
      notes: dmgNotes,
      inspectedBy: merchantName,
      inspectedAt: new Date().toISOString()
    };
    await recordDamageInspection(inspectModal.id, report);
    setInspectModal(null);
    setDmgNotes('');
    setDmgPct(0);
    setProcessing(false);
  };

  // ── Release payment ────────────────────────────────────────────────────────
  const handleReleasePayment = async (orderId) => {
    setProcessing(true);
    await releasePayment(orderId);
    setProcessing(false);
  };

  const sidebarNav = [
    { id: 'home', icon: Home, label: 'Home', badge: null },
    { id: 'marketplace', icon: Store, label: 'Marketplace', badge: availableProducts.length },
    { id: 'orders', icon: Package, label: 'My Orders', badge: activeOrders.length || null },
    { id: 'payments', icon: CreditCard, label: 'Payments & Escrow', badge: null },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#FDF3E3] to-[#FBE6CC] border border-[#F6D28B]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#D9822B]/10 text-xs text-[#D9822B] font-semibold border border-[#D9822B]/20">
            🏪 Merchant Portal • {merchantName}
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1F361C]">
            Welcome, {currentUser?.name?.split(' ')[0] || merchantName} 🏪
          </h1>
          <p className="text-xs text-[#62432B]">Browse AI-graded produce → Order with escrow → Accept custody handover → Release payment</p>
        </div>
        <button onClick={() => setNav('marketplace')} className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D9822B] to-[#c27020] text-white font-extrabold text-xs shadow-lg flex items-center gap-2 cursor-pointer self-start">
          <Store className="w-4 h-4" /> Browse Marketplace
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-3">
          <div className="ghibli-card p-3 bg-white space-y-1.5 shadow-sm sticky top-24">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#825D3E] px-3 py-1 block">Merchant Navigation</span>
            {sidebarNav.map(item => (
              <button key={item.id} onClick={() => setNav(item.id)}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  nav === item.id ? 'bg-[#D9822B] text-white shadow-md' : 'text-[#1F361C] hover:bg-[#FAF7F0]'
                }`}>
                <div className="flex items-center gap-2.5">
                  <item.icon className={`w-4 h-4 ${nav === item.id ? 'text-white' : 'text-[#D9822B]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge != null && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${nav === item.id ? 'bg-white/20 text-white' : 'bg-[#FDF3E3] text-[#D9822B]'}`}>{item.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main */}
        <div className="lg:col-span-9 space-y-6">

          {/* ── HOME ── */}
          {nav === 'home' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Available Crops" value={availableProducts.length} sub="AI grade certified" />
                <StatCard label="Active Orders" value={activeOrders.length} sub="Escrow secured" color="text-[#D9822B]" />
                <StatCard label="Completed" value={completedOrders.length} sub="Verified handover" color="text-[#4EA858]" />
                <StatCard label="Total Spent" value={`₹${totalSpent.toLocaleString()}`} sub="Direct to farmers" color="text-[#2B4C26]" />
              </div>

              {/* Active order status tracker */}
              {activeOrders.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-display font-bold text-lg text-[#1F361C]">Active Orders</h3>
                  {activeOrders.map(order => (
                    <OrderStatusCard key={order.id} order={order} onAccept={() => handleAcceptHandover(order.id)} onInspect={() => { setInspectModal(order); setNav('orders'); }} onRelease={() => handleReleasePayment(order.id)} processing={processing} nav={nav} />
                  ))}
                </div>
              )}

              <div className="ghibli-card-elevated p-6 bg-white flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#1F361C]">Browse Verified Harvests</h3>
                  <p className="text-xs text-[#62432B]/80">{availableProducts.length} AI-graded products available from verified farmers.</p>
                </div>
                <button onClick={() => setNav('marketplace')} className="px-5 py-2.5 rounded-xl bg-[#D9822B] hover:bg-[#c27020] text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer">
                  Explore <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {availableProducts.length === 0 && (
                <div className="ghibli-card p-8 text-center bg-white border-2 border-dashed border-[#F6D28B]/40 space-y-3">
                  <div className="text-3xl">🏪</div>
                  <p className="text-xs text-[#62432B]/80">No produce listed yet. When farmers upload harvests, they appear here.</p>
                  <button onClick={loadSampleHarvest} className="px-4 py-2 rounded-xl bg-[#D9822B] text-white font-bold text-xs cursor-pointer">Load Demo Harvest</button>
                </div>
              )}
            </div>
          )}

          {/* ── MARKETPLACE ── */}
          {nav === 'marketplace' && (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#5F8A55] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search crop name, farm origin, farmer..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-[#7DA972]/30 text-xs focus:outline-none focus:border-[#2B4C26] shadow-sm" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                        selectedCategory === cat ? 'bg-[#2B4C26] text-white shadow-md' : 'bg-white text-[#2B4C26] border border-[#7DA972]/30 hover:bg-[#E6EFE3]'
                      }`}>
                      {cat === 'All' ? '🌱 All' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="ghibli-card p-10 text-center bg-white border-2 border-dashed border-[#7DA972]/40 space-y-3">
                  <div className="text-3xl">🏪</div>
                  <p className="text-xs text-[#62432B]/80 max-w-sm mx-auto">{availableProducts.length === 0 ? 'No produce has been listed yet.' : 'No products match your filter.'}</p>
                  {availableProducts.length === 0 && <button onClick={loadSampleHarvest} className="px-5 py-2.5 rounded-xl bg-[#2B4C26] text-white font-bold text-xs cursor-pointer">Load Demo Harvest</button>}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredProducts.map(product => {
                    const existingOrder = getOrderForBatch(product.batchId);
                    const alreadyOrdered = !!existingOrder;
                    const stock = product.availableQuantity ?? product.totalQuantity;
                    return (
                      <div key={product.id} className="ghibli-card overflow-hidden bg-white border border-[#7DA972]/30 hover:border-[#4EA858] hover:-translate-y-1.5 transition-all duration-300 flex flex-col">
                        <div className="relative h-48 overflow-hidden bg-[#E6EFE3]">
                          <img src={getCropImage(product)} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-2.5 left-2.5 bg-[#1F361C]/90 backdrop-blur px-2.5 py-1 rounded-lg text-white text-[11px] font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#F6D28B]" /> {product.aiGrade?.grade || 'Grade A'} ({product.aiGrade?.score || '92'}/100)
                          </div>
                          <div className="absolute top-2.5 right-2.5 bg-white/95 px-2 py-0.5 rounded font-mono text-[10px] font-bold text-[#2B4C26]">{product.batchId}</div>
                          {product.authenticityReport && (
                            <div className={`absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              product.authenticityReport.level === 'high' ? 'bg-[#4EA858] text-white' : 'bg-amber-500 text-white'
                            }`}>
                              <ShieldCheck className="w-2.5 h-2.5 inline mr-0.5" />{product.authenticityReport.levelLabel}
                            </div>
                          )}
                        </div>
                        <div className="p-4 space-y-2 flex-1">
                          <div className="flex items-start justify-between">
                            <h4 className="font-display font-bold text-base text-[#1F361C]">{product.name}</h4>
                            <span className="font-extrabold text-[#2B4C26] text-sm">₹{product.pricePerKg}/{product.unit || 'kg'}</span>
                          </div>
                          <p className="text-[11px] text-[#62432B]/80 line-clamp-2">{product.description || 'Verified farm harvest.'}</p>
                          <div className="text-[11px] text-[#5F8A55] flex flex-wrap gap-x-3">
                            <span>📦 {stock} {product.unit} available</span>
                            <span>📍 {product.location || product.farmerLocation || '—'}</span>
                          </div>
                          {product.fairPriceRecommendation && (
                            <div className="text-[10px] text-[#D9822B]">
                              <TrendingUp className="w-2.5 h-2.5 inline mr-0.5" />
                              Market range: ₹{product.fairPriceRecommendation.corridor?.min}–₹{product.fairPriceRecommendation.corridor?.max}/{product.unit}
                            </div>
                          )}
                        </div>
                        <div className="px-4 pb-4 space-y-2">
                          <div className="flex gap-2">
                            <button onClick={() => setSelectedQrBatch(product)} className="flex-1 py-2 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/30 hover:bg-[#E6EFE3] text-[#2B4C26] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                              <QrCode className="w-3.5 h-3.5" /> Passport
                            </button>
                            {alreadyOrdered ? (
                              <div className="flex-1 py-2 rounded-xl bg-[#E6EFE3] text-[#2B4C26] font-bold text-xs flex items-center justify-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Ordered
                              </div>
                            ) : (
                              <button onClick={() => { setOrderModal(product); setQuantity(Math.min(50, stock)); }}
                                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#D9822B] to-[#c27020] hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md">
                                <ShoppingCart className="w-3.5 h-3.5" /> Order
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── ORDERS ── */}
          {nav === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-xl text-[#1F361C]">My Orders</h3>
                  <p className="text-xs text-[#62432B]/80">Manage custody handovers, inspections and payments</p>
                </div>
              </div>
              {myOrders.length === 0 ? (
                <div className="ghibli-card p-10 text-center bg-white text-xs text-[#62432B]">No orders yet. Browse the marketplace to place your first order.</div>
              ) : (
                <div className="space-y-4">
                  {myOrders.map(order => (
                    <OrderStatusCard key={order.id} order={order}
                      onAccept={() => handleAcceptHandover(order.id)}
                      onInspect={() => setInspectModal(order)}
                      onRelease={() => handleReleasePayment(order.id)}
                      processing={processing} expanded />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {nav === 'payments' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-display font-bold text-xl text-[#1F361C]">Payments & Escrow</h3>
                <p className="text-xs text-[#62432B]/80">All transactions — direct farmer payments, 0% intermediary fee</p>
              </div>
              {myOrders.length === 0 ? (
                <div className="ghibli-card p-10 text-center bg-white text-xs text-[#62432B]">No transactions yet.</div>
              ) : (
                <div className="space-y-3">
                  {myOrders.map(order => {
                    const escrow = calculateEscrowBreakdown(order.quantity, order.pricePerKg, 0);
                    return (
                      <div key={order.id} className="ghibli-card p-4 bg-white space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-sm text-[#1F361C]">{order.productName}</div>
                            <div className="text-[10px] text-[#5F8A55] font-mono">Batch: {order.batchId} • Order: {order.id}</div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.paymentStatus === 'Paid' ? 'bg-[#E6EFE3] text-[#2B4C26]' : 'bg-amber-100 text-amber-800'
                          }`}>{order.paymentStatus === 'Paid' ? '✓ Paid' : '⏳ Pending'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="p-2 rounded-lg bg-[#FAF7F0] text-center">
                            <div className="text-[10px] text-[#62432B]">To Farmer</div>
                            <div className="font-bold text-[#2B4C26]">₹{order.finalFarmerAmount || order.farmerAmount}</div>
                          </div>
                          <div className="p-2 rounded-lg bg-[#FAF7F0] text-center">
                            <div className="text-[10px] text-[#62432B]">Platform Fee</div>
                            <div className="font-bold text-[#4EA858]">₹0 (Zero)</div>
                          </div>
                          <div className="p-2 rounded-lg bg-[#FAF7F0] text-center">
                            <div className="text-[10px] text-[#62432B]">Total Paid</div>
                            <div className="font-bold text-[#1F361C]">₹{order.totalAmount}</div>
                          </div>
                        </div>
                        {order.paymentTxId && (
                          <div className="text-[10px] font-mono text-[#5F8A55]">TxID: {order.paymentTxId}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── ORDER PLACEMENT MODAL ── */}
      {orderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setOrderModal(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-[#1F361C]">Place Order</h3>
              <button onClick={() => setOrderModal(null)} className="p-1.5 rounded-xl hover:bg-[#FAF7F0] cursor-pointer"><X className="w-4 h-4 text-[#62432B]" /></button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF7F0] border border-[#7DA972]/30">
              <img src={getCropImage(orderModal)} alt={orderModal.name} className="w-14 h-14 rounded-xl object-cover" />
              <div>
                <div className="font-bold text-sm text-[#1F361C]">{orderModal.name}</div>
                <GradeTag grade={orderModal.aiGrade?.grade} />
                <div className="text-xs text-[#5F8A55] mt-0.5">₹{orderModal.pricePerKg}/{orderModal.unit} • Farmer: {orderModal.farmerName}</div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1F361C] block mb-2">Quantity ({orderModal.unit})</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(q => Math.max(1, q - 10))} className="w-9 h-9 rounded-xl border border-[#7DA972]/30 flex items-center justify-center hover:bg-[#E6EFE3] cursor-pointer"><Minus className="w-4 h-4" /></button>
                <input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, Math.min(Number(e.target.value), orderModal.availableQuantity || 9999)))}
                  className="flex-1 p-2.5 text-center rounded-xl border border-[#7DA972]/30 text-sm font-bold focus:outline-none" />
                <button onClick={() => setQuantity(q => q + 10)} className="w-9 h-9 rounded-xl border border-[#7DA972]/30 flex items-center justify-center hover:bg-[#E6EFE3] cursor-pointer"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="text-[10px] text-[#62432B]/70 mt-1">Max: {orderModal.availableQuantity || orderModal.totalQuantity} {orderModal.unit}</div>
            </div>

            {/* Escrow breakdown */}
            <div className="p-3 rounded-xl bg-[#E6EFE3] border border-[#7DA972]/30 space-y-1.5 text-xs">
              <div className="font-bold text-[#2B4C26] text-sm mb-1">Escrow Breakdown</div>
              <div className="flex justify-between"><span>Produce ({quantity} × ₹{orderModal.pricePerKg})</span><span className="font-bold">₹{(quantity * orderModal.pricePerKg).toLocaleString()}</span></div>
              <div className="flex justify-between text-[#4EA858]"><span>Platform Fee (FarmVest)</span><span className="font-bold">₹0 (Zero cut)</span></div>
              <div className="flex justify-between border-t border-[#7DA972]/30 pt-1 font-extrabold text-sm text-[#1F361C]"><span>Total</span><span>₹{(quantity * orderModal.pricePerKg).toLocaleString()}</span></div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-800">
              💡 After ordering, the farmer will initiate a custody handover. You'll accept it here and receive the produce directly.
            </div>

            <button onClick={handlePlaceOrder} disabled={processing}
              className={`w-full py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer ${processing ? 'bg-gray-400' : 'bg-gradient-to-r from-[#D9822B] to-[#c27020] hover:scale-[1.02] transition-all'}`}>
              {processing ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processing…</> : <><ShoppingCart className="w-4 h-4" /> Confirm Order & Lock Escrow</>}
            </button>
          </div>
        </div>
      )}

      {/* ── DAMAGE INSPECTION MODAL ── */}
      {inspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setInspectModal(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-[#1F361C]">Quality Inspection Report</h3>
              <button onClick={() => setInspectModal(null)} className="p-1.5 rounded-xl hover:bg-[#FAF7F0] cursor-pointer"><X className="w-4 h-4 text-[#62432B]" /></button>
            </div>
            <div className="text-xs text-[#62432B]">Order: <span className="font-bold">{inspectModal.productName}</span> — Batch {inspectModal.batchId}</div>
            <div>
              <label className="text-xs font-bold text-[#1F361C] block mb-2">Damage / Quality Adjustment (%)</label>
              <div className="flex items-center gap-3">
                <input type="range" min="0" max="30" step="1" value={dmgPct} onChange={e => setDmgPct(Number(e.target.value))} className="flex-1" />
                <span className="font-bold text-sm w-12 text-right text-[#D9822B]">{dmgPct}%</span>
              </div>
              <div className="text-[10px] text-[#62432B]/70 mt-1">
                {dmgPct === 0 ? 'No damage — full payment to farmer' : `${dmgPct}% reduction applied — Farmer receives ₹${Math.round(inspectModal.farmerAmount * (1 - dmgPct / 100))}`}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-[#1F361C] block mb-2">Inspection Notes</label>
              <textarea rows="3" value={dmgNotes} onChange={e => setDmgNotes(e.target.value)}
                placeholder="Describe condition, any damage observed, or confirm good condition..."
                className="w-full p-2.5 rounded-xl border border-[#7DA972]/30 text-xs focus:outline-none bg-[#FAF7F0]" />
            </div>
            <div className="p-2.5 rounded-xl bg-[#E6EFE3] text-[10px] text-[#2B4C26]">
              📋 This inspection report will be recorded in the supply chain ledger.
            </div>
            <button onClick={handleInspection} disabled={processing}
              className="w-full py-3 rounded-2xl bg-[#2B4C26] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-[#386332]">
              {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Submit Inspection Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Order Status Card Component ──────────────────────────────────────────────
function OrderStatusCard({ order, onAccept, onInspect, onRelease, processing, expanded = false }) {
  const steps = ['Ordered', 'Waiting for Handover', 'Handover Accepted', 'Inspected', 'Delivered'];
  const currentStepIdx = steps.indexOf(order.status);

  return (
    <div className="ghibli-card p-5 bg-white border border-[#7DA972]/30 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-bold text-sm text-[#1F361C]">{order.productName}</div>
          <div className="text-xs text-[#5F8A55]">Qty: {order.quantity} {order.unit || 'kg'} • From: {order.farmerName}</div>
          <div className="text-[10px] font-mono text-[#62432B]">Batch: {order.batchId}</div>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
          order.status === 'Delivered' ? 'bg-[#E6EFE3] text-[#2B4C26]' :
          order.status === 'Waiting for Handover' ? 'bg-amber-100 text-amber-800' :
          order.status === 'Handover Accepted' || order.status === 'Inspected' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-700'
        }`}>{order.status}</span>
      </div>

      {/* Progress steps */}
      {expanded && (
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {steps.map((step, i) => (
            <React.Fragment key={step}>
              <div className={`text-[9px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                i < currentStepIdx ? 'bg-[#4EA858] text-white' :
                i === currentStepIdx ? 'bg-[#2B4C26] text-white' :
                'bg-[#FAF7F0] text-[#62432B]'
              }`}>{step}</div>
              {i < steps.length - 1 && <div className={`h-0.5 flex-1 min-w-[8px] ${i < currentStepIdx ? 'bg-[#4EA858]' : 'bg-[#E6EFE3]'}`} />}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Action buttons based on status */}
      <div className="space-y-2">
        {/* Accept handover from farmer */}
        {order.status === 'Waiting for Handover' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-amber-800">
              <strong>Farmer {order.farmerName} has initiated custody handover.</strong> Accept to take responsibility for the produce.
            </div>
            <button onClick={onAccept} disabled={processing}
              className="px-4 py-2 rounded-xl bg-[#2B4C26] text-white font-bold text-xs flex items-center gap-2 cursor-pointer whitespace-nowrap hover:bg-[#386332] shadow-md">
              {processing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Handshake className="w-3.5 h-3.5" />}
              Accept Handover
            </button>
          </div>
        )}

        {/* Submit damage inspection */}
        {order.status === 'Handover Accepted' && !order.damageInspection && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-blue-800">
              <strong>Produce received.</strong> Complete quality inspection and report any damage before releasing payment.
            </div>
            <button onClick={onInspect}
              className="px-4 py-2 rounded-xl bg-[#0284C7] text-white font-bold text-xs flex items-center gap-2 cursor-pointer whitespace-nowrap hover:bg-[#0369A1] shadow-md">
              <Eye className="w-3.5 h-3.5" /> Inspect & Report
            </button>
          </div>
        )}

        {/* Release payment */}
        {(order.status === 'Inspected' || (order.status === 'Handover Accepted' && order.damageInspection)) && order.paymentStatus !== 'Paid' && (
          <div className="p-3 bg-[#E6EFE3] border border-[#4EA858]/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-[#2B4C26]">
              <strong>Inspection done.</strong> Release ₹{Math.round((order.farmerAmount || 0) * (1 - (order.damageInspection?.adjustmentPct || 0) / 100))} to farmer to complete the order.
            </div>
            <button onClick={onRelease} disabled={processing}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4EA858] to-[#2B4C26] text-white font-bold text-xs flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-md">
              {processing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <IndianRupee className="w-3.5 h-3.5" />}
              Release Payment
            </button>
          </div>
        )}

        {/* Delivered */}
        {order.status === 'Delivered' && (
          <div className="p-3 bg-[#E6EFE3] border border-[#4EA858] rounded-xl flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-[#2B4C26]">✓ Order Complete</div>
              <div className="text-[#5F8A55]">₹{order.finalFarmerAmount || order.farmerAmount} paid to farmer • TxID: {order.paymentTxId || '—'}</div>
            </div>
            <CheckCircle className="w-8 h-8 text-[#4EA858]" />
          </div>
        )}
      </div>
    </div>
  );
}
