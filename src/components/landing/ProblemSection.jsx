import React from 'react';
import { AlertTriangle, Clock, TrendingDown, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProblemSection() {
  const { loginAsRole, setActiveView } = useAuth();

  const statistics = [
    {
      stat: '4–6',
      label: 'Untracked Handoffs',
      sublabel: 'Produce passes through opaque brokers, middlemen, and unauthorized transit points.',
      color: 'from-amber-600 to-amber-700',
      tag: 'Untracked Intermediaries'
    },
    {
      stat: '15–30 Days',
      label: 'Potential Payment Delay',
      sublabel: 'Farmers wait weeks or months for physical cash settlements and invoice reconciliations.',
      color: 'from-red-600 to-rose-700',
      tag: 'Delayed Farmer Settlement'
    },
    {
      stat: '< 20%',
      label: 'Final Shelf Value to Farmers',
      sublabel: 'Middleman markups drain the majority of consumer spend away from the cultivating farmer.',
      color: 'from-emerald-700 to-green-800',
      tag: 'Unfair Value Capture'
    },
    {
      stat: '0% Trace',
      label: 'Subjective Grading & Opacity',
      sublabel: 'Manual quality checks cause arbitrary price rejections; consumers lack origin verification.',
      color: 'from-orange-600 to-amber-700',
      tag: 'Lack of Traceability'
    }
  ];

  return (
    <section className="py-20 bg-[#F5EFE4]/80 border-y border-[#7DA972]/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F0] border border-[#7DA972]/30 text-xs font-bold text-[#825D3E] uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-[#D9822B]" />
            The Agricultural Broken Link
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#142412]">
            Why Modern Agriculture Deserves <span className="text-[#2B4C26]">Fair Trade</span>
          </h2>
          <p className="text-sm sm:text-base text-[#62432B]/90 leading-relaxed">
            The traditional farm-to-retail supply chain is burdened by fragmented handoffs, subjective quality penalties, and extended cashflow choke points.
          </p>
        </div>

        {/* 4 Statistics / Problem Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statistics.map((item, idx) => (
            <div 
              key={idx} 
              className="ghibli-card p-6 bg-white/95 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D9822B] px-2.5 py-1 rounded-full bg-[#FDF3E3] inline-block mb-3">
                  {item.tag}
                </span>
                
                <div className="font-display font-extrabold text-3xl sm:text-4xl text-[#1F361C] mb-1">
                  {item.stat}
                </div>
                
                <div className="font-bold text-sm text-[#2B4C26] mb-2">
                  {item.label}
                </div>
                
                <p className="text-xs text-[#62432B]/80 leading-relaxed">
                  {item.sublabel}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#7DA972]/20 flex items-center justify-between text-[11px] text-[#5F8A55] font-semibold">
                <span>FarmVest Fix:</span>
                <span className="text-[#2B4C26] font-bold">100% Solved ✓</span>
              </div>
            </div>
          ))}
        </div>

        {/* FarmVest Solution Contrast Banner */}
        <div className="mt-14 ghibli-card-dark p-8 sm:p-10 relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#F6D28B] bg-[#F6D28B]/10 px-3 py-1 rounded-full border border-[#F6D28B]/30">
                The FarmVest Protocol
              </span>
              <h3 className="font-display font-bold text-2xl sm:text-3xl text-white">
                How We Cultivate Fair Trade Across Every Link
              </h3>
              <p className="text-xs sm:text-sm text-[#CBE0C4] leading-relaxed">
                By uniting AI quality scoring with smart multi-signature escrow and dual request→accept handovers, FarmVest eliminates speculative intermediaries and guarantees instant payout.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => { loginAsRole('farmer'); setActiveView('app'); }}
                  className="px-5 py-2.5 rounded-xl bg-[#4EA858] text-white font-bold text-xs hover:bg-[#5bb866] transition-all flex items-center gap-1.5 shadow-md"
                >
                  🌾 List Harvest as Farmer <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { loginAsRole('retailer'); setActiveView('app'); }}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5"
                >
                  🏪 Order Direct from Source
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
                <div className="font-bold text-[#A5D6A7] mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> AI Bio-Vision Grading
                </div>
                <div className="text-[#E6EFE3]/80">
                  Objective 92/100 score replaces subjective middlemen price discounting.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
                <div className="font-bold text-[#A5D6A7] mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Dual Handover Protocol
                </div>
                <div className="text-[#E6EFE3]/80">
                  Physical custody is locked through mutual Request → Accept handovers.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
                <div className="font-bold text-[#A5D6A7] mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Smart Escrow Release
                </div>
                <div className="text-[#E6EFE3]/80">
                  ₹4,000 paid to Farmer and ₹500 to Driver the exact millisecond goods are received.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
                <div className="font-bold text-[#A5D6A7] mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Master QR Traceability
                </div>
                <div className="text-[#E6EFE3]/80">
                  Consumers scan the batch code to view live GPS path, farm soil, and price breakdown.
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
