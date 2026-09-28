import React from 'react';
import { useAuth } from '../context/AuthContext';
import FarmVestLogo from '../components/common/FarmVestLogo';
import { 
  Sprout, 
  Scan, 
  Store, 
  Truck, 
  CheckCircle2, 
  CreditCard, 
  QrCode, 
  ArrowRight, 
  ShieldCheck, 
  Coins, 
  Sparkles,
  TrendingUp
} from 'lucide-react';

export default function HomePage() {
  const { setActiveView } = useAuth();

  const flowSteps = [
    { num: '01', title: 'Farmer Lists Crop', desc: 'Farmer uploads crop details & harvest photo', icon: '🌾' },
    { num: '02', title: 'AI Quality Check', desc: 'AI scans freshness & certifies Grade A/B/C', icon: '🤖' },
    { num: '03', title: 'Retailer Order', desc: 'Retailer places order direct from farmer', icon: '🏪' },
    { num: '04', title: 'Driver Delivery', desc: 'Driver accepts trip & live GPS activates', icon: '🚚' },
    { num: '05', title: 'Product Verification', desc: 'Retailer scans & verifies physical produce', icon: '🔍' },
    { num: '06', title: 'Instant Escrow Payment', desc: 'Escrow automatically pays Farmer & Driver', icon: '💰' },
    { num: '07', title: 'Final Master QR', desc: 'Complete verified journey & price split QR', icon: '🏷️' }
  ];

  const benefits = [
    { title: 'Zero Middleman Cuts', desc: 'Farmers receive the full fair value of their harvest directly with 0% intermediary deductions.', icon: Coins, color: 'text-[#2B4C26]' },
    { title: 'AI Quality Verification', desc: 'Objective deep-learning neural inspection replaces subjective manual grading penalties.', icon: Sparkles, color: 'text-[#D9822B]' },
    { title: 'Instant Escrow Settlement', desc: 'Smart contract automatically distributes payments the exact millisecond delivery is verified.', icon: ShieldCheck, color: 'text-[#4EA858]' },
    { title: 'Master QR Traceability', desc: 'End-to-end cryptographic proof from seed to shelf for complete consumer transparency.', icon: QrCode, color: 'text-[#0284C7]' }
  ];

  return (
    <div className="space-y-16 py-8 sm:py-12">
      
      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        
        {/* Top Tagline */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#7DA972]/40 shadow-sm text-xs font-semibold text-[#1F361C]">
          <span className="w-2 h-2 rounded-full bg-[#4EA858] animate-ping" />
          <span className="text-[#386332] font-bold">FarmVest</span>
          <span className="text-[#825D3E]">•</span>
          <span className="text-[#D9822B] font-bold">Cultivating Fair Trade</span>
        </div>

        {/* Hero Title & Description */}
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-[#142412] tracking-tight leading-[1.15]">
            An AI + Blockchain Powered{' '}
            <span className="text-[#2B4C26] underline decoration-[#7DA972]/60 underline-offset-8">
              Agricultural Marketplace
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-[#462E1C]/85 leading-relaxed font-normal">
            FarmVest connects <strong>Farmers</strong>, <strong>Drivers</strong>, and <strong>Retailers</strong>. We combine AI crop quality grading, intelligent logistics routing, Request → Accept handovers, live GPS tracking, smart escrow payments, and verifiable consumer QR traceability.
          </p>
        </div>

        {/* CTA Button */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={() => setActiveView('auth')}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#2B4C26] to-[#386332] hover:brightness-110 text-white font-extrabold text-sm sm:text-base shadow-xl hover:scale-105 transition-all flex items-center gap-2.5 cursor-pointer border border-[#A5D6A7]/30"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Attractive Agricultural Illustration / Gallery */}
        <div className="mt-8 max-w-5xl mx-auto">
          <div className="ghibli-card-elevated p-4 sm:p-6 overflow-hidden bg-white/90 border border-[#7DA972]/30">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="relative rounded-2xl overflow-hidden h-48 sm:h-60 group">
                <img 
                  src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80" 
                  alt="Harvest cultivation" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 flex flex-col justify-end text-left text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A5D6A7]">01. Farm Origin</span>
                  <h4 className="font-display font-bold text-sm">Direct From Cultivators</h4>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden h-48 sm:h-60 group">
                <img 
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80" 
                  alt="Logistics transport" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 flex flex-col justify-end text-left text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#F6D28B]">02. Green Freight</span>
                  <h4 className="font-display font-bold text-sm">Live GPS Road Logistics</h4>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden h-48 sm:h-60 group">
                <img 
                  src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80" 
                  alt="Retailer Supermarket" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 flex flex-col justify-end text-left text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#93C5FD]">03. Supermarket Delivery</span>
                  <h4 className="font-display font-bold text-sm">Verified Escrow Handover</h4>
                </div>
              </div>

            </div>
          </div>
        </div>

      </section>

      {/* 2. HOW IT WORKS FLOW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2B4C26] bg-[#E6EFE3] px-3 py-1 rounded-full">
            The Complete Process
          </span>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#142412]">
            How FarmVest Works
          </h2>
          <p className="text-xs sm:text-sm text-[#62432B]/80">
            A continuous connected sequence from harvest upload to instant split payment.
          </p>
        </div>

        {/* 7-Step Sequence Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {flowSteps.map((s, idx) => (
            <div 
              key={idx}
              className="ghibli-card p-4 bg-white border border-[#7DA972]/30 flex flex-col justify-between space-y-2 text-center relative group hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#5F8A55]">{s.num}</span>
                <span className="text-xl">{s.icon}</span>
              </div>
              <div>
                <h4 className="font-display font-bold text-xs text-[#1F361C] leading-snug">{s.title}</h4>
                <p className="text-[10px] text-[#62432B]/75 mt-1 leading-tight">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* 3. BENEFITS EXPLANATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#142412]">
            Why FarmVest is Fairer & Smarter
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div key={idx} className="ghibli-card p-5 bg-white border border-[#7DA972]/30 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/20 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${b.color}`} />
                </div>
                <h4 className="font-display font-bold text-sm text-[#1F361C]">{b.title}</h4>
                <p className="text-xs text-[#62432B]/80 leading-relaxed">{b.desc}</p>
              </div>
            );
          })}
        </div>

      </section>


    </div>
  );
}
