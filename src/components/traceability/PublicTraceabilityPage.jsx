import React from 'react';
import { useFarmVest } from '../../context/FarmVestContext';
import { useAuth } from '../../context/AuthContext';
import FarmVestLogo from '../common/FarmVestLogo';
import { 
  Sprout, 
  Cpu, 
  Package, 
  Truck, 
  Store, 
  CheckCircle2, 
  ShieldCheck, 
  ExternalLink, 
  Sparkles, 
  Calendar, 
  MapPin, 
  IndianRupee,
  Lock,
  ArrowLeft,
  QrCode,
  Download
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function PublicTraceabilityPage() {
  const { selectedQrBatch, activeOrder } = useFarmVest();
  const { setActiveView } = useAuth();

  const batch = selectedQrBatch || {
    batchId: activeOrder?.batchId || 'FV-TOM-101',
    name: activeOrder?.productName || 'Heritage Red Tomato',
    farmerName: activeOrder?.farmerName || 'Green Valley Farm (Ramesh Patel)',
    location: activeOrder?.farmerLocation || 'Saranathan Farm, Valley Sector 4, Trichy',
    harvestDate: '21 Sept 2026',
    pricePerKg: activeOrder?.pricePerKg || 40,
    totalQuantity: activeOrder?.quantity || 100,
    unit: 'kg',
    aiGrade: activeOrder?.aiGrade || {
      score: 92,
      grade: 'Grade A',
      freshness: 94,
      visualQuality: 92,
      defects: 6,
      confidence: 95
    }
  };

  const farmerShare = activeOrder?.farmerAmount || (batch.totalQuantity * batch.pricePerKg) || 4000;
  const driverShare = activeOrder?.driverAmount || 500;
  const platformShare = 0;
  const totalAmount = activeOrder?.totalAmount || (farmerShare + driverShare);

  return (
    <div className="min-h-screen bg-[#FAF7F0] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveView('landing')}
            className="px-4 py-2 rounded-xl bg-white border border-[#7DA972]/30 text-xs font-bold text-[#1F361C] hover:bg-[#E6EFE3] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home Page
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6EFE3] text-xs font-bold text-[#2B4C26] border border-[#7DA972]/40">
            <ShieldCheck className="w-4 h-4 text-[#4EA858]" />
            <span>Final Master QR Blockchain Certificate</span>
          </div>
        </div>

        {/* Hero Header Certificate Box */}
        <div className="ghibli-card-elevated p-6 sm:p-10 bg-gradient-to-br from-[#1F361C] via-[#264423] to-[#172D15] text-white rounded-3xl space-y-6 relative overflow-hidden shadow-2xl">
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/15">
            <div className="space-y-2">
              <FarmVestLogo size="md" variant="light" showTagline={true} />
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white mt-4">
                Verified Harvest Journey 🌱
              </h1>
              <p className="text-xs sm:text-sm text-[#CBE0C4]">
                100% Verifiable Traceability from Cultivation to Supermarket Shelf.
              </p>
            </div>

            {/* Master QR Code Widget */}
            <div className="bg-white p-3.5 rounded-2xl border-2 border-[#A5D6A7] text-center self-start sm:self-auto shadow-xl flex flex-col items-center">
              <QRCodeSVG 
                value={`https://farmvest.trade/verify/${batch.batchId}`}
                size={110}
                level="H"
                includeMargin={false}
              />
              <span className="font-mono text-[10px] font-bold text-[#1F361C] mt-1.5">{batch.batchId}</span>
              <span className="text-[9px] font-bold text-[#4EA858] uppercase">Final Master QR</span>
            </div>
          </div>

          {/* Batch Summary Grid */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#A2C498] block text-[11px]">Product:</span>
              <strong className="text-white text-sm">{batch.name}</strong>
            </div>
            <div>
              <span className="text-[#A2C498] block text-[11px]">AI Quality Grade:</span>
              <strong className="text-[#F6D28B] text-sm">{batch.aiGrade?.grade || 'Grade A'} ({batch.aiGrade?.score || 92}/100)</strong>
            </div>
            <div>
              <span className="text-[#A2C498] block text-[11px]">Cultivated At:</span>
              <strong className="text-white">{batch.farmerName || 'Green Valley Farm'}</strong>
            </div>
            <div>
              <span className="text-[#A2C498] block text-[11px]">Harvest Date:</span>
              <strong className="text-white">{batch.harvestDate || '21 Sept 2026'}</strong>
            </div>
          </div>

        </div>

        {/* 6-STAGE COMPLETE HARVEST LIFECYCLE */}
        <div className="ghibli-card p-6 sm:p-8 bg-white space-y-6 shadow-md">
          <div className="flex items-center justify-between border-b border-[#7DA972]/20 pb-4">
            <h3 className="font-display font-bold text-xl text-[#1F361C] flex items-center gap-2">
              <Sprout className="w-5 h-5 text-[#2B4C26]" /> 01–06 Full Product Lifecycle Journey
            </h3>
            <span className="text-xs text-[#5F8A55] font-semibold">Dual Handover Verified</span>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-[#7DA972]/30">
            
            {/* Stage 1: 🌾 Farm Origin */}
            <div className="flex items-start gap-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-[#E6EFE3] border-2 border-[#2B4C26] text-xl flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                🌾
              </div>
              <div className="flex-1 bg-[#FAF7F0] p-4 rounded-2xl border border-[#7DA972]/20">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1F361C]">01. Cultivation & Harvest Origin</h4>
                  <span className="text-[11px] text-[#5F8A55]">{batch.harvestDate}, 06:00 AM</span>
                </div>
                <p className="text-xs text-[#62432B]/90 mt-1 leading-relaxed">
                  Cultivated at <strong>{batch.location}</strong> by {batch.farmerName}. Soil: Organic black loam with drip irrigation.
                </p>
              </div>
            </div>

            {/* Stage 2: 🤖 AI Quality Check */}
            <div className="flex items-start gap-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-[#E6EFE3] border-2 border-[#4EA858] text-xl flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                🤖
              </div>
              <div className="flex-1 bg-[#FAF7F0] p-4 rounded-2xl border border-[#7DA972]/20">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1F361C]">02. AI Bio-Vision Quality Assessment</h4>
                  <span className="text-[11px] text-[#2B4C26] font-bold">Grade A (92/100 Quality Score)</span>
                </div>
                <p className="text-xs text-[#62432B]/90 mt-1 leading-relaxed">
                  Scanned via FarmVest BioVision Neural Model. Freshness: 94% • Visual Quality: 92% • Defects: 6%.
                </p>
              </div>
            </div>

            {/* Stage 3: 📦 Packed & Sealed */}
            <div className="flex items-start gap-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF7F0] border-2 border-[#7DA972] text-xl flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                📦
              </div>
              <div className="flex-1 bg-[#FAF7F0] p-4 rounded-2xl border border-[#7DA972]/20">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1F361C]">03. Packed with Master QR Tag</h4>
                  <span className="text-[11px] text-[#5F8A55]">Batch: {batch.batchId}</span>
                </div>
                <p className="text-xs text-[#62432B]/90 mt-1 leading-relaxed">
                  Crates packaged in eco-fiber boxes with tamper-evident cryptographic Master QR batch seal.
                </p>
              </div>
            </div>

            {/* Stage 4: 🚚 Pickup Handover */}
            <div className="flex items-start gap-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-[#FDF3E3] border-2 border-[#D9822B] text-xl flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                🤝
              </div>
              <div className="flex-1 bg-[#FAF7F0] p-4 rounded-2xl border border-[#7DA972]/20">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1F361C]">04. Verified Pickup Handover</h4>
                  <span className="text-[11px] text-[#D9822B] font-bold">Request → Accept Verified</span>
                </div>
                <p className="text-xs text-[#62432B]/90 mt-1 leading-relaxed">
                  Farmer initiated handover request; Driver Arun Kumar physically inspected produce and accepted custody.
                </p>
              </div>
            </div>

            {/* Stage 5: 📍 Live GPS Transit */}
            <div className="flex items-start gap-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] border-2 border-[#0284C7] text-xl flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                📍
              </div>
              <div className="flex-1 bg-[#FAF7F0] p-4 rounded-2xl border border-[#7DA972]/20">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1F361C]">05. Transit via Green Highway 45</h4>
                  <span className="text-[11px] text-[#0284C7] font-bold">12.4 km Route • Speed: 42 km/h</span>
                </div>
                <p className="text-xs text-[#62432B]/90 mt-1 leading-relaxed">
                  Continuous GPS telemetry logged on road. Live tracking monitored by both Farmer and Retailer.
                </p>
              </div>
            </div>

            {/* Stage 6: 🏪 Store Delivery Handover & Escrow */}
            <div className="flex items-start gap-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-[#E6EFE3] border-2 border-[#4EA858] text-xl flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                🏪
              </div>
              <div className="flex-1 bg-[#FAF7F0] p-4 rounded-2xl border border-[#7DA972]/20">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1F361C]">06. Retailer Scan Check-in & Escrow Settlement</h4>
                  <span className="text-[11px] text-[#4EA858] font-bold">FreshMart Superstores</span>
                </div>
                <p className="text-xs text-[#62432B]/90 mt-1 leading-relaxed">
                  Store manager scanned produce and accepted handover. Smart Escrow instantly distributed payments!
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* TRANSPARENT PRICE SPLIT-UPS */}
        <div className="ghibli-card p-6 sm:p-8 bg-white space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-[#7DA972]/20 pb-3">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-[#2B4C26]" />
              <h3 className="font-display font-bold text-lg text-[#1F361C]">
                Fair Trade Price Split-Up Breakdown
              </h3>
            </div>
            <span className="text-xs font-bold text-[#4EA858] bg-[#E6EFE3] px-3 py-1 rounded-full">
              100% Transparent
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#7DA972]/30 text-center sm:text-left">
              <span className="text-[#62432B] font-semibold block">🌾 Farmer Share ({batch.totalQuantity} kg @ ₹{batch.pricePerKg})</span>
              <div className="font-display font-extrabold text-2xl text-[#2B4C26] my-1">₹{farmerShare.toLocaleString()}</div>
              <div className="text-[11px] text-[#5F8A55] font-bold">100% paid directly to Cultivator</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#7DA972]/30 text-center sm:text-left">
              <span className="text-[#62432B] font-semibold block">🚚 Driver Logistics Tariff</span>
              <div className="font-display font-extrabold text-2xl text-[#D9822B] my-1">₹{driverShare.toLocaleString()}</div>
              <div className="text-[11px] text-[#D9822B] font-bold">100% paid directly to Transporter</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#E6EFE3] border border-[#4EA858] text-center sm:text-left">
              <span className="text-[#2B4C26] font-semibold block">🛡️ FarmVest Intermediary Cut</span>
              <div className="font-display font-extrabold text-2xl text-[#2B4C26] my-1">₹0.00</div>
              <div className="text-[11px] text-[#2B4C26] font-bold">0% Middleman Deduction Guarantee</div>
            </div>
          </div>

          {/* Visual Percentage Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-[#2B4C26]">🌾 Farmer: 88.9% (₹{farmerShare.toLocaleString()})</span>
              <span className="text-[#D9822B]">🚚 Driver: 11.1% (₹{driverShare.toLocaleString()})</span>
            </div>
            <div className="w-full h-3.5 rounded-full bg-[#FAF7F0] border border-[#7DA972]/30 overflow-hidden flex">
              <div className="h-full bg-[#2B4C26]" style={{ width: '88.9%' }} />
              <div className="h-full bg-[#D9822B]" style={{ width: '11.1%' }} />
            </div>
          </div>
        </div>

        {/* Bottom Print & Share Action */}
        <div className="flex justify-center">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 rounded-2xl bg-white border border-[#7DA972]/40 text-[#1F361C] font-bold text-xs hover:bg-[#FAF7F0] flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download / Print Physical Certificate
          </button>
        </div>

      </div>
    </div>
  );
}
