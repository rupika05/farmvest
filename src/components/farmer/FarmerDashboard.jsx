import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFarmVest } from '../../context/FarmVestContext';
import { SAMPLE_CROPS, analyzeCropQuality } from '../../services/ai/cropGradingService';
import { verifyImageAuthenticity, requestCameraAccess, generateImageHash, generateLiveChallenge, verifyImageConsistency } from '../../services/ai/authenticityService';
import { calculateFairPrice } from '../../services/ai/fairPriceService';
import { getCropImage } from '../../utils/cropImages';
import { QRCodeSVG } from 'qrcode.react';
import {
  Sprout, Package, CheckCircle, IndianRupee, Plus, QrCode, Sparkles,
  ArrowRight, ArrowLeft, Handshake, ShieldCheck, MapPin, Upload, Camera,
  Calendar, Layers, Inbox, TrendingUp, Award, AlertCircle, CheckCircle2,
  Eye, Cpu, Lock, Leaf, BarChart3, Clock, FileText, RefreshCw, X
} from 'lucide-react';

const STEPS = ['1. Details', '2. Capture', '3. Authenticity', '4. AI Grade', '5. Price & Publish'];

function StepBadge({ step, current }) {
  const done = current > step;
  const active = current === step;
  return (
    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
      done ? 'bg-[#4EA858] text-white' :
      active ? 'bg-[#2B4C26] text-white' :
      'bg-[#FAF7F0] text-[#62432B]'
    }`}>
      {done ? <CheckCircle2 className="w-3 h-3" /> : null}
      {STEPS[step - 1]}
    </div>
  );
}

function SidebarBtn({ id, active, icon: Icon, label, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
        active ? 'bg-[#2B4C26] text-white shadow-md' : 'text-[#1F361C] hover:bg-[#FAF7F0]'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#2B4C26]'}`} />
        <span>{label}</span>
      </div>
      {badge !== undefined && (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-white/20 text-white' : 'bg-[#E6EFE3] text-[#2B4C26]'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-[#7DA972]/10 text-xs last:border-0">
      <span className="text-[#62432B]">{label}</span>
      <span className={`font-bold text-[#1F361C] ${mono ? 'font-mono text-[10px]' : ''}`}>{value}</span>
    </div>
  );
}

export default function FarmerDashboard() {
  const { currentUser } = useAuth();
  const { products, orders, batches, publishProduct, requestHandover, setSelectedQrBatch, loadSampleHarvest, getBatchForProduct, getOrderForBatch, blockchain } = useFarmVest();

  const [nav, setNav] = useState('products');
  const [uploadStep, setUploadStep] = useState(1);

  // Form state
  const [form, setForm] = useState({
    name: '', category: 'Vegetables', totalQuantity: '', unit: 'kg',
    pricePerKg: '', harvestDate: '', cultivationDate: '', location: currentUser?.location || '',
    farmerName: currentUser?.businessName || currentUser?.name || '',
    farmerId: currentUser?.id || '',
    description: '',
    batchId: `FV-${Math.floor(100 + Math.random() * 900)}`
  });

  // Capture state (Multi-View Live Camera)
  const [capturedViews, setCapturedViews] = useState([]); // [view1, view2, view3]
  const [currentViewIdx, setCurrentViewIdx] = useState(0);
  const VIEW_TARGETS = [
    { label: 'Front View', hint: 'Full produce frame' },
    { label: 'Side / Texture View', hint: 'Surface texture & shape' },
    { label: 'Close-Up Detail View', hint: 'Stem, color & surface' }
  ];
  const [liveChallenge, setLiveChallenge] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [wasLiveCapture, setWasLiveCapture] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Verification state
  const [authVerifying, setAuthVerifying] = useState(false);
  const [authReport, setAuthReport] = useState(null);

  // AI grading state
  const [aiScanning, setAiScanning] = useState(false);
  const [aiScanPhase, setAiScanPhase] = useState(0);
  const [aiReport, setAiReport] = useState(null);
  const AI_STEPS = [
    'Agent 1: Visual Consistency Check...',
    'Agent 2: Live Produce Surface Scan...',
    'Agent 2: Defect & Freshness Analysis...',
    'Agent 3: QR/Ledger Certificate Generation...',
    'Grading Complete ✓'
  ];

  // Fair price state
  const [fairPrice, setFairPrice] = useState(null);
  const [publishing, setPublishing] = useState(false);

  // My farmer's products and orders
  const myProducts = products.filter(p => p.farmerId === currentUser?.id || p.farmerName === (currentUser?.businessName || currentUser?.name));
  const myOrders = orders.filter(o => o.farmerId === currentUser?.id || o.farmerName === (currentUser?.businessName || currentUser?.name));
  const activeOrder = myOrders.find(o => !['Delivered', 'Cancelled'].includes(o.status));
  const completedOrders = myOrders.filter(o => o.status === 'Delivered');

  // Reset form
  const resetForm = () => {
    setForm({
      name: '', category: 'Vegetables', totalQuantity: '', unit: 'kg',
      pricePerKg: '', harvestDate: '', cultivationDate: '',
      location: currentUser?.location || '',
      farmerName: currentUser?.businessName || currentUser?.name || '',
      farmerId: currentUser?.id || '',
      description: '',
      batchId: `FV-${Math.floor(100 + Math.random() * 900)}`
    });
    setCapturedImage(null);
    setCapturedViews([]);
    setCurrentViewIdx(0);
    setLiveChallenge(null);
    setCameraError(null);
    setImageFile(null);
    setWasLiveCapture(false);
    setAuthReport(null);
    setAiReport(null);
    setFairPrice(null);
    setUploadStep(1);
    stopCamera();
  };

  // Camera
  const startCamera = async () => {
    setCameraError(null);
    const result = await requestCameraAccess();
    if (result.success) {
      setCameraStream(result.stream);
      setCameraActive(true);
      setLiveChallenge(generateLiveChallenge());
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = result.stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } else {
      setCameraError(result.error || 'Camera permission denied');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const captureFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    setCapturedViews(prev => {
      const updated = [...prev];
      updated[currentViewIdx] = dataUrl;
      return updated;
    });

    setCapturedImage(dataUrl);
    setWasLiveCapture(true);

    if (currentViewIdx < VIEW_TARGETS.length - 1) {
      setCurrentViewIdx(i => i + 1);
      setLiveChallenge(generateLiveChallenge());
    } else {
      stopCamera();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setCapturedImage(url);
      setCapturedViews([url]);
      setWasLiveCapture(false);
    }
  };

  useEffect(() => { return () => stopCamera(); }, []);

  // Step 3: Run authenticity verification
  const runAuthenticity = async () => {
    setAuthVerifying(true);
    const report = await verifyImageAuthenticity({
      images: capturedViews.length > 0 ? capturedViews : [capturedImage],
      imageSource: capturedImage,
      farmerId: currentUser?.id,
      batchId: form.batchId,
      wasLiveCapture,
      challenge: liveChallenge
    });
    setAuthReport(report);
    setAuthVerifying(false);
  };

  // Step 4: Run AI grading
  const runAIGrading = async () => {
    setAiScanning(true);
    setAiScanPhase(0);
    for (let i = 1; i <= AI_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 900));
      setAiScanPhase(i);
    }
    const result = await analyzeCropQuality(capturedImage, form.name, {});
    setAiReport(result);
    setAiScanning(false);
    // Auto-compute fair price
    const fp = calculateFairPrice({
      cropName: form.name,
      category: form.category,
      quantity: Number(form.totalQuantity) || 100,
      unit: form.unit,
      grade: result.grade,
      defectPct: result.defects || 0,
      farmerExpectedPrice: Number(form.pricePerKg) || null
    });
    setFairPrice(fp);
  };

  // Step 5: Publish
  const handlePublish = async () => {
    if (!form.name.trim()) return;
    setPublishing(true);
    const imageUrl = capturedImage && capturedImage.startsWith('http')
      ? capturedImage
      : getCropImage(form);
    const imageHash = capturedImage ? await generateImageHash(capturedImage) : null;

    await publishProduct({
      ...form,
      totalQuantity: Number(form.totalQuantity),
      pricePerKg: Number(form.pricePerKg) || fairPrice?.recommendedPrice || 40,
      image: imageUrl,
      imageHash,
      aiGrade: aiReport,
      authenticityReport: authReport ? {
        level: authReport.level,
        levelLabel: authReport.levelLabel,
        passedCount: authReport.passedCount,
        totalChecks: authReport.totalChecks,
        imageHash: authReport.imageHash,
        timestamp: authReport.timestamp,
        location: authReport.location
      } : null,
      fairPriceRecommendation: fairPrice ? {
        recommendedPrice: fairPrice.recommendedPrice,
        marketRefPrice: fairPrice.marketRef.typical,
        corridor: fairPrice.priceCorridor
      } : null
    });
    setPublishing(false);
    resetForm();
    setNav('products');
  };

  return (
    <div className="space-y-6 pb-16">

      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#E6EFE3] to-[#CBE0C4] border border-[#7DA972]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1F361C]/10 text-xs text-[#2B4C26] font-semibold border border-[#1F361C]/10">
            🌾 Farmer Portal • {currentUser?.businessName || 'Your Farm'}
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#1F361C]">
            Welcome, {currentUser?.name?.split(' ')[0] || currentUser?.businessName || 'Farmer'} 🌱
          </h1>
          <p className="text-xs text-[#62432B]">Add produce → AI verification → Fair price → QR Passport → Merchant marketplace</p>
        </div>
        <button
          onClick={() => { resetForm(); setNav('add_product'); }}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#4EA858] to-[#2B4C26] text-white font-extrabold text-xs shadow-lg flex items-center gap-2 cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" /> + Add New Product
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-3">
          <div className="ghibli-card p-3 bg-white space-y-1.5 shadow-sm sticky top-24">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#825D3E] px-3 py-1 block">Farmer Controls</span>
            <SidebarBtn id="products" active={nav==='products'} icon={Package} label="My Products" badge={myProducts.length} onClick={() => setNav('products')} />
            <SidebarBtn id="add_product" active={nav==='add_product'} icon={Plus} label="Add Product" onClick={() => { resetForm(); setNav('add_product'); }} />
            <SidebarBtn id="orders" active={nav==='orders'} icon={Inbox} label="Orders Received" badge={myOrders.length} onClick={() => setNav('orders')} />
            <SidebarBtn id="batches" active={nav==='batches'} icon={Layers} label="My Batches" badge={batches.filter(b => b.farmerId === currentUser?.id || b.farmerName === (currentUser?.businessName || currentUser?.name)).length} onClick={() => setNav('batches')} />
            <SidebarBtn id="payments" active={nav==='payments'} icon={IndianRupee} label="Payments" badge={completedOrders.length} onClick={() => setNav('payments')} />
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">

          {/* ── MY PRODUCTS ── */}
          {nav === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-xl text-[#1F361C]">My Products</h3>
                  <p className="text-xs text-[#62432B]/80">Active produce listed in the Merchant Marketplace</p>
                </div>
                {myProducts.length > 0 && (
                  <button onClick={() => { resetForm(); setNav('add_product'); }} className="px-4 py-2 rounded-xl bg-[#2B4C26] text-white font-bold text-xs hover:bg-[#386332] flex items-center gap-1.5 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Add Another
                  </button>
                )}
              </div>

              {myProducts.length === 0 ? (
                <div className="ghibli-card p-10 text-center bg-white space-y-4 border-2 border-dashed border-[#7DA972]/40">
                  <div className="w-16 h-16 rounded-full bg-[#E6EFE3] text-3xl flex items-center justify-center mx-auto">🌾</div>
                  <h4 className="font-display font-bold text-lg text-[#1F361C]">No Products Listed Yet</h4>
                  <p className="text-xs text-[#62432B]/80 max-w-md mx-auto">Add your first agricultural product to start the supply chain journey.</p>
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <button onClick={() => { resetForm(); setNav('add_product'); }} className="px-6 py-2.5 rounded-xl bg-[#2B4C26] text-white font-bold text-xs hover:bg-[#386332] flex items-center gap-2 cursor-pointer shadow-md">
                      <Plus className="w-4 h-4" /> Add First Product
                    </button>
                    <button onClick={loadSampleHarvest} className="px-4 py-2.5 rounded-xl bg-[#FAF7F0] hover:bg-[#E6EFE3] text-[#2B4C26] border border-[#7DA972]/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer">
                      <Sparkles className="w-4 h-4 text-[#D9822B]" /> Load Demo Sample
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myProducts.map(prod => {
                    const batch = getBatchForProduct(prod.batchId);
                    const order = getOrderForBatch(prod.batchId);
                    return (
                      <div key={prod.id} className="ghibli-card overflow-hidden bg-white border border-[#7DA972]/30 flex flex-col">
                        <div className="relative h-36 overflow-hidden bg-[#E6EFE3]">
                          <img src={getCropImage(prod)} alt={prod.name} className="w-full h-full object-cover" />
                          <div className="absolute top-2.5 left-2.5 bg-[#1F361C]/90 backdrop-blur px-2.5 py-1 rounded-lg text-white text-[11px] font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#F6D28B]" /> {prod.aiGrade?.grade || 'Ungraded'} ({prod.aiGrade?.score || '—'}/100)
                          </div>
                          <div className="absolute top-2.5 right-2.5 bg-white/95 px-2 py-0.5 rounded font-mono text-[10px] font-bold text-[#2B4C26]">{prod.batchId}</div>
                          <div className={`absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            prod.status === 'Sold' ? 'bg-gray-700 text-white' :
                            order ? 'bg-[#D9822B] text-white' : 'bg-[#4EA858] text-white'
                          }`}>
                            {prod.status === 'Sold' ? '✓ Sold' : order ? `📦 ${order.status}` : '🟢 Available'}
                          </div>
                        </div>
                        <div className="p-4 space-y-2 flex-1">
                          <div className="flex items-start justify-between">
                            <h4 className="font-display font-bold text-sm text-[#1F361C]">{prod.name}</h4>
                            <span className="text-sm font-extrabold text-[#2B4C26]">₹{prod.pricePerKg}/{prod.unit}</span>
                          </div>
                          <p className="text-xs text-[#62432B]/80 line-clamp-1">{prod.description || 'Certified farm harvest.'}</p>
                          <div className="flex justify-between text-xs text-[#5F8A55] border-t border-[#7DA972]/20 pt-1.5">
                            <span>Stock: <strong>{prod.availableQuantity || prod.totalQuantity} {prod.unit}</strong></span>
                            <span>Harvest: {prod.harvestDate || '—'}</span>
                          </div>
                        </div>
                        <div className="px-4 pb-4">
                          <button onClick={() => setSelectedQrBatch(prod)} className="w-full py-2 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/30 hover:bg-[#E6EFE3] text-[#2B4C26] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                            <QrCode className="w-3.5 h-3.5" /> View QR Passport
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── ADD PRODUCT (5-step) ── */}
          {nav === 'add_product' && (
            <div className="ghibli-card-elevated p-6 bg-white space-y-6">
              {/* Step Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#7DA972]/20">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#1F361C]">Add Agricultural Product</h3>
                  <p className="text-xs text-[#5F8A55]">Complete all steps to create a verified batch with QR passport</p>
                </div>
                <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                  {STEPS.map((_, i) => <StepBadge key={i} step={i+1} current={uploadStep} />)}
                </div>
              </div>

              {/* STEP 1: DETAILS */}
              {uploadStep === 1 && (
                <div className="space-y-4">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {[
                      { label: 'Crop / Product Name *', key: 'name', type: 'text', placeholder: '' },
                      { label: 'Quantity Available', key: 'totalQuantity', type: 'number', placeholder: '' },
                      { label: 'Expected Price (₹ / unit)', key: 'pricePerKg', type: 'number', placeholder: '' },
                      { label: 'Harvest Date', key: 'harvestDate', type: 'date', placeholder: '' },
                      { label: 'Cultivation Date', key: 'cultivationDate', type: 'date', placeholder: '' },
                      { label: 'Farm Origin Location', key: 'location', type: 'text', placeholder: '' },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="font-bold text-[#1F361C] block mb-1">{field.label}</label>
                        <input type={field.type} placeholder={field.placeholder} value={form[field.key]}
                          onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                          className="w-full p-2.5 rounded-xl border border-[#7DA972]/30 bg-[#FAF7F0] focus:outline-none focus:border-[#2B4C26]" />
                      </div>
                    ))}
                    <div>
                      <label className="font-bold text-[#1F361C] block mb-1">Category</label>
                      <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        className="w-full p-2.5 rounded-xl border border-[#7DA972]/30 bg-[#FAF7F0] focus:outline-none focus:border-[#2B4C26]">
                        {['Vegetables','Fruits','Grains','Pulses','Spices','Dairy'].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-[#1F361C] block mb-1">Unit</label>
                      <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                        className="w-full p-2.5 rounded-xl border border-[#7DA972]/30 bg-[#FAF7F0] focus:outline-none focus:border-[#2B4C26]">
                        {['kg','quintal','ton','dozen','piece'].map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-[#1F361C] block mb-1 text-xs">Product Description / Farming Method</label>
                    <textarea rows="2" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder=""
                      className="w-full p-2.5 rounded-xl border border-[#7DA972]/30 bg-[#FAF7F0] text-xs focus:outline-none focus:border-[#2B4C26]" />
                  </div>

                  <div className="flex justify-end">
                    <button disabled={!form.name.trim()} onClick={() => setUploadStep(2)}
                      className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md ${form.name.trim() ? 'bg-[#2B4C26] hover:bg-[#386332]' : 'bg-gray-400 cursor-not-allowed'}`}>
                      Next: Capture Image <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: CAPTURE PRODUCE (PRIMARY: LIVE CAMERA) */}
              {uploadStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <h4 className="font-display font-bold text-base text-[#1F361C]">Live Camera Produce Capture</h4>
                    <p className="text-xs text-[#62432B]/80">Capture 3 live views of produce for real-time authenticity & cryptographic hashing</p>
                  </div>

                  {/* Multi-View Step Progress */}
                  <div className="grid grid-cols-3 gap-2">
                    {VIEW_TARGETS.map((target, idx) => {
                      const captured = capturedViews[idx];
                      const active = currentViewIdx === idx && cameraActive;
                      return (
                        <div key={idx} className={`p-2 rounded-xl border text-center transition-all ${
                          captured ? 'bg-[#E6EFE3] border-[#4EA858]' :
                          active ? 'bg-[#FAF7F0] border-[#2B4C26] ring-2 ring-[#2B4C26]/20' :
                          'bg-[#FAF7F0] border-[#7DA972]/30 opacity-70'
                        }`}>
                          <div className="text-[10px] font-bold text-[#1F361C] flex items-center justify-center gap-1">
                            {captured ? <CheckCircle2 className="w-3 h-3 text-[#4EA858]" /> : <Camera className="w-3 h-3 text-[#5F8A55]" />}
                            View {idx + 1}
                          </div>
                          <div className="text-[9px] text-[#62432B] truncate">{target.label}</div>
                          {captured && (
                            <img src={captured} alt={`View ${idx+1}`} className="w-full h-10 mt-1 rounded-md object-cover border border-[#4EA858]" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Live Challenge Banner */}
                  {cameraActive && liveChallenge && (
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-[#2B4C26] to-[#4EA858] text-white text-xs flex items-center gap-2 shadow-md">
                      <Sparkles className="w-4 h-4 text-[#A5D6A7] animate-spin" />
                      <div>
                        <span className="font-extrabold uppercase tracking-wider text-[9px] text-[#A5D6A7] block">🎯 Live Capture Challenge</span>
                        <span className="font-semibold">{liveChallenge.text}</span>
                      </div>
                    </div>
                  )}

                  {/* Camera Viewfinder */}
                  {cameraActive && (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-[#2B4C26] bg-black shadow-inner">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-72 object-cover" />
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Camera Guide Frame Overlay */}
                      <div className="absolute inset-4 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                        <div className="text-[10px] text-white bg-black/50 px-2 py-0.5 rounded-md self-center font-bold">
                          🎯 {VIEW_TARGETS[currentViewIdx]?.label}: Align produce inside frame
                        </div>
                        <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#4EA858] to-transparent animate-pulse" />
                      </div>

                      {/* Controls Bar */}
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                        <button onClick={captureFromCamera} className="px-6 py-2.5 rounded-xl bg-[#4EA858] hover:bg-[#3d8c45] text-white font-extrabold text-xs shadow-xl flex items-center gap-2 cursor-pointer">
                          <Camera className="w-4 h-4" /> Capture View #{currentViewIdx + 1}
                        </button>
                        <button onClick={stopCamera} className="px-3 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center gap-1 shadow">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" /> LIVE CAMERA
                      </div>
                    </div>
                  )}

                  {/* Camera Error / Permission Notice */}
                  {cameraError && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-800 space-y-2">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertCircle className="w-4 h-4 text-amber-600" /> Camera Access Required
                      </div>
                      <p>{cameraError}. Live camera verification is required for High Authenticity score. You may switch to file upload as a fallback.</p>
                    </div>
                  )}

                  {/* Preview when captured */}
                  {capturedImage && !cameraActive && (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-[#7DA972] bg-[#FAF7F0] p-2 space-y-2">
                      <img src={capturedImage} alt="Captured produce preview" className="w-full max-h-56 object-cover rounded-xl" />
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="font-bold text-[#2B4C26]">
                          {wasLiveCapture ? `📷 Live Camera Stream (${capturedViews.length} views captured)` : '📁 Storage File Upload'}
                        </span>
                        <button onClick={() => { setCapturedImage(null); setCapturedViews([]); setCurrentViewIdx(0); startCamera(); }} className="text-xs text-[#62432B] underline font-bold cursor-pointer">
                          Retake All Views
                        </button>
                      </div>
                    </div>
                  )}

                  {!capturedImage && !cameraActive && (
                    <div className="rounded-2xl border-2 border-dashed border-[#7DA972] p-8 bg-[#FAF7F0] text-center space-y-3">
                      <Camera className="w-10 h-10 text-[#5F8A55] mx-auto" />
                      <div>
                        <h5 className="font-bold text-sm text-[#1F361C]">Live Camera Access</h5>
                        <p className="text-xs text-[#62432B]/80 max-w-sm mx-auto">Open device camera to capture live produce views and calculate cryptographic SHA-256 hash.</p>
                      </div>
                      <button onClick={startCamera} className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#2B4C26] to-[#4EA858] text-white font-extrabold text-xs shadow-md flex items-center gap-2 mx-auto cursor-pointer">
                        <Camera className="w-4 h-4" /> Open Live Camera Scanner
                      </button>
                    </div>
                  )}

                  {/* Alternative Fallback */}
                  <div className="pt-2 border-t border-[#7DA972]/20 flex flex-wrap justify-between items-center gap-2">
                    <label className="text-[11px] text-[#62432B] flex items-center gap-1.5 cursor-pointer hover:underline">
                      <Upload className="w-3.5 h-3.5 text-[#5F8A55]" /> Fallback File Upload
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <span className="text-[10px] text-[#825D3E]">Live camera provides highest trust rank</span>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button onClick={() => setUploadStep(1)} className="px-4 py-2 rounded-xl text-xs font-bold text-[#62432B] hover:bg-[#FAF7F0] cursor-pointer flex items-center gap-1">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <button disabled={!capturedImage} onClick={() => { setUploadStep(3); runAuthenticity(); }}
                      className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md ${capturedImage ? 'bg-[#2B4C26] hover:bg-[#386332]' : 'bg-gray-400 cursor-not-allowed'}`}>
                      Run Authenticity Verification <ShieldCheck className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: AUTHENTICITY VERIFICATION */}
              {uploadStep === 3 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="font-display font-bold text-base text-[#1F361C]">Authenticity & Hash Verification</h4>
                    <p className="text-xs text-[#62432B]/80">Verifying live session metadata, Web Crypto SHA-256, and GPS location</p>
                  </div>

                  {authVerifying && (
                    <div className="p-6 rounded-2xl bg-[#E6EFE3] border border-[#7DA972]/40 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-[#2B4C26] flex items-center justify-center mx-auto animate-pulse">
                        <ShieldCheck className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-xs font-bold text-[#2B4C26]">Computing SHA-256 hash & validating camera session…</p>
                    </div>
                  )}

                  {authReport && !authVerifying && (
                    <div className="space-y-4">
                      {/* Summary Banner */}
                      <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                        authReport.status === 'VERIFIED' ? 'bg-[#E6EFE3] border-[#4EA858]' :
                        authReport.status === 'WARNING' ? 'bg-amber-50 border-amber-300' :
                        'bg-red-50 border-red-300'
                      }`}>
                        <div>
                          <div className="font-extrabold text-xs uppercase tracking-wider text-[#62432B]">STATUS REPORT</div>
                          <div className={`text-base font-extrabold ${
                            authReport.status === 'VERIFIED' ? 'text-[#2B4C26]' :
                            authReport.status === 'WARNING' ? 'text-amber-700' : 'text-red-700'
                          }`}>
                            {authReport.status === 'VERIFIED' ? '✓ STATUS: VERIFIED (High Confidence)' :
                             authReport.status === 'WARNING' ? '⚠ STATUS: ADDITIONAL VERIFICATION RECOMMENDED' :
                             '✕ STATUS: VERIFICATION FAILED'}
                          </div>
                          <div className="text-xs text-[#62432B]/80 mt-0.5">
                            {authReport.passedCount}/{authReport.totalChecks} cryptographic signals verified • Hash: {authReport.masterHash?.slice(0, 16)}...
                          </div>
                        </div>
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-extrabold text-base shadow ${
                          authReport.status === 'VERIFIED' ? 'bg-[#4EA858]' :
                          authReport.status === 'WARNING' ? 'bg-amber-500' : 'bg-red-500'
                        }`}>
                          {authReport.passedCount}/{authReport.totalChecks}
                        </div>
                      </div>

                      {/* Checks List */}
                      <div className="space-y-2">
                        {authReport.checks.map(check => (
                          <div key={check.id} className={`p-3 rounded-xl border flex items-start gap-3 text-xs ${
                            check.passed ? 'bg-[#F0FAF0] border-[#7DA972]/30' : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${check.passed ? 'bg-[#4EA858]' : 'bg-gray-400'}`}>
                              {check.passed ? <CheckCircle2 className="w-3 h-3 text-white" /> : <X className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <div className="font-bold text-[#1F361C]">{check.label}</div>
                              <div className="text-[#62432B]/80">{check.detail}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Cryptographic Proof Card */}
                      <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/30 text-xs space-y-1 font-mono">
                        <div className="font-bold text-[#1F361C] font-sans">🔐 Cryptographic Record Details:</div>
                        <div className="text-[11px] text-[#62432B] truncate">Master SHA-256: {authReport.masterHash}</div>
                        <div className="text-[11px] text-[#62432B]">Session UUID: {authReport.sessionId}</div>
                        <div className="text-[11px] text-[#62432B]">GPS Tag: {authReport.locationString}</div>
                      </div>

                      {/* Disclaimer */}
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-800 leading-relaxed">
                        ℹ️ {authReport.disclaimer}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-2">
                    <button onClick={() => setUploadStep(2)} className="px-4 py-2 rounded-xl text-xs font-bold text-[#62432B] hover:bg-[#FAF7F0] cursor-pointer flex items-center gap-1">
                      <ArrowLeft className="w-3.5 h-3.5" /> Retake Camera Views
                    </button>
                    <button disabled={authVerifying} onClick={() => { setUploadStep(4); runAIGrading(); }}
                      className="px-6 py-2.5 rounded-xl bg-[#2B4C26] hover:bg-[#386332] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md">
                      Proceed to AI Quality Grading <Sparkles className="w-4 h-4 text-[#A5D6A7]" />
                    </button>
                  </div>
                </div>
              )}


              {/* STEP 4: AI GRADING */}
              {uploadStep === 4 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="font-display font-bold text-base text-[#1F361C]">AI Quality Grading — FarmVest BioVision</h4>
                    <p className="text-xs text-[#62432B]/80">3-Agent visual analysis pipeline</p>
                  </div>

                  {/* Scanner visual */}
                  <div className="relative rounded-2xl overflow-hidden bg-[#1F361C] max-h-64 border-2 border-[#5F8A55] flex items-center justify-center">
                    <img src={capturedImage || getCropImage(form)} alt="AI scan" className="w-full h-full object-cover opacity-80 max-h-64" />
                    {aiScanning && (
                      <div className="absolute inset-0">
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#4EA858] to-transparent shadow-[0_0_15px_#4EA858] animate-bounce" style={{ marginTop: `${(aiScanPhase / AI_STEPS.length) * 95}%` }} />
                        <div className="absolute top-1/4 left-1/4 w-24 h-24 border-2 border-dashed border-[#F6D28B] rounded-xl animate-pulse flex items-start justify-start p-1">
                          <span className="bg-[#1F361C]/90 text-[9px] text-[#F6D28B] px-1 rounded font-mono">ROI: 98.2%</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 right-3 bg-[#142412]/90 backdrop-blur p-2.5 rounded-xl flex items-center justify-between text-white text-xs">
                      <div className="flex items-center gap-2">
                        <Cpu className={`w-4 h-4 ${aiScanning ? 'text-[#F6D28B] animate-spin' : 'text-[#4EA858]'}`} />
                        <span className="font-mono text-[11px]">{AI_STEPS[Math.min(aiScanPhase, AI_STEPS.length-1)]}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase text-[#A5D6A7]">{aiScanning ? 'Analyzing' : 'Done'}</span>
                    </div>
                  </div>

                  {/* Grade result */}
                  {aiReport && !aiScanning && (
                    <div className="ghibli-card-elevated p-5 border-[#4EA858]/40 animate-in fade-in zoom-in-95 duration-500">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#7DA972]/20">
                        <div className="flex items-center gap-4">
                          <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-lg text-white ${
                            aiReport.grade?.includes('A') ? 'bg-gradient-to-br from-[#4EA858] to-[#2B4C26]' :
                            aiReport.grade?.includes('B') ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                            'bg-gradient-to-br from-red-400 to-red-600'
                          }`}>
                            <span className="font-display font-extrabold text-2xl leading-none">{aiReport.score}</span>
                            <span className="text-[9px] uppercase text-white/80">/ 100</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-display font-extrabold text-2xl text-[#1F361C]">{aiReport.grade}</h3>
                              <span className="px-2.5 py-0.5 rounded-full bg-[#E6EFE3] text-[#2B4C26] font-bold text-xs">AI Certified</span>
                            </div>
                            <p className="text-xs text-[#5F8A55]">BioVision Model v3.4 • Confidence {aiReport.confidence}%</p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                        {[
                          { label: 'Freshness', value: `${aiReport.freshness}%`, good: aiReport.freshness >= 80 },
                          { label: 'Visual Quality', value: `${aiReport.visualQuality}%`, good: aiReport.visualQuality >= 80 },
                          { label: 'Defect Index', value: `${aiReport.defects}%`, good: aiReport.defects <= 10 },
                          { label: 'Confidence', value: `${aiReport.confidence}%`, good: true }
                        ].map(m => (
                          <div key={m.label} className="p-2.5 rounded-xl bg-white border border-[#7DA972]/20 text-center">
                            <span className="text-[10px] text-[#62432B] uppercase font-bold block">{m.label}</span>
                            <span className={`text-lg font-bold ${m.good ? 'text-[#2B4C26]' : 'text-[#D9822B]'}`}>{m.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1 text-xs text-[#1F361C] bg-[#FAF7F0] p-3 rounded-xl border border-[#7DA972]/20">
                        <div className="font-bold text-[#2B4C26] mb-1">AI Observations:</div>
                        {(aiReport.observations || []).map((obs, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[#386332]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#4EA858] flex-shrink-0" /><span>{obs}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <button onClick={() => setUploadStep(3)} className="px-4 py-2 rounded-xl text-xs font-bold text-[#62432B] hover:bg-[#FAF7F0] cursor-pointer flex items-center gap-1">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <button disabled={aiScanning || !aiReport} onClick={() => setUploadStep(5)}
                      className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md ${!aiScanning && aiReport ? 'bg-[#2B4C26] hover:bg-[#386332]' : 'bg-gray-400 cursor-not-allowed'}`}>
                      View Price Recommendation <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: PRICE & PUBLISH */}
              {uploadStep === 5 && (
                <div className="space-y-5">
                  {/* Fair Price */}
                  {fairPrice && (
                    <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#7DA972]/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-display font-bold text-sm text-[#1F361C] flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-[#D9822B]" /> Fair Price Recommendation
                        </h4>
                        <span className="text-[10px] text-[#62432B]/60">Based on APMC indicative prices</span>
                      </div>
                      <div className="text-center">
                        <div className="font-display font-extrabold text-4xl text-[#2B4C26]">₹{fairPrice.recommendedPrice}</div>
                        <div className="text-xs text-[#5F8A55]">per {form.unit} • Total: ₹{fairPrice.totalValue.toLocaleString()}</div>
                        <div className="text-[10px] text-[#62432B]/80 mt-1">Market corridor: ₹{fairPrice.priceCorridor.min}–₹{fairPrice.priceCorridor.max}/{form.unit}</div>
                      </div>
                      <div className="space-y-1.5">
                        {fairPrice.adjustments.map((adj, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-[#62432B]">{adj.label}</span>
                            <span className={`font-bold ${adj.isBase ? 'text-[#1F361C]' : adj.isPositive ? 'text-[#4EA858]' : adj.value === 0 ? 'text-[#62432B]' : 'text-[#D9822B]'}`}>
                              {adj.isBase ? `₹${adj.value}` : adj.value > 0 ? `+₹${adj.value}` : adj.value === 0 ? '—' : `₹${adj.value}`}
                            </span>
                          </div>
                        ))}
                      </div>
                      {fairPrice.farmerComparison && (
                        <div className={`p-2.5 rounded-xl text-xs border ${
                          fairPrice.farmerComparison.assessment === 'fair' ? 'bg-[#E6EFE3] border-[#7DA972]/40 text-[#2B4C26]' :
                          fairPrice.farmerComparison.assessment === 'above_market' ? 'bg-amber-50 border-amber-300 text-amber-800' :
                          'bg-blue-50 border-blue-300 text-blue-800'
                        }`}>
                          Your expected price (₹{fairPrice.farmerComparison.expectedPrice}): {fairPrice.farmerComparison.label}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-[#1F361C]">Final Price:</label>
                        <input type="number" value={form.pricePerKg || fairPrice.recommendedPrice}
                          onChange={e => setForm(f => ({ ...f, pricePerKg: e.target.value }))}
                          className="flex-1 p-2 rounded-xl border border-[#7DA972]/30 bg-white text-xs focus:outline-none focus:border-[#2B4C26] font-bold" />
                        <button onClick={() => setForm(f => ({ ...f, pricePerKg: fairPrice.recommendedPrice }))} className="px-3 py-2 rounded-xl border border-[#7DA972]/30 text-xs text-[#2B4C26] hover:bg-[#E6EFE3] cursor-pointer">Use AI Price</button>
                      </div>
                    </div>
                  )}

                  {/* Batch Summary & QR */}
                  <div className="ghibli-card p-5 bg-[#FAF7F0] border border-[#4EA858]/30">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-[#7DA972]/30">
                        <QRCodeSVG value={`${window.location.origin}/verify/${form.batchId}`} size={110} level="H" />
                        <span className="font-mono text-[10px] font-bold text-[#2B4C26] mt-1">{form.batchId}</span>
                        <span className="text-[9px] text-[#5F8A55]">Product QR Passport</span>
                      </div>
                      <div className="sm:col-span-2 space-y-2 text-xs">
                        <div className="flex justify-between items-center border-b border-[#7DA972]/20 pb-1">
                          <span className="font-extrabold text-base text-[#1F361C]">{form.name}</span>
                          {aiReport && <span className="px-2 py-0.5 rounded-full bg-[#E6EFE3] text-[#2B4C26] font-bold">{aiReport.grade} ({aiReport.score}/100)</span>}
                        </div>
                        <InfoRow label="Quantity" value={`${form.totalQuantity} ${form.unit}`} />
                        <InfoRow label="Listed Price" value={`₹${form.pricePerKg || fairPrice?.recommendedPrice || '—'}/${form.unit}`} />
                        <InfoRow label="Origin" value={form.location || '—'} />
                        <InfoRow label="Harvest Date" value={form.harvestDate || '—'} />
                        {authReport && <InfoRow label="Authenticity" value={authReport.levelLabel} />}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#E6EFE3] border border-[#7DA972]/30 text-xs text-[#2B4C26]">
                    <strong>📦 What happens next:</strong> A Genesis Block will be created in the ledger. A QR passport linking to /verify/{form.batchId} will be generated. Your product will appear in the Merchant Marketplace.
                  </div>

                  <div className="flex justify-between">
                    <button onClick={() => setUploadStep(4)} className="px-4 py-2 rounded-xl text-xs font-bold text-[#62432B] hover:bg-[#FAF7F0] cursor-pointer flex items-center gap-1">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <button onClick={handlePublish} disabled={publishing || !form.name.trim()}
                      className={`px-8 py-3 rounded-2xl text-white font-extrabold text-sm flex items-center gap-2 cursor-pointer shadow-xl transition-all ${!publishing ? 'bg-gradient-to-r from-[#4EA858] to-[#2B4C26] hover:scale-105' : 'bg-gray-400'}`}>
                      {publishing ? <><RefreshCw className="w-4 h-4 animate-spin" /> Publishing…</> : <><Sprout className="w-4 h-4" /> Create Batch & Publish</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ORDERS RECEIVED ── */}
          {nav === 'orders' && (
            <div className="ghibli-card-elevated p-6 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-[#7DA972]/20 pb-3">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#1F361C]">Orders Received</h3>
                  <p className="text-xs text-[#5F8A55]">Merchant orders and custody handover controls</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#E6EFE3] text-[#2B4C26]">{myOrders.length} orders</span>
              </div>

              {myOrders.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#62432B]">No orders yet. When a merchant places an order, it will appear here.</div>
              ) : (
                <div className="space-y-3">
                  {myOrders.map(order => (
                    <div key={order.id} className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#7DA972]/40 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-sm text-[#1F361C]">{order.productName} — {order.quantity} {order.unit || 'kg'}</span>
                          <div className="text-xs text-[#5F8A55]">Merchant: {order.merchantName} • ₹{order.totalAmount}</div>
                          <div className="text-[10px] text-[#62432B] font-mono">Batch: {order.batchId}</div>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          order.status === 'Delivered' ? 'bg-[#E6EFE3] text-[#2B4C26]' :
                          order.status === 'Waiting for Handover' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>{order.status}</span>
                      </div>

                      {(order.status === 'Ordered' || order.status === 'Waiting for Handover' || order.status === 'Handover Accepted') && order.status !== 'Waiting for Handover' && (
                        <div className="p-3 bg-[#E6EFE3] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-xs text-[#2B4C26]">
                            <strong>Merchant {order.merchantName} has placed an order.</strong> Ready to initiate custody handover.
                          </div>
                          <button onClick={() => requestHandover(order.id)}
                            className="px-4 py-2.5 rounded-xl bg-[#2B4C26] hover:bg-[#386332] text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer whitespace-nowrap">
                            <Handshake className="w-4 h-4 text-[#A5D6A7]" /> Request Handover
                          </button>
                        </div>
                      )}

                      {order.status === 'Waiting for Handover' && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          Handover requested. Waiting for merchant to accept custody.
                        </div>
                      )}

                      {order.status === 'Delivered' && (
                        <div className="p-3 bg-[#E6EFE3] border border-[#4EA858] rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-[#2B4C26]">✓ Order Complete</div>
                            <div className="text-[#5F8A55]">Payment: ₹{order.finalFarmerAmount || order.farmerAmount} • TxID: {order.paymentTxId || '—'}</div>
                          </div>
                          <CheckCircle className="w-8 h-8 text-[#4EA858]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── BATCHES ── */}
          {nav === 'batches' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-display font-bold text-xl text-[#1F361C]">My Batches</h3>
                <p className="text-xs text-[#62432B]/80">Product batches with supply chain ledger history</p>
              </div>
              {batches.filter(b => b.farmerId === currentUser?.id || b.farmerName === (currentUser?.businessName || currentUser?.name)).length === 0 ? (
                <div className="ghibli-card p-10 text-center bg-white text-xs text-[#62432B]">No batches yet. Add a product to create a batch.</div>
              ) : (
                <div className="space-y-3">
                  {batches.filter(b => b.farmerId === currentUser?.id || b.farmerName === (currentUser?.businessName || currentUser?.name)).map(batch => (
                    <div key={batch.id} className="ghibli-card p-4 bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-[10px] text-[#5F8A55]">{batch.batchId}</span>
                          <div className="font-bold text-sm text-[#1F361C]">{batch.productName} — {batch.quantity} {batch.unit}</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          batch.status === 'Delivered' ? 'bg-[#E6EFE3] text-[#2B4C26]' :
                          batch.status === 'With Merchant' ? 'bg-blue-100 text-blue-800' :
                          batch.status === 'Ordered' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>{batch.journeyStatus}</span>
                      </div>
                      {/* Mini journey timeline */}
                      <div className="space-y-1">
                        {(batch.journey || []).map((j, i) => (
                          <div key={i} className="flex items-start gap-2 text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-[#4EA858] flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-[#1F361C]">{j.event}</span>
                              <span className="text-[#62432B] ml-1">— {j.note}</span>
                              <span className="text-[#5F8A55] ml-1">{new Date(j.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-1 border-t border-[#7DA972]/20">
                        <span className="text-[10px] text-[#62432B] font-mono">Genesis Hash: {batch.genesisBlockHash?.slice(0, 16)}…</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {nav === 'payments' && (
            <div className="ghibli-card-elevated p-6 bg-white space-y-4">
              <div className="border-b border-[#7DA972]/20 pb-3">
                <h3 className="font-display font-bold text-lg text-[#1F361C]">Payments</h3>
                <p className="text-xs text-[#5F8A55]">Completed transactions and earnings</p>
              </div>
              {completedOrders.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#62432B]">Payments will appear here after successful order delivery.</div>
              ) : (
                <div className="space-y-3">
                  {completedOrders.map(o => (
                    <div key={o.id} className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#4EA858] flex items-center justify-between">
                      <div className="text-xs">
                        <div className="font-bold text-sm text-[#1F361C]">{o.productName} — {o.quantity} {o.unit || 'kg'}</div>
                        <div className="text-[#5F8A55]">Batch: {o.batchId} • Sold to {o.merchantName}</div>
                        <div className="text-[10px] text-[#62432B] font-mono">TxID: {o.paymentTxId || '—'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-xl text-[#2B4C26]">₹{o.finalFarmerAmount || o.farmerAmount}</div>
                        <div className="text-[11px] text-[#4EA858] font-bold">✓ Paid</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
