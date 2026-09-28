import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFarmVest } from '../../context/FarmVestContext';
import FarmVestLogo from '../common/FarmVestLogo';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  QrCode, 
  Sprout, 
  Truck, 
  Store, 
  CheckCircle2, 
  Search,
  ChevronRight,
  UserCheck
} from 'lucide-react';

export default function HeroSection() {
  const { openAuthForRole, setActiveView } = useAuth();
  const { setSelectedQrBatch } = useFarmVest();
  const [quickTraceBatch, setQuickTraceBatch] = useState('FV-TOM-101');

  const handleTraceLookup = (e) => {
    e.preventDefault();
    if (quickTraceBatch.trim()) {
      setSelectedQrBatch({
        batchId: quickTraceBatch.trim().toUpperCase(),
        name: 'Heritage Red Tomato',
        farmerName: 'Green Valley Farm',
        location: 'Saranathan Farm, Valley Sector 4, Trichy'
      });
      setActiveView('traceability');
    }
  };

  return (
    <section className="relative pt-6 sm:pt-10 pb-20 overflow-hidden">
      
      {/* Background radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#7DA972]/20 to-[#F6D28B]/15 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Tagline Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#7DA972]/40 shadow-sm text-xs font-semibold text-[#1F361C]">
            <span className="flex h-2 w-2 rounded-full bg-[#4EA858] animate-ping" />
            <span className="text-[#386332]">AI + Blockchain Agricultural Supply Chain</span>
            <span className="text-[#62432B]/40">•</span>
            <span className="text-[#D9822B] font-bold">Cultivating Fair Trade</span>
          </div>
        </div>

        {/* Main Hero Header */}
        <div className="text-center max-w-4xl mx-auto space-y-4 sm:space-y-5">
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-[#142412] tracking-tight leading-[1.15]">
            From the farm to your table, every harvest deserves a{' '}
            <span className="relative inline-block text-[#2B4C26]">
              transparent journey
              <svg className="absolute -bottom-1 left-0 w-full text-[#7DA972]/60" viewBox="0 0 250 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9C60 3 190 3 247 9" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-[#462E1C]/85 max-w-2xl mx-auto font-normal leading-relaxed">
            AI-powered quality verification, intelligent logistics, blockchain-backed traceability, and transparent settlements for a fairer agricultural supply chain.
          </p>

          {/* 3 Prominent Role Login Cards */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-3xl mx-auto text-left">
            
            {/* 1. Farmer Login */}
            <div
              onClick={() => openAuthForRole('farmer')}
              className="p-4 rounded-2xl bg-white border border-[#7DA972]/30 hover:border-[#2B4C26] shadow-md hover:shadow-xl hover:scale-[1.03] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-10 h-10 rounded-xl bg-[#E6EFE3] text-[#2B4C26] flex items-center justify-center text-xl shadow-sm">
                  🌾
                </span>
                <span className="text-[10px] uppercase font-bold text-[#2B4C26] px-2 py-0.5 rounded bg-[#E6EFE3]">
                  Farmer
                </span>
              </div>
              <h4 className="font-display font-bold text-sm text-[#1F361C] group-hover:text-[#2B4C26]">
                Farmer Portal
              </h4>
              <p className="text-[11px] text-[#62432B]/80 mt-0.5">
                List crops, AI quality grade & pickup handover
              </p>
              <div className="mt-3 text-xs font-bold text-[#2B4C26] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Sign In as Farmer <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* 2. Driver Login */}
            <div
              onClick={() => openAuthForRole('driver')}
              className="p-4 rounded-2xl bg-white border border-[#F6D28B] hover:border-[#D9822B] shadow-md hover:shadow-xl hover:scale-[1.03] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-10 h-10 rounded-xl bg-[#FDF3E3] text-[#D9822B] flex items-center justify-center text-xl shadow-sm">
                  🚚
                </span>
                <span className="text-[10px] uppercase font-bold text-[#D9822B] px-2 py-0.5 rounded bg-[#FDF3E3]">
                  Driver
                </span>
              </div>
              <h4 className="font-display font-bold text-sm text-[#1F361C] group-hover:text-[#D9822B]">
                Driver Console
              </h4>
              <p className="text-[11px] text-[#62432B]/80 mt-0.5">
                Receive trips, live GPS transit & earn ₹500/trip
              </p>
              <div className="mt-3 text-xs font-bold text-[#D9822B] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Sign In as Driver <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* 3. Retailer Login */}
            <div
              onClick={() => openAuthForRole('retailer')}
              className="p-4 rounded-2xl bg-white border border-[#7DA972]/30 hover:border-[#0284C7] shadow-md hover:shadow-xl hover:scale-[1.03] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center text-xl shadow-sm">
                  🏪
                </span>
                <span className="text-[10px] uppercase font-bold text-[#0369A1] px-2 py-0.5 rounded bg-[#E0F2FE]">
                  Retailer
                </span>
              </div>
              <h4 className="font-display font-bold text-sm text-[#1F361C] group-hover:text-[#0369A1]">
                Retailer Marketplace
              </h4>
              <p className="text-[11px] text-[#62432B]/80 mt-0.5">
                Wholesale catalog, escrow orders & delivery verification
              </p>
              <div className="mt-3 text-xs font-bold text-[#0369A1] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Sign In as Retailer <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>

          {/* Quick Search Batch Code input */}
          <form onSubmit={handleTraceLookup} className="pt-3 max-w-md mx-auto">
            <div className="relative flex items-center">
              <input
                type="text"
                value={quickTraceBatch}
                onChange={(e) => setQuickTraceBatch(e.target.value)}
                placeholder="Enter Master Batch QR ID..."
                className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-white/90 border border-[#7DA972]/30 text-xs text-[#1F361C] placeholder:text-[#825D3E]/60 focus:outline-none focus:border-[#4EA858] focus:ring-2 focus:ring-[#7DA972]/20 shadow-sm"
              />
              <Search className="w-4 h-4 text-[#5F8A55] absolute left-3" />
              <button
                type="submit"
                className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-[#2B4C26] text-white font-semibold text-xs hover:bg-[#386332] transition-colors"
              >
                Verify QR
              </button>
            </div>
          </form>

        </div>

      </div>
    </section>
  );
}
