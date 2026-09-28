import React, { useState } from 'react';
import { useFarmVest } from '../../context/FarmVestContext';
import { useAuth } from '../../context/AuthContext';
import ProductDetailModal from './ProductDetailModal';
import LiveGPSMap from '../maps/LiveGPSMap';
import SmartEscrowVisualizer from '../escrow/SmartEscrowVisualizer';
import { getCropImage } from '../../utils/cropImages';
import { 
  Search, 
  Sparkles, 
  MapPin, 
  Calendar, 
  ShoppingCart, 
  CheckCircle2, 
  Store, 
  Home,
  Package,
  Truck,
  CreditCard,
  User,
  Scan,
  Award,
  Coins,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Download
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function RetailerMarketplace() {
  const { currentUser } = useAuth();
  const { 
    products, 
    orders,
    activeOrder, 
    acceptDeliveryHandover, 
    setSelectedProductForDetail, 
    selectedProductForDetail,
    setSelectedQrBatch,
    loadSampleHarvest
  } = useFarmVest();

  const { setActiveView } = useAuth();

  // Retailer Sidebar Navigation: 'home', 'marketplace', 'orders', 'active_delivery', 'payments', 'profile'
  const [activeSidebarNav, setActiveSidebarNav] = useState('marketplace');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Verification and Payment Flow modals
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isFinalQROpen, setIsFinalQROpen] = useState(false);

  const categories = ['All', 'Vegetables', 'Fruits', 'Grains', 'Pulses'];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const handleVerifyProductScan = () => {
    setIsVerificationModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handleReleaseEscrowPayment = () => {
    acceptDeliveryHandover(activeOrder.id);
    setIsPaymentModalOpen(false);
    setIsFinalQROpen(true);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Banner */}
      <div className="p-6 rounded-3xl shadow-md bg-gradient-to-r from-[#E6EFE3] to-[#CBE0C4] border border-[#7DA972]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[#1F361C]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1F361C]/10 text-xs text-[#0284C7] font-semibold border border-[#1F361C]/10 mb-1">
            <Store className="w-3.5 h-3.5" /> Retailer Portal • {currentUser?.businessName || 'FreshMart Superstore'}
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1F361C]">
            Wholesale Agricultural Marketplace 🏪
          </h1>
          <p className="text-xs text-[#62432B] mt-0.5 font-medium">
            Direct sourcing from verified farmers with AI quality certificates & automated smart escrow.
          </p>
        </div>
      </div>

      {/* Main Grid with Sidebar and View Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RETAILER SIDEBAR */}
        <div className="lg:col-span-3 space-y-2">
          <div className="ghibli-card p-3 bg-white space-y-1.5 shadow-sm sticky top-24">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#825D3E] px-3 py-1 block">
              Retailer Navigation
            </span>

            <button
              onClick={() => setActiveSidebarNav('home')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeSidebarNav === 'home' ? 'bg-[#0284C7] text-white shadow-md' : 'text-[#1F361C] hover:bg-[#FAF7F0]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Home className={`w-4 h-4 ${activeSidebarNav === 'home' ? 'text-white' : 'text-[#0284C7]'}`} />
                <span>Home</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSidebarNav('marketplace')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeSidebarNav === 'marketplace' ? 'bg-[#0284C7] text-white shadow-md' : 'text-[#1F361C] hover:bg-[#FAF7F0]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Store className={`w-4 h-4 ${activeSidebarNav === 'marketplace' ? 'text-white' : 'text-[#0284C7]'}`} />
                <span>Marketplace</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeSidebarNav === 'marketplace' ? 'bg-white/20 text-white' : 'bg-[#E0F2FE] text-[#0369A1]'
              }`}>
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSidebarNav('orders')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeSidebarNav === 'orders' ? 'bg-[#0284C7] text-white shadow-md' : 'text-[#1F361C] hover:bg-[#FAF7F0]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className={`w-4 h-4 ${activeSidebarNav === 'orders' ? 'text-white' : 'text-[#0284C7]'}`} />
                <span>My Orders</span>
              </div>
              {activeOrder && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#52C41A] animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveSidebarNav('active_delivery')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeSidebarNav === 'active_delivery' ? 'bg-[#0284C7] text-white shadow-md' : 'text-[#1F361C] hover:bg-[#FAF7F0]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Truck className={`w-4 h-4 ${activeSidebarNav === 'active_delivery' ? 'text-white' : 'text-[#0284C7]'}`} />
                <span>Active Delivery</span>
              </div>
              {activeOrder && activeOrder.status === 'In Transit' && (
                <span className="px-2 py-0.5 rounded-full bg-[#52C41A] text-white text-[9px] font-bold">GPS</span>
              )}
            </button>

            <button
              onClick={() => setActiveSidebarNav('payments')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeSidebarNav === 'payments' ? 'bg-[#0284C7] text-white shadow-md' : 'text-[#1F361C] hover:bg-[#FAF7F0]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className={`w-4 h-4 ${activeSidebarNav === 'payments' ? 'text-white' : 'text-[#0284C7]'}`} />
                <span>Payments & Escrow</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSidebarNav('profile')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeSidebarNav === 'profile' ? 'bg-[#0284C7] text-white shadow-md' : 'text-[#1F361C] hover:bg-[#FAF7F0]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className={`w-4 h-4 ${activeSidebarNav === 'profile' ? 'text-white' : 'text-[#0284C7]'}`} />
                <span>Store Profile</span>
              </div>
            </button>
          </div>
        </div>

        {/* RETAILER MAIN VIEW AREA */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* 1. HOME VIEW */}
          {activeSidebarNav === 'home' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="ghibli-card p-4 bg-white">
                  <span className="text-[10px] font-bold uppercase text-[#62432B] block">Available Crops</span>
                  <div className="font-display font-extrabold text-2xl text-[#1F361C] my-1">{products.length}</div>
                  <span className="text-[10px] text-[#5F8A55]">Grade A Certified</span>
                </div>
                <div className="ghibli-card p-4 bg-white">
                  <span className="text-[10px] font-bold uppercase text-[#62432B] block">Active Orders</span>
                  <div className="font-display font-extrabold text-2xl text-[#1F361C] my-1">{activeOrder ? 1 : 0}</div>
                  <span className="text-[10px] text-[#0284C7]">Escrow Secured</span>
                </div>
                <div className="ghibli-card p-4 bg-white">
                  <span className="text-[10px] font-bold uppercase text-[#62432B] block">Deliveries Done</span>
                  <div className="font-display font-extrabold text-2xl text-[#1F361C] my-1">{activeOrder?.status === 'Delivered' ? 1 : 0}</div>
                  <span className="text-[10px] text-[#4EA858]">Verified Handover</span>
                </div>
                <div className="ghibli-card p-4 bg-white">
                  <span className="text-[10px] font-bold uppercase text-[#62432B] block">Escrow Paid</span>
                  <div className="font-display font-extrabold text-2xl text-[#2B4C26] my-1">
                    ₹{activeOrder?.status === 'Delivered' ? (activeOrder.totalAmount || 4500) : 0}
                  </div>
                  <span className="text-[10px] text-[#4EA858]">Direct Settlement</span>
                </div>
              </div>

              {/* Quick Jump to Marketplace */}
              <div className="ghibli-card-elevated p-6 bg-white flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#1F361C]">Browse Verified Harvests</h3>
                  <p className="text-xs text-[#62432B]/80">Order direct from farmers with dynamic AI price calculation.</p>
                </div>
                <button
                  onClick={() => setActiveSidebarNav('marketplace')}
                  className="px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  Explore Marketplace <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 2. MARKETPLACE CATALOG VIEW */}
          {activeSidebarNav === 'marketplace' && (
            <div className="space-y-6">
              
              {/* Search & Category Pills */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#5F8A55] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search vegetables, fruits, grains, farm origin..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-[#7DA972]/30 text-xs text-[#1F361C] placeholder:text-[#825D3E]/60 focus:outline-none focus:border-[#2B4C26] shadow-sm"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat ? 'bg-[#2B4C26] text-white shadow-md' : 'bg-white text-[#2B4C26] border border-[#7DA972]/30 hover:bg-[#E6EFE3]'
                      }`}
                    >
                      {cat === 'All' ? '🌱 All Crops' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Cards Grid */}
              {products.length === 0 ? (
                <div className="ghibli-card p-10 text-center bg-white space-y-4 border-2 border-dashed border-[#7DA972]/40">
                  <div className="w-16 h-16 rounded-full bg-[#E0F2FE] text-3xl flex items-center justify-center mx-auto text-[#0284C7]">
                    🏪
                  </div>
                  <h3 className="font-display font-bold text-xl text-[#1F361C]">Marketplace Catalog is Fresh</h3>
                  <p className="text-xs text-[#62432B]/80 max-w-md mx-auto leading-relaxed">
                    No produce has been listed yet. When farmers upload and grade their harvest via the <strong>Farmer Login</strong>, it will automatically populate here in real-time.
                  </p>
                  <button
                    onClick={loadSampleHarvest}
                    className="px-5 py-2.5 rounded-xl bg-[#2B4C26] hover:bg-[#386332] text-white font-bold text-xs shadow-md inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#F6D28B]" /> Load Demo Harvest for Testing
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <div 
                      key={product.id}
                      className="ghibli-card overflow-hidden bg-white flex flex-col justify-between group hover:-translate-y-1.5 transition-all duration-300 border border-[#7DA972]/30 hover:border-[#4EA858]"
                    >
                      <div>
                        {/* Image & AI Certificate Badge */}
                        <div className="relative h-48 overflow-hidden bg-[#E6EFE3]">
                          <img 
                            src={getCropImage(product)} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            onError={(e) => {
                              const fallback = getCropImage(product.name, product.category);
                              if (e.currentTarget.src !== fallback) {
                                e.currentTarget.src = fallback;
                              }
                            }}
                          />
                          
                          {/* AI Quality Grade Badge */}
                          <div className="absolute top-3 left-3 bg-[#1F361C]/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-white text-[11px] font-bold flex items-center gap-1.5 shadow-lg border border-[#A5D6A7]/30">
                            <Sparkles className="w-3.5 h-3.5 text-[#F6D28B]" />
                            <span>{product.aiGrade?.grade || 'Grade A'} ({product.aiGrade?.score || 92}/100)</span>
                          </div>

                          <div className="absolute top-3 right-3 bg-white/95 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[#2B4C26] shadow-sm">
                            {product.availableQuantity} {product.unit || 'kg'} available
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="p-5 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-display font-extrabold text-lg text-[#1F361C]">{product.name}</h4>
                              <p className="text-xs text-[#5F8A55] flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3.5 h-3.5" /> {product.location}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-base font-extrabold text-[#2B4C26]">₹{product.pricePerKg}</div>
                              <span className="text-[10px] text-[#62432B]">/{product.unit || 'kg'}</span>
                            </div>
                          </div>

                          <p className="text-xs text-[#62432B]/85 line-clamp-2 leading-relaxed">
                            {product.description || 'Pesticide-free organic crop cultivated with natural bio-compost.'}
                          </p>

                          <div className="pt-2 border-t border-[#7DA972]/20 flex items-center justify-between text-xs text-[#62432B]">
                            <span>Farmer: <strong className="text-[#1F361C]">{product.farmerName}</strong></span>
                            <span className="text-[11px] text-[#5F8A55]">Harvested {product.harvestDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setSelectedProductForDetail(product)}
                          className="py-2.5 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/30 hover:bg-[#E6EFE3] text-[#2B4C26] font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                        >
                          View Details
                        </button>

                        <button
                          onClick={() => setSelectedProductForDetail(product)}
                          className="py-2.5 rounded-xl bg-gradient-to-r from-[#2B4C26] to-[#386332] hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 text-[#A5D6A7]" />
                          Order Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. MY ORDERS */}
          {activeSidebarNav === 'orders' && (
            <div className="space-y-6">
              <h3 className="font-display font-bold text-xl text-[#1F361C]">My Order History</h3>
              {orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="ghibli-card-elevated p-5 bg-white border border-[#7DA972]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:-translate-y-1 hover:border-[#4EA858]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-[#E6EFE3] text-[#2B4C26] font-bold text-xs">
                            Order #{order.id}
                          </span>
                          <span className="font-mono text-xs text-[#62432B]">Batch: {order.batchId}</span>
                        </div>
                        <h3 className="font-display font-extrabold text-xl text-[#1F361C] mt-2">
                          {order.quantity} kg {order.productName}
                        </h3>
                        <div className="text-xs text-[#5F8A55] mt-1 flex gap-4">
                           <span>Total: ₹{order.totalAmount}</span>
                           <span>Status: {order.status}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setActiveSidebarNav('active_delivery')}
                          className="px-4 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/30 text-xs font-bold text-[#2B4C26] hover:bg-[#E6EFE3] cursor-pointer"
                        >
                          View Logistics
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ghibli-card p-8 text-center bg-white text-xs text-[#62432B]">
                  You have not placed any orders yet. Place an order from the Marketplace.
                </div>
              )}
            </div>
          )}

          {/* 3.5 ACTIVE DELIVERY (GPS TRACKING) */}
          {activeSidebarNav === 'active_delivery' && (
            <div className="space-y-6">

              {activeOrder ? (
                <div className="ghibli-card-elevated p-6 bg-white border-[#7DA972]/40 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#7DA972]/20">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-[#E6EFE3] text-[#2B4C26] font-bold text-xs">
                          Order #{activeOrder.id}
                        </span>
                        <span className="font-mono text-xs text-[#62432B]">Batch: {activeOrder.batchId}</span>
                      </div>
                      <h3 className="font-display font-extrabold text-2xl text-[#1F361C] mt-1">
                        {activeOrder.quantity} kg {activeOrder.productName}
                      </h3>
                      <p className="text-xs text-[#5F8A55]">{activeOrder.timelineStatus}</p>
                    </div>

                    {/* QR SCAN & VERIFICATION BUTTON */}
                    <div className="flex items-center gap-3">
                      {(activeOrder.status === 'Delivery Requested' || activeOrder.status === 'Driver Arrived at Destination') && (
                        <button
                          onClick={() => setIsVerificationModalOpen(true)}
                          className="px-6 py-3 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs shadow-lg flex items-center gap-2 cursor-pointer animate-bounce"
                        >
                          <Scan className="w-4 h-4" /> Scan QR & Verify Delivery
                        </button>
                      )}

                      {activeOrder.status === 'Delivered' && (
                        <button
                          onClick={() => setIsFinalQROpen(true)}
                          className="px-5 py-2.5 rounded-xl bg-[#2B4C26] hover:bg-[#386332] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
                        >
                          <QrCode className="w-4 h-4 text-[#A5D6A7]" /> View Final Master QR
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AI Logistics Roadmap */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#7DA972]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-[#1F361C] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#4EA858] animate-ping" />
                        AI Logistics Roadmap & Waypoints
                      </span>
                      <span className="text-[10px] font-bold text-[#5F8A55]">Green Route 45</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white border border-[#7DA972]/20">
                        <span className="text-[10px] uppercase font-bold text-[#825D3E] block">🌾 Origin (Farmer)</span>
                        <strong>{activeOrder.farmerName}</strong>
                        <div className="text-[11px] text-[#5F8A55] truncate">{activeOrder.farmerLocation}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-[#F6D28B]">
                        <span className="text-[10px] uppercase font-bold text-[#D9822B] block">🚚 Transporter (Driver)</span>
                        <strong>{activeOrder.driver?.name}</strong>
                        <div className="text-[11px] text-[#5F8A55]">{activeOrder.driver?.vehicle} • GPS Active</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-[#7DA972]/20">
                        <span className="text-[10px] uppercase font-bold text-[#0369A1] block">🏪 Delivery (Retailer)</span>
                        <strong>{activeOrder.retailerName}</strong>
                        <div className="text-[11px] text-[#5F8A55] truncate">{activeOrder.retailerLocation}</div>
                      </div>
                    </div>
                  </div>

                  {/* Live GPS Map */}
                  <LiveGPSMap 
                    originName={activeOrder.farmerLocation}
                    destinationName={activeOrder.retailerLocation}
                    driverName={activeOrder.driver?.name}
                    isMoving={activeOrder.status === 'In Transit'}
                  />
                </div>
              ) : (
                <div className="ghibli-card p-8 text-center bg-white text-xs text-[#62432B]">
                  No active orders at this time. Place an order from the Marketplace.
                </div>
              )}
            </div>
          )}

          {/* 4. PAYMENTS & ESCROW VIEW */}
          {activeSidebarNav === 'payments' && (
            <div className="ghibli-card-elevated p-6 bg-white space-y-4">
              <h3 className="font-display font-bold text-xl text-[#1F361C]">Escrow Transactions & Payment History</h3>
              {activeOrder ? (
                <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#7DA972]/30 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-[#7DA972]/20 pb-2">
                    <span className="font-bold text-sm">Order #{activeOrder.id} • {activeOrder.productName}</span>
                    <span className="font-bold text-[#2B4C26]">{activeOrder.status === 'Delivered' ? 'Settled' : 'Locked in Escrow'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><strong>Total Locked:</strong> ₹{activeOrder.totalAmount}</div>
                    <div><strong>Farmer Payout:</strong> ₹{activeOrder.farmerAmount}</div>
                    <div><strong>Driver Tariff:</strong> ₹{activeOrder.driverAmount}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-[#62432B]">No payment transactions recorded yet.</div>
              )}
            </div>
          )}

          {/* 5. STORE PROFILE */}
          {activeSidebarNav === 'profile' && (
            <div className="ghibli-card-elevated p-6 bg-white space-y-4">
              <h3 className="font-display font-bold text-xl text-[#1F361C]">Store Profile Details</h3>
              <div className="p-4 rounded-2xl bg-[#FAF7F0] space-y-2 text-xs">
                <div><strong>Store Name:</strong> {currentUser?.businessName || 'FreshMart Superstore'}</div>
                <div><strong>Manager:</strong> {currentUser?.name || 'Priya Sharma'}</div>
                <div><strong>Email:</strong> {currentUser?.email}</div>
                <div><strong>Delivery Address:</strong> {currentUser?.location || 'Main Junction, Trichy Urban'}</div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* PRODUCT DETAIL MODAL */}
      {selectedProductForDetail && (
        <ProductDetailModal
          product={selectedProductForDetail}
          onClose={() => setSelectedProductForDetail(null)}
        />
      )}

      {/* 11. RETAILER PRODUCT QR SCAN & VERIFICATION MODAL */}
      {isVerificationModalOpen && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="ghibli-card-elevated bg-[#FAF7F0] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-2 border-[#0284C7] p-6 space-y-5 animate-in zoom-in-95">
            
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#0369A1] bg-[#E0F2FE] px-3 py-0.5 rounded-full">
                DELIVERY CHECK-IN SCAN
              </span>
              <h3 className="font-display font-extrabold text-2xl text-[#1F361C]">Product QR Verification</h3>
              <p className="text-xs text-[#62432B]">Verifying physical harvest quality against blockchain batch record</p>
            </div>

            {/* Verification Breakdown Card */}
            <div className="p-4 rounded-2xl bg-white border border-[#7DA972]/30 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#7DA972]/20 pb-2">
                <span className="font-extrabold text-base text-[#1F361C]">{activeOrder.productName}</span>
                <span className="font-mono font-bold text-[#2B4C26]">{activeOrder.batchId}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[#462E1C]">
                <div><strong>Cultivator / Farmer:</strong> {activeOrder.farmerName}</div>
                <div><strong>Harvest Date:</strong> 21 Sept 2026</div>
                <div><strong>Quantity:</strong> {activeOrder.quantity} kg</div>
                <div><strong>AI Quality Grade:</strong> {activeOrder.aiGrade?.grade || 'Grade A'} ({activeOrder.aiGrade?.score || 92}/100)</div>
              </div>

              <div className="p-3 bg-[#E6EFE3] rounded-xl flex items-center gap-2 text-xs font-bold text-[#2B4C26]">
                <CheckCircle2 className="w-5 h-5 text-[#4EA858] flex-shrink-0" />
                <span>Product Verified ✓ — Physical condition matches AI quality certificate</span>
              </div>
            </div>

            <button
              onClick={handleVerifyProductScan}
              className="w-full py-3.5 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Proceed to Escrow Payment Release</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 12. ESCROW PAYMENT & SPLIT MODAL */}
      {isPaymentModalOpen && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="ghibli-card-elevated bg-[#FAF7F0] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-2 border-[#2B4C26] p-6 space-y-5 animate-in zoom-in-95">
            
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#2B4C26] bg-[#E6EFE3] px-3 py-0.5 rounded-full">
                SMART ESCROW SETTLEMENT
              </span>
              <h3 className="font-display font-extrabold text-2xl text-[#1F361C]">Release Escrow Payment</h3>
              <p className="text-xs text-[#62432B]">Automated multi-sig release splits payment between Farmer and Driver</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#7DA972]/30 space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-[#7DA972]/20 pb-2">
                <span>🌾 Farmer Crop Payment ({activeOrder.farmerName}):</span>
                <strong className="text-[#2B4C26] text-base">₹{activeOrder.farmerAmount}</strong>
              </div>
              <div className="flex justify-between border-b border-[#7DA972]/20 pb-2">
                <span>🚚 Driver Transportation ({activeOrder.driver?.name}):</span>
                <strong className="text-[#D9822B] text-base">₹{activeOrder.driverAmount}</strong>
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span className="font-extrabold text-[#1F361C]">Total Escrow Release:</span>
                <span className="font-display font-extrabold text-2xl text-[#2B4C26]">₹{activeOrder.totalAmount}</span>
              </div>
            </div>

            <button
              onClick={handleReleaseEscrowPayment}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#2B4C26] to-[#4EA858] text-white font-extrabold text-sm shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Coins className="w-4 h-4 text-[#F6D28B]" />
              Pay & Release Escrow (₹{activeOrder.totalAmount})
            </button>
          </div>
        </div>
      )}

      {/* 13. FINAL MASTER QR MODAL (GENERATED AFTER COMPLETED TRANSACTION) */}
      {isFinalQROpen && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="ghibli-card-elevated bg-[#FAF7F0] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border-2 border-[#4EA858] p-6 space-y-5 animate-in zoom-in-95">
            
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#4EA858] bg-[#E6EFE3] px-3 py-0.5 rounded-full">
                TRANSACTION COMPLETE
              </span>
              <h3 className="font-display font-extrabold text-2xl text-[#1F361C]">Final Master QR Generated!</h3>
              <p className="text-xs text-[#62432B]">Complete verified journey and price split-up record</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#4EA858]/40 text-center space-y-3">
              <div className="flex justify-center p-3 bg-[#FAF7F0] rounded-xl border border-[#7DA972]/30 inline-block mx-auto">
                <QRCodeSVG 
                  value={`https://farmvest.trade/verify/${activeOrder.batchId}`}
                  size={150}
                  level="H"
                />
              </div>
              <div className="font-mono text-sm font-extrabold text-[#2B4C26]">{activeOrder.batchId}</div>
              <div className="text-xs text-[#5F8A55] font-semibold">
                {activeOrder.productName} • Grade A (92/100) • Verified on Polygon
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsFinalQROpen(false);
                  setSelectedQrBatch({
                    batchId: activeOrder.batchId,
                    name: activeOrder.productName,
                    farmerName: activeOrder.farmerName,
                    location: activeOrder.farmerLocation
                  });
                  setActiveView('traceability');
                }}
                className="w-full py-3 rounded-xl bg-[#2B4C26] text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-[#A5D6A7]" /> View Full Journey & Price Breakdown
              </button>

              <button
                onClick={() => setIsFinalQROpen(false)}
                className="w-full py-2.5 rounded-xl bg-white border border-[#7DA972]/30 text-xs font-bold text-[#62432B] hover:bg-[#FAF7F0] cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
