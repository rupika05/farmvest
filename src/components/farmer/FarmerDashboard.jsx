import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFarmVest } from '../../context/FarmVestContext';
import SellProductModal from './SellProductModal';
import LiveGPSMap from '../maps/LiveGPSMap';
import AICropScanner from './AICropScanner';
import { SAMPLE_CROPS } from '../../services/ai/cropGradingService';
import { getCropImage } from '../../utils/cropImages';
import { 
  Sprout, 
  Package, 
  Truck, 
  CheckCircle, 
  IndianRupee, 
  Plus, 
  QrCode, 
  Sparkles, 
  Clock, 
  ArrowRight,
  Handshake,
  ShieldCheck,
  MapPin,
  Upload,
  Camera,
  Calendar,
  Layers,
  ShoppingBag,
  History,
  TrendingUp,
  Inbox
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function FarmerDashboard() {
  const { currentUser } = useAuth();
  const { 
    products, 
    orders, 
    activeOrder, 
    publishProduct,
    requestPickupHandover,
    setSelectedQrBatch,
    loadSampleHarvest,
    gpsData
  } = useFarmVest();

  // Sidebar navigation state: 'kept_for_sale', 'upload_sell', 'received_orders', 'already_sold'
  const [activeSidebarNav, setActiveSidebarNav] = useState('kept_for_sale');

  // Inline upload & AI grading form state
  const [uploadStep, setUploadStep] = useState(1); // 1: Details, 2: Photo, 3: AI Scan, 4: Summary/Publish
  const [formData, setFormData] = useState({
    name: '',
    category: 'Vegetables',
    totalQuantity: '',
    unit: 'kg',
    pricePerKg: '',
    harvestDate: '',
    location: currentUser?.location || '',
    farmerName: currentUser?.businessName || currentUser?.name || '',
    description: '',
    image: null,
    batchId: `FV-CROP-${Math.floor(100 + Math.random() * 900)}`
  });
  const [aiReport, setAiReport] = useState(SAMPLE_CROPS[0].mockGrade);

  // Filter sold items
  const soldOrders = orders.filter(o => o.status === 'Delivered');
  const activeReceivedOrders = activeOrder ? [activeOrder] : [];

  const handleInlinePublish = () => {
    if (!formData.name.trim()) return;
    publishProduct({
      ...formData,
      aiGrade: aiReport
    });
    // Reset and jump to 'kept_for_sale'
    setFormData({
      name: '',
      category: 'Vegetables',
      totalQuantity: '',
      unit: 'kg',
      pricePerKg: '',
      harvestDate: '',
      location: currentUser?.location || '',
      farmerName: currentUser?.businessName || currentUser?.name || '',
      description: '',
      image: null,
      batchId: `FV-CROP-${Math.floor(100 + Math.random() * 900)}`
    });
    setUploadStep(1);
    setActiveSidebarNav('kept_for_sale');
  };

  const selectPresetForUpload = (sample) => {
    setFormData({
      ...formData,
      name: sample.name.split(' ')[0] || sample.name,
      category: sample.category,
      totalQuantity: sample.defaultQty,
      unit: sample.unit,
      pricePerKg: sample.defaultPrice,
      location: sample.location,
      harvestDate: sample.harvestDate,
      description: sample.description,
      image: null,
      batchId: `FV-${sample.name.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
    });
    setAiReport(sample.mockGrade);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Farmer Top Header */}
      <div className="p-6 rounded-3xl shadow-md bg-gradient-to-r from-[#E6EFE3] to-[#CBE0C4] border border-[#7DA972]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[#1F361C]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1F361C]/10 text-xs text-[#2B4C26] font-semibold border border-[#1F361C]/10">
            🌾 Farmer Portal • {currentUser?.businessName || 'Your Farm'}
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1F361C]">
            Good morning, {currentUser?.name || 'Farmer'} 🌱
          </h1>
          <p className="text-xs text-[#62432B]">
            Upload cultivated harvests for AI quality grading, view active orders & confirm pickup handovers.
          </p>
        </div>

        <button
          onClick={() => { setActiveSidebarNav('upload_sell'); setUploadStep(1); }}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#4EA858] to-[#3B9245] hover:brightness-110 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> + Sell New Harvest
        </button>
      </div>

      {/* Main Layout with Sidebar and Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="lg:col-span-3 space-y-2">
          <div className="ghibli-card p-3 bg-white space-y-1.5 shadow-sm sticky top-24">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#825D3E] px-3 py-1 block">
              Farmer Controls
            </span>

            {/* 1. Kept for Sale */}
            <button
              onClick={() => setActiveSidebarNav('kept_for_sale')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeSidebarNav === 'kept_for_sale'
                  ? 'bg-[#2B4C26] text-white shadow-md'
                  : 'text-[#1F361C] hover:bg-[#FAF7F0]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className={`w-4 h-4 ${activeSidebarNav === 'kept_for_sale' ? 'text-white' : 'text-[#2B4C26]'}`} />
                <span>Products Kept for Sale</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeSidebarNav === 'kept_for_sale' ? 'bg-white/20 text-white' : 'bg-[#E6EFE3] text-[#2B4C26]'
              }`}>
                {products.length}
              </span>
            </button>

            {/* 2. Upload & Sell Product (AI Quality Check) */}
            <button
              onClick={() => { setActiveSidebarNav('upload_sell'); setUploadStep(1); }}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeSidebarNav === 'upload_sell'
                  ? 'bg-[#2B4C26] text-white shadow-md'
                  : 'text-[#1F361C] hover:bg-[#FAF7F0]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className={`w-4 h-4 ${activeSidebarNav === 'upload_sell' ? 'text-white' : 'text-[#D9822B]'}`} />
                <span>Upload & AI Quality Grading</span>
              </div>
              <span className="text-[10px] font-extrabold text-[#D9822B]">NEW</span>
            </button>

            {/* 3. Received Orders */}
            <button
              onClick={() => setActiveSidebarNav('received_orders')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeSidebarNav === 'received_orders'
                  ? 'bg-[#2B4C26] text-white shadow-md'
                  : 'text-[#1F361C] hover:bg-[#FAF7F0]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className={`w-4 h-4 ${activeSidebarNav === 'received_orders' ? 'text-white' : 'text-[#0284C7]'}`} />
                <span>Received Orders</span>
              </div>
              {activeOrder && (
                <span className="w-2 h-2 rounded-full bg-[#52C41A] animate-ping" />
              )}
            </button>

            {/* 4. Products Already Sold */}
            <button
              onClick={() => setActiveSidebarNav('already_sold')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeSidebarNav === 'already_sold'
                  ? 'bg-[#2B4C26] text-white shadow-md'
                  : 'text-[#1F361C] hover:bg-[#FAF7F0]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle className={`w-4 h-4 ${activeSidebarNav === 'already_sold' ? 'text-white' : 'text-[#4EA858]'}`} />
                <span>Already Sold Products</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeSidebarNav === 'already_sold' ? 'bg-white/20 text-white' : 'bg-[#E6EFE3] text-[#2B4C26]'
              }`}>
                {activeOrder?.status === 'Delivered' ? 1 : 0}
              </span>
            </button>
          </div>
        </div>

        {/* MAIN DISPLAY AREA BASED ON ACTIVE SIDEBAR SELECTION */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* 1. PRODUCTS KEPT FOR SALE */}
          {activeSidebarNav === 'kept_for_sale' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-xl text-[#1F361C]">Products Kept for Sale</h3>
                  <p className="text-xs text-[#62432B]/80">Active produce listed in the marketplace for retailers</p>
                </div>
                {products.length > 0 && (
                  <button
                    onClick={() => { setActiveSidebarNav('upload_sell'); setUploadStep(1); }}
                    className="px-4 py-2 rounded-xl bg-[#2B4C26] text-white font-bold text-xs hover:bg-[#386332] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> List Another Crop
                  </button>
                )}
              </div>

              {products.length === 0 ? (
                <div className="ghibli-card p-10 text-center bg-white space-y-4 border-2 border-dashed border-[#7DA972]/40">
                  <div className="w-16 h-16 rounded-full bg-[#E6EFE3] text-3xl flex items-center justify-center mx-auto">
                    🌾
                  </div>
                  <h4 className="font-display font-bold text-lg text-[#1F361C]">No Crops Kept for Sale Yet</h4>
                  <p className="text-xs text-[#62432B]/80 max-w-md mx-auto">
                    Upload your cultivated harvest details, take a photo for AI quality grading, and put it on sale for retailers!
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <button
                      onClick={() => { setActiveSidebarNav('upload_sell'); setUploadStep(1); }}
                      className="px-6 py-2.5 rounded-xl bg-[#2B4C26] text-white font-bold text-xs hover:bg-[#386332] flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <Plus className="w-4 h-4" /> Upload Harvest Now
                    </button>
                    <button
                      onClick={loadSampleHarvest}
                      className="px-4 py-2.5 rounded-xl bg-[#FAF7F0] hover:bg-[#E6EFE3] text-[#2B4C26] border border-[#7DA972]/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#D9822B]" /> Load Demo Sample Harvest
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((prod) => (
                    <div key={prod.id} className="ghibli-card overflow-hidden bg-white border border-[#7DA972]/30 flex flex-col justify-between">
                      <div>
                        <div className="relative h-40 overflow-hidden bg-[#E6EFE3]">
                          <img 
                            src={getCropImage(prod)} 
                            alt={prod.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const fallback = getCropImage(prod.name, prod.category);
                              if (e.currentTarget.src !== fallback) {
                                e.currentTarget.src = fallback;
                              }
                            }}
                          />
                          <div className="absolute top-2.5 left-2.5 bg-[#1F361C]/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-[11px] font-bold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-[#F6D28B]" />
                            {prod.aiGrade?.grade || 'Grade A'} ({prod.aiGrade?.score || 92}/100)
                          </div>
                          <div className="absolute top-2.5 right-2.5 bg-white/95 px-2 py-0.5 rounded font-mono text-[11px] font-bold text-[#2B4C26]">
                            {prod.batchId}
                          </div>
                        </div>

                        <div className="p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-display font-bold text-base text-[#1F361C]">{prod.name}</h4>
                            <span className="text-sm font-extrabold text-[#2B4C26]">₹{prod.pricePerKg}/{prod.unit}</span>
                          </div>
                          <p className="text-xs text-[#62432B]/80 line-clamp-2">{prod.description || 'Pesticide-free certified farm harvest.'}</p>
                          <div className="pt-2 border-t border-[#7DA972]/20 flex justify-between text-xs text-[#5F8A55]">
                            <span>Stock: <strong>{prod.availableQuantity} {prod.unit}</strong></span>
                            <span>Harvested: {prod.harvestDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        <button
                          onClick={() => setSelectedQrBatch(prod)}
                          className="w-full py-2 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/30 hover:bg-[#E6EFE3] text-[#2B4C26] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" /> View Master QR Certificate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. UPLOAD & AI QUALITY GRADING OPTION */}
          {activeSidebarNav === 'upload_sell' && (
            <div className="ghibli-card-elevated p-6 bg-white space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-[#7DA972]/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#E6EFE3] text-[#2B4C26] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#D9822B]" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-[#1F361C]">
                      Upload Cultivated Crop & AI Quality Grading
                    </h3>
                    <p className="text-xs text-[#5F8A55]">Step {uploadStep} of 4</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-bold ${uploadStep === 1 ? 'bg-[#2B4C26] text-white' : 'bg-[#FAF7F0] text-[#62432B]'}`}>1. Details</span>
                  <span>→</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${uploadStep === 2 ? 'bg-[#2B4C26] text-white' : 'bg-[#FAF7F0] text-[#62432B]'}`}>2. Photo</span>
                  <span>→</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${uploadStep === 3 ? 'bg-[#2B4C26] text-white' : 'bg-[#FAF7F0] text-[#62432B]'}`}>3. AI Scan</span>
                  <span>→</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${uploadStep === 4 ? 'bg-[#2B4C26] text-white' : 'bg-[#FAF7F0] text-[#62432B]'}`}>4. Publish</span>
                </div>
              </div>

              {/* STEP 1: CROP DETAILS */}
              {uploadStep === 1 && (
                <div className="space-y-4">
                  {/* Preset Helper */}
                  <div>
                    <span className="text-[11px] font-bold uppercase text-[#825D3E] block mb-1.5">
                      ⚡ Quick Fill Crop Preset (or enter manually below):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SAMPLE_CROPS.map((sample) => (
                        <button
                          key={sample.id}
                          type="button"
                          onClick={() => selectPresetForUpload(sample)}
                          className={`p-2 rounded-xl text-left border text-xs flex items-center gap-2 cursor-pointer ${
                            formData.name === (sample.name.split(' ')[0]) ? 'bg-[#E6EFE3] border-[#2B4C26] font-bold' : 'bg-[#FAF7F0] border-[#7DA972]/30'
                          }`}
                        >
                          <img src={sample.image} alt={sample.name} className="w-6 h-6 rounded-md object-cover" />
                          <span className="truncate">{sample.name.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-[#1F361C] block mb-1">Cultivated Crop Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#7DA972]/30 bg-[#FAF7F0] focus:outline-none focus:border-[#2B4C26]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1F361C] block mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#7DA972]/30 bg-[#FAF7F0] focus:outline-none focus:border-[#2B4C26]"
                      >
                        <option value="Vegetables">Vegetables</option>
                        <option value="Fruits">Fruits</option>
                        <option value="Grains">Grains</option>
                        <option value="Pulses">Pulses</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-[#1F361C] block mb-1">Quantity Available (kg)</label>
                      <input
                        type="number"
                        value={formData.totalQuantity}
                        onChange={(e) => setFormData({ ...formData, totalQuantity: +e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#7DA972]/30 bg-[#FAF7F0] focus:outline-none focus:border-[#2B4C26]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1F361C] block mb-1">Expected Price (₹ / kg)</label>
                      <input
                        type="number"
                        value={formData.pricePerKg}
                        onChange={(e) => setFormData({ ...formData, pricePerKg: +e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#7DA972]/30 bg-[#FAF7F0] focus:outline-none focus:border-[#2B4C26]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1F361C] block mb-1">Cultivation / Harvest Date</label>
                      <input
                        type="text"
                        value={formData.harvestDate}
                        onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#7DA972]/30 bg-[#FAF7F0] focus:outline-none focus:border-[#2B4C26]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#1F361C] block mb-1">Farm Origin Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-[#7DA972]/30 bg-[#FAF7F0] focus:outline-none focus:border-[#2B4C26]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-[#1F361C] block mb-1 text-xs">Farming Method & Soil Notes</label>
                    <textarea
                      rows="2"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#7DA972]/30 bg-[#FAF7F0] text-xs focus:outline-none focus:border-[#2B4C26]"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!formData.name.trim()}
                      onClick={() => setUploadStep(2)}
                      className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md ${
                        formData.name.trim() ? 'bg-[#2B4C26] hover:bg-[#386332]' : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Next: Upload Crop Picture <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: UPLOAD IMAGE / TAKE PHOTO */}
              {uploadStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <h4 className="font-display font-bold text-base text-[#1F361C]">Upload or Snap Crop Photo</h4>
                    <p className="text-xs text-[#62432B]/80">Our AI Bio-Vision system will inspect the surface quality and freshness.</p>
                  </div>

                  <div className="rounded-2xl border-2 border-dashed border-[#7DA972] p-6 bg-[#FAF7F0] text-center space-y-4">
                    {formData.image ? (
                      <img src={formData.image} alt="Crop preview" className="w-full max-h-56 object-cover rounded-xl shadow-md mx-auto" />
                    ) : (
                      <div className="w-full h-40 bg-white/50 rounded-xl flex flex-col items-center justify-center text-[#62432B]/60 border border-[#7DA972]/20">
                        <Camera className="w-8 h-8 mb-2 text-[#5F8A55]" />
                        <span className="text-sm font-bold">No photo uploaded yet</span>
                        <span className="text-xs mt-1">Please select an image file to continue</span>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-center gap-3">
                      <label className="px-4 py-2 rounded-xl bg-white border border-[#7DA972]/40 text-[#1F361C] font-bold text-xs hover:bg-[#E6EFE3] flex items-center gap-2 cursor-pointer shadow-sm">
                        <Upload className="w-4 h-4 text-[#5F8A55]" /> Select Image File
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setFormData({ ...formData, image: URL.createObjectURL(e.target.files[0]) });
                            }
                          }} 
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setUploadStep(1)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[#62432B] hover:bg-[#FAF7F0] cursor-pointer"
                    >
                      ← Back
                    </button>

                    <button
                      type="button"
                      disabled={!formData.image}
                      onClick={() => setUploadStep(3)}
                      className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md ${
                        formData.image ? 'bg-[#2B4C26] hover:bg-[#386332]' : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Run AI Quality Grading <Sparkles className="w-4 h-4 text-[#F6D28B]" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: AI SCANNER & GRADE RESULT */}
              {uploadStep === 3 && (
                <div className="space-y-4">
                  <AICropScanner 
                    imageSrc={formData.image} 
                    cropName={formData.name} 
                  />

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setUploadStep(2)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[#62432B] hover:bg-[#FAF7F0] cursor-pointer"
                    >
                      ← Retake Photo
                    </button>

                    <button
                      type="button"
                      onClick={() => setUploadStep(4)}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2B4C26] to-[#386332] text-white font-bold text-xs hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      Generate Master QR & Publish <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: SUMMARY & PUBLISH */}
              {uploadStep === 4 && (
                <div className="space-y-5">
                  <div className="ghibli-card p-5 bg-[#FAF7F0] border border-[#4EA858]/30">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-[#7DA972]/30">
                        <QRCodeSVG value={`https://farmvest.trade/verify/${formData.batchId}`} size={110} level="H" />
                        <span className="font-mono text-[10px] font-bold text-[#2B4C26] mt-1">{formData.batchId}</span>
                        <span className="text-[9px] text-[#5F8A55] font-semibold">Master QR Tag</span>
                      </div>

                      <div className="sm:col-span-2 space-y-2 text-xs">
                        <div className="flex justify-between border-b border-[#7DA972]/20 pb-1">
                          <span className="font-extrabold text-base text-[#1F361C]">{formData.name}</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#E6EFE3] text-[#2B4C26] font-bold">Grade A (92/100)</span>
                        </div>
                        <div><strong>Quantity:</strong> {formData.totalQuantity} {formData.unit}</div>
                        <div><strong>Wholesale Price:</strong> ₹{formData.pricePerKg}/{formData.unit}</div>
                        <div><strong>Origin:</strong> {formData.location}</div>
                        <div><strong>Harvest Date:</strong> {formData.harvestDate}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setUploadStep(3)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[#62432B] hover:bg-[#FAF7F0] cursor-pointer"
                    >
                      ← Back
                    </button>

                    <button
                      type="button"
                      onClick={handleInlinePublish}
                      className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#4EA858] to-[#2B4C26] text-white font-extrabold text-sm hover:scale-105 transition-all shadow-xl flex items-center gap-2 cursor-pointer"
                    >
                      <Sprout className="w-4 h-4" /> Publish Harvest for Sale
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 3. RECEIVED ORDERS & HANDOVER */}
          {activeSidebarNav === 'received_orders' && (
            <div className="ghibli-card-elevated p-6 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-[#7DA972]/20 pb-3">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#1F361C]">Received Retailer Orders</h3>
                  <p className="text-xs text-[#5F8A55]">Live incoming orders and physical pickup handovers</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#E6EFE3] text-[#2B4C26]">
                  {activeOrder ? '1 Active Order' : '0 Orders'}
                </span>
              </div>

              {activeOrder ? (
                <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#7DA972]/40 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#7DA972]/20 pb-2">
                    <div>
                      <span className="font-extrabold text-sm text-[#1F361C]">Order #{activeOrder.id} • {activeOrder.productName}</span>
                      <div className="text-xs text-[#5F8A55]">Retailer: {activeOrder.retailerName}</div>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E6EFE3] text-[#2B4C26]">
                      {activeOrder.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[#62432B] block">Ordered Quantity:</span>
                      <strong>{activeOrder.quantity} kg</strong>
                    </div>
                    <div>
                      <span className="text-[#62432B] block">Your Share (Escrow Locked):</span>
                      <strong className="text-[#2B4C26] text-sm">₹{activeOrder.farmerAmount}</strong>
                    </div>
                    <div>
                      <span className="text-[#62432B] block">Assigned Driver:</span>
                      <strong>{activeOrder.driver?.name} ({activeOrder.driver?.vehicle})</strong>
                    </div>
                  </div>

                  {/* Pickup Handover Button */}
                  {(activeOrder.status === 'Waiting for Pickup' || activeOrder.status === 'Ordered') && (
                    <div className="p-3 bg-[#E6EFE3] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-[#2B4C26]">
                        <strong>Driver Arun Kumar is ready at the farm gate.</strong> Click below to initiate physical cargo handover.
                      </div>
                      <button
                        onClick={() => requestPickupHandover(activeOrder.id)}
                        className="px-5 py-2.5 rounded-xl bg-[#2B4C26] hover:bg-[#386332] text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                      >
                        <Handshake className="w-4 h-4 text-[#A5D6A7]" />
                        Request Handover
                      </button>
                    </div>
                  )}

                  {/* Live GPS Map during transit */}
                  <LiveGPSMap 
                    originName={activeOrder.farmerLocation}
                    destinationName={activeOrder.retailerLocation}
                    driverName={activeOrder.driver?.name}
                    isMoving={activeOrder.status === 'In Transit'}
                  />
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-[#62432B]">
                  No active retailer orders yet. When a retailer orders from your harvest, it will appear here with live handover controls.
                </div>
              )}
            </div>
          )}

          {/* 4. PRODUCTS ALREADY SOLD & EARNINGS */}
          {activeSidebarNav === 'already_sold' && (
            <div className="ghibli-card-elevated p-6 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-[#7DA972]/20 pb-3">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#1F361C]">Already Sold Harvests</h3>
                  <p className="text-xs text-[#5F8A55]">Completed orders & instant smart escrow disbursements</p>
                </div>
                <span className="text-xs font-bold text-[#4EA858] bg-[#E6EFE3] px-3 py-1 rounded-full">
                  Instant Payout Settled
                </span>
              </div>

              {activeOrder?.status === 'Delivered' ? (
                <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#4EA858] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-sm text-[#1F361C]">{activeOrder.quantity} kg {activeOrder.productName}</div>
                    <div className="text-[#5F8A55]">Batch {activeOrder.batchId} • Delivered to {activeOrder.retailerName}</div>
                    <div className="text-[10px] text-[#62432B] mt-0.5">Payment Method: Instant Multi-Sig Smart Escrow</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-xl text-[#2B4C26]">₹{activeOrder.farmerAmount}</div>
                    <div className="text-[11px] text-[#4EA858] font-bold">✓ Credited Instantly</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-[#62432B]">
                  Fulfilled orders will appear here with verifiable transaction receipts once delivery handovers are completed.
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
