import React, { useState } from 'react';
import { 
  Sprout, 
  Scan, 
  QrCode, 
  Store, 
  MapPin, 
  Truck, 
  Handshake, 
  Navigation, 
  CheckCircle, 
  Coins, 
  FileSearch,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function HowItWorksTimeline() {
  const { loginAsRole, setActiveView } = useAuth();
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'Harvest',
      desc: 'Farmer creates a crop batch with details like quantity, variety, and harvest date.',
      icon: Sprout,
      role: 'farmer',
      badge: '🌾 Farmer Origin'
    },
    {
      num: '02',
      title: 'AI Quality Check',
      desc: 'Farmer uploads/takes a crop image; AI scans freshness, visual quality, and defects (Grade A: 92/100).',
      icon: Scan,
      role: 'farmer',
      badge: '🤖 AI Vision Neural Engine'
    },
    {
      num: '03',
      title: 'Master QR',
      desc: 'FarmVest mints a unique Master QR and cryptographic Batch ID (FV-TOM-101) on Polygon.',
      icon: QrCode,
      role: 'farmer',
      badge: '⛓️ Immutable Batch Registry'
    },
    {
      num: '04',
      title: 'Marketplace',
      desc: 'Retailers discover the certified harvest in the organic marketplace and place orders.',
      icon: Store,
      role: 'retailer',
      badge: '🏪 Direct Marketplace'
    },
    {
      num: '05',
      title: 'AI Logistics',
      desc: 'FarmVest automatically generates the optimized transportation roadmap and carbon-efficient routing.',
      icon: MapPin,
      role: 'all',
      badge: '🗺️ AI Roadmap Generator'
    },
    {
      num: '06',
      title: 'Driver Allocation',
      desc: 'Nearby available driver receives the trip alert with cargo details, route, and earnings (₹500).',
      icon: Truck,
      role: 'driver',
      badge: '🚚 Driver Matchmaking'
    },
    {
      num: '07',
      title: 'Pickup Handover',
      desc: 'Farmer initiates "Request Handover"; Driver inspects cargo and clicks "Accept Handover".',
      icon: Handshake,
      role: 'farmer',
      badge: '🤝 Request → Accept #1'
    },
    {
      num: '08',
      title: 'Live Tracking',
      desc: 'Driver enters transit; Farmer and Retailer monitor real-time GPS speed, heading, and dynamic ETA.',
      icon: Navigation,
      role: 'driver',
      badge: '🛰️ Live GPS Telemetry'
    },
    {
      num: '09',
      title: 'Delivery Handover',
      desc: 'Driver arrives at store and requests delivery handover; Retailer inspects and accepts goods.',
      icon: CheckCircle,
      role: 'retailer',
      badge: '🤝 Request → Accept #2'
    },
    {
      num: '10',
      title: 'Settlement',
      desc: 'Smart Escrow instantly disburses ₹4,000 to Farmer and ₹500 to Driver with zero intermediary cuts.',
      icon: Coins,
      role: 'all',
      badge: '💰 Smart Escrow Vault'
    },
    {
      num: '11',
      title: 'Traceability',
      desc: 'Consumers scan the on-pack Master QR to trace the full verifiable journey from seed to store.',
      icon: FileSearch,
      role: 'public',
      badge: '🔍 Public Consumer Proof'
    }
  ];

  return (
    <section className="py-20 relative overflow-hidden bg-[#FAF7F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6EFE3] border border-[#7DA972]/30 text-xs font-bold text-[#2B4C26] uppercase tracking-wider">
            <span>11-Step Lifecycle</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#142412]">
            How FarmVest Works
          </h2>
          <p className="text-sm sm:text-base text-[#62432B]/85">
            A seamless, automated sequence ensuring fair trade, quality guarantee, and real-time physical accountability.
          </p>
        </div>

        {/* Interactive Step Navigator / Horizontal Carousel */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-thin">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCurrent = activeStep === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isCurrent
                    ? 'bg-[#2B4C26] text-white shadow-md scale-105'
                    : 'bg-white/80 text-[#2B4C26] border border-[#7DA972]/30 hover:bg-[#E6EFE3]'
                }`}
              >
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isCurrent ? 'bg-white/20 text-white' : 'bg-[#E6EFE3] text-[#2B4C26]'
                }`}>
                  {step.num}
                </span>
                <Icon className="w-3.5 h-3.5" />
                <span>{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Step Detailed Spotlight Card */}
        <div className="ghibli-card-elevated p-8 sm:p-10 mb-12 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-extrabold px-3 py-1 rounded-full bg-[#2B4C26] text-white">
                  Step {steps[activeStep].num}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#D9822B] bg-[#FDF3E3] px-3 py-1 rounded-full border border-[#F6D28B]">
                  {steps[activeStep].badge}
                </span>
              </div>

              <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-[#142412]">
                {steps[activeStep].title}
              </h3>

              <p className="text-sm sm:text-base text-[#462E1C] leading-relaxed max-w-xl">
                {steps[activeStep].desc}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                {steps[activeStep].role === 'farmer' && (
                  <button
                    onClick={() => { loginAsRole('farmer'); setActiveView('app'); }}
                    className="px-5 py-2 rounded-xl bg-[#2B4C26] text-white text-xs font-bold hover:bg-[#386332] transition-all flex items-center gap-1.5"
                  >
                    🌾 Test Farmer Experience <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {steps[activeStep].role === 'retailer' && (
                  <button
                    onClick={() => { loginAsRole('retailer'); setActiveView('app'); }}
                    className="px-5 py-2 rounded-xl bg-[#0284C7] text-white text-xs font-bold hover:bg-[#0369A1] transition-all flex items-center gap-1.5"
                  >
                    🏪 Explore Marketplace <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {steps[activeStep].role === 'driver' && (
                  <button
                    onClick={() => { loginAsRole('driver'); setActiveView('app'); }}
                    className="px-5 py-2 rounded-xl bg-[#D9822B] text-white text-xs font-bold hover:bg-[#c27020] transition-all flex items-center gap-1.5"
                  >
                    🚚 Launch Driver Console <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {steps[activeStep].role === 'public' && (
                  <button
                    onClick={() => setActiveView('traceability')}
                    className="px-5 py-2 rounded-xl bg-[#5F8A55] text-white text-xs font-bold hover:bg-[#4d7244] transition-all flex items-center gap-1.5"
                  >
                    🔍 View Live Trace Certificate <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Visual Icon Box */}
            <div className="flex justify-center">
              <div className="w-36 h-36 rounded-3xl bg-gradient-to-br from-[#E6EFE3] to-[#CBE0C4] border-2 border-[#7DA972]/40 flex flex-col items-center justify-center shadow-lg relative group">
                {React.createElement(steps[activeStep].icon, { className: 'w-16 h-16 text-[#2B4C26] transition-transform duration-300 group-hover:scale-110' })}
                <span className="text-[11px] font-bold text-[#386332] mt-2 font-display">
                  STAGE {steps[activeStep].num}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* 11-Step Grid Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            const isCurrent = activeStep === idx;
            return (
              <div
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isCurrent 
                    ? 'bg-[#E6EFE3] border-[#2B4C26] shadow-md -translate-y-1' 
                    : 'bg-white/80 border-[#7DA972]/20 hover:border-[#5F8A55] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-[#825D3E]">{st.num}</span>
                  <Icon className="w-4 h-4 text-[#2B4C26]" />
                </div>
                <div className="font-bold text-xs text-[#1F361C] truncate">{st.title}</div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
