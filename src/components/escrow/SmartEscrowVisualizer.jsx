import React from 'react';
import { ShieldCheck, ArrowDown, CheckCircle2, Lock, Coins, X, IndianRupee, Sparkles } from 'lucide-react';
import { calculateEscrowBreakdown } from '../../services/payments/escrowService';

export default function SmartEscrowVisualizer({ order, onClose }) {
  if (!order) return null;

  const breakdown = calculateEscrowBreakdown(order.quantity || 100, order.pricePerKg || 40, order.transportFee || 500);

  const isDelivered = order.status === 'Delivered';

  return (
    <div className="ghibli-card-elevated bg-[#FAF7F0] p-6 rounded-3xl border border-[#7DA972]/40 shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#7DA972]/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#E6EFE3] text-[#2B4C26] flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-[#1F361C]">
              Smart Escrow Vault Settlement
            </h3>
            <p className="text-[11px] text-[#5F8A55]">Polygon PoS Smart Contract Multi-Sig</p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-1 text-[#62432B]/60 hover:text-[#1F361C]">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Visual Fund Flow Graph */}
      <div className="space-y-4">
        
        {/* Step 1: Retailer Deposit */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#7DA972]/30 text-center shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#62432B]">
            01. Retailer Total Escrow Deposit
          </span>
          <div className="font-display font-extrabold text-2xl text-[#1F361C]">
            ₹{breakdown.grandTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#5F8A55] font-semibold">
            FreshMart Superstore (Priya Sharma)
          </div>
        </div>

        {/* Arrow Down */}
        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full bg-[#E6EFE3] text-[#2B4C26] flex items-center justify-center shadow-inner">
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </div>
        </div>

        {/* Step 2: Escrow Vault State */}
        <div className={`p-4 rounded-2xl border text-center transition-all ${
          isDelivered 
            ? 'bg-[#E6EFE3] border-[#4EA858] text-[#2B4C26]' 
            : 'bg-[#FDF3E3] border-[#F6D28B] text-[#825D3E]'
        }`}>
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase mb-1">
            {isDelivered ? <CheckCircle2 className="w-4 h-4 text-[#4EA858]" /> : <Lock className="w-4 h-4 text-[#D9822B]" />}
            {isDelivered ? 'ESCROW RELEASED & DISTRIBUTED' : 'ESCROW LOCKED IN SMART CONTRACT'}
          </div>
          <div className="text-xs font-semibold">
            Contract: <span className="font-mono text-[10px]">0x8f3c...cD29</span>
          </div>
        </div>

        {/* Arrow Down Split */}
        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full bg-[#E6EFE3] text-[#2B4C26] flex items-center justify-center shadow-inner">
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </div>
        </div>

        {/* Step 3: Dual Multi-Sig Distribution */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Farmer Share */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#4EA858] text-center shadow-md">
            <div className="text-[10px] font-bold text-[#2B4C26] uppercase">🌾 Farmer Share (88.9%)</div>
            <div className="font-display font-extrabold text-xl text-[#2B4C26] my-1">
              ₹{breakdown.productTotal.toLocaleString()}
            </div>
            <div className="text-[10px] text-[#5F8A55] truncate">
              {order.farmerName || 'Green Valley Farm'}
            </div>
            <div className="text-[9px] font-bold text-[#4EA858] mt-1 bg-[#E6EFE3] py-0.5 rounded">
              {isDelivered ? '✓ Payout Complete' : 'Locked till Handover'}
            </div>
          </div>

          {/* Driver Share */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#D9822B] text-center shadow-md">
            <div className="text-[10px] font-bold text-[#D9822B] uppercase">🚚 Driver Share (11.1%)</div>
            <div className="font-display font-extrabold text-xl text-[#D9822B] my-1">
              ₹{breakdown.driverShare.toLocaleString()}
            </div>
            <div className="text-[10px] text-[#825D3E] truncate">
              {order.driver?.name || 'Arun Kumar'}
            </div>
            <div className="text-[9px] font-bold text-[#D9822B] mt-1 bg-[#FDF3E3] py-0.5 rounded">
              {isDelivered ? '✓ Payout Complete' : 'Locked till Handover'}
            </div>
          </div>

        </div>

      </div>

      {/* Platform Zero Fee Banner */}
      <div className="p-3 rounded-xl bg-[#E6EFE3] border border-[#7DA972]/30 flex items-center justify-between text-xs text-[#2B4C26]">
        <div className="flex items-center gap-1.5 font-bold">
          <Sparkles className="w-4 h-4 text-[#D9822B]" />
          <span>FarmVest Protocol Fee:</span>
        </div>
        <span className="font-extrabold text-sm">₹0.00 (0% Fair Trade Guarantee)</span>
      </div>

    </div>
  );
}
