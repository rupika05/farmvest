import React from 'react';
import FarmVestLogo from './FarmVestLogo';
import { useAuth } from '../../context/AuthContext';
import { Shield, Sparkles, Heart, Sprout, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const { currentUser, openAuthForRole, setActiveView } = useAuth();

  const handleRoleNavigation = (role) => {
    if (currentUser?.role === role) {
      setActiveView('dashboard');
    } else {
      openAuthForRole(role);
    }
  };

  return (
    <footer className="relative bg-[#182C15] text-[#FAF7F0] border-t border-[#34592A] pt-16 pb-12 overflow-hidden mt-20">
      {/* Subtle Ghibli Hill Silhouette Background */}
      <div className="absolute top-0 left-0 right-0 h-12 -translate-y-full overflow-hidden pointer-events-none opacity-20">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full text-[#182C15] fill-current">
          <path d="M0,0 C150,90 350,-40 500,60 C650,140 900,10 1200,40 L1200,120 L0,120 Z"></path>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#305527]">
          
          {/* Col 1: Brand & Tagline */}
          <div className="md:col-span-1 space-y-4">
            <FarmVestLogo size="md" variant="light" showTagline={true} />
            <p className="text-xs text-[#A2C498] leading-relaxed mt-2">
              From the farm to your table, every harvest deserves a transparent journey. AI quality grading, smart escrow settlements, and verified blockchain records.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#E6EFE3]/70">
              <Shield className="w-4 h-4 text-[#4EA858]" />
              <span>Decentralized Agricultural Trust</span>
            </div>
          </div>

          {/* Col 2: Platform Roles */}
          <div>
            <h4 className="font-display font-bold text-sm text-[#FAF7F0] tracking-wide mb-3 flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-[#7DA972]" />
              Supply Chain Portals
            </h4>
            <ul className="space-y-2 text-xs text-[#CBE0C4]">
              <li>
                <button 
                  onClick={() => handleRoleNavigation('farmer')} 
                  className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  🌾 Farmer Dashboard & AI Scan <ArrowUpRight className="w-3 h-3 text-[#7DA972]" />
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleRoleNavigation('driver')} 
                  className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  🚚 Driver Logistics Console <ArrowUpRight className="w-3 h-3 text-[#7DA972]" />
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleRoleNavigation('retailer')} 
                  className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  🏪 Retailer Organic Marketplace <ArrowUpRight className="w-3 h-3 text-[#7DA972]" />
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveView('traceability')} 
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  🔍 Consumer Master QR Verification <ArrowUpRight className="w-3 h-3 text-[#7DA972]" />
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Technology Core */}
          <div>
            <h4 className="font-display font-bold text-sm text-[#FAF7F0] tracking-wide mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#F6D28B]" />
              Innovation Pillars
            </h4>
            <ul className="space-y-2 text-xs text-[#CBE0C4]">
              <li>AI Bio-Vision Quality Grading (Grade A-C)</li>
              <li>Dual Request → Accept Handover Protocol</li>
              <li>Real-time GPS Telemetry & Waypoints</li>
              <li>Smart Escrow Multi-Sig Instant Payout</li>
              <li>Polygon PoS Immutable Audit Ledger</li>
            </ul>
          </div>

          {/* Col 4: Fair Trade Mission & Key Statistics */}
          <div className="bg-[#203B1C]/80 border border-[#3E6634] p-4 rounded-2xl">
            <h5 className="font-display font-bold text-xs text-[#F6D28B] uppercase tracking-wider mb-2">
              Our Fair Trade Pledge
            </h5>
            <div className="space-y-2 text-xs text-[#E6EFE3]">
              <div className="flex justify-between border-b border-[#305527] pb-1">
                <span className="text-[#A2C498]">Intermediary Cut:</span>
                <span className="font-bold text-white">0% Platform Fee</span>
              </div>
              <div className="flex justify-between border-b border-[#305527] pb-1">
                <span className="text-[#A2C498]">Farmer Payout:</span>
                <span className="font-bold text-[#A5D6A7]">Instant on Delivery</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A2C498]">Traceability:</span>
                <span className="font-bold text-[#F6D28B]">100% Verified</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom credits */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8DAA81] gap-4">
          <div>
            © {new Date().getFullYear()} FarmVest Inc. — <strong>Cultivating Fair Trade</strong>. All rights reserved.
          </div>
          <div className="flex items-center gap-1 text-[#CBE0C4]">
            Crafted for sustainable agriculture with <Heart className="w-3.5 h-3.5 text-[#E05252] fill-current" /> and Ghibli warmth.
          </div>
        </div>
      </div>
    </footer>
  );
}
