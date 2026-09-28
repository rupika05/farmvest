import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import FarmVestLogo from '../common/FarmVestLogo';
import { X, Sprout, Truck, Store, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { loginAsRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState('farmer');

  if (!isOpen) return null;

  const handleLogin = (roleKey) => {
    loginAsRole(roleKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="ghibli-card-elevated bg-[#FAF7F0] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-[#7DA972]/40 p-6 sm:p-8 space-y-6 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <FarmVestLogo size="sm" showTagline={true} />
          <button onClick={onClose} className="p-1 text-[#62432B]/60 hover:text-[#1F361C]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center space-y-1">
          <h3 className="font-display font-extrabold text-2xl text-[#1F361C]">
            Select Your Supply Chain Role
          </h3>
          <p className="text-xs text-[#62432B]/80">
            Sign in to your dedicated dashboard with role-specific permissions and live handover tools.
          </p>
        </div>

        {/* 3 Role Selection Cards */}
        <div className="space-y-3">
          
          {/* 1. Farmer */}
          <div
            onClick={() => handleLogin('farmer')}
            className="p-4 rounded-2xl bg-white border border-[#7DA972]/30 hover:border-[#4EA858] hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#E6EFE3] text-[#2B4C26] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🌾
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#1F361C] group-hover:text-[#2B4C26]">
                  Farmer Portal
                </h4>
                <p className="text-[11px] text-[#5F8A55]">farmer@farmvest.demo (Green Valley Farm)</p>
                <p className="text-[10px] text-[#62432B]/70">List crops, AI Bio-Vision scan, request pickup handover</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#7DA972] group-hover:text-[#2B4C26] group-hover:translate-x-1 transition-all" />
          </div>

          {/* 2. Driver */}
          <div
            onClick={() => handleLogin('driver')}
            className="p-4 rounded-2xl bg-white border border-[#F6D28B] hover:border-[#D9822B] hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#FDF3E3] text-[#D9822B] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🚚
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#1F361C] group-hover:text-[#D9822B]">
                  Driver Logistics Console
                </h4>
                <p className="text-[11px] text-[#D9822B]">driver@farmvest.demo (Arun Kumar - EV Mini Truck)</p>
                <p className="text-[10px] text-[#62432B]/70">Trip alerts, GPS navigation, dual handover verification</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#F6D28B] group-hover:text-[#D9822B] group-hover:translate-x-1 transition-all" />
          </div>

          {/* 3. Retailer */}
          <div
            onClick={() => handleLogin('retailer')}
            className="p-4 rounded-2xl bg-white border border-[#7DA972]/30 hover:border-[#0284C7] hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🏪
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#1F361C] group-hover:text-[#0369A1]">
                  Retailer Direct Marketplace
                </h4>
                <p className="text-[11px] text-[#0284C7]">retailer@farmvest.demo (FreshMart Superstores)</p>
                <p className="text-[10px] text-[#62432B]/70">Wholesale marketplace, escrow lock, accept store delivery</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#7DA972] group-hover:text-[#0284C7] group-hover:translate-x-1 transition-all" />
          </div>

        </div>

        <div className="pt-2 text-center">
          <span className="text-[11px] text-[#825D3E] flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#4EA858]" /> Instant 1-click Demo Credentials Enabled
          </span>
        </div>

      </div>
    </div>
  );
}
