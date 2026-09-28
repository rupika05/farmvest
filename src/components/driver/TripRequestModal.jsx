import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Sparkles, IndianRupee, Clock, ArrowRight, X, Check, Package, Navigation, ShieldCheck } from 'lucide-react';

export default function TripRequestModal({ order, onAccept, onDecline }) {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (countdown <= 0) {
      if (onDecline) onDecline();
      return;
    }
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="ghibli-card-elevated bg-[#FAF7F0] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-2 border-[#D9822B] animate-in zoom-in-95">
        
        {/* Animated Banner with explicit "You've received an order" */}
        <div className="p-5 bg-gradient-to-r from-[#D9822B] to-[#ECA946] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center animate-bounce shadow-md">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#FDF3E3] block">
                🚚 DRIVER DISPATCH NOTIFICATION
              </span>
              <h3 className="font-display font-extrabold text-xl text-white">
                You've received an order!
              </h3>
            </div>
          </div>

          <div className="w-9 h-9 rounded-full bg-white text-[#D9822B] font-display font-extrabold text-xs flex items-center justify-center shadow-md">
            {countdown}s
          </div>
        </div>

        {/* Order Details Body */}
        <div className="p-6 space-y-4">
          
          {/* Earnings Highlight: "How much he would get" */}
          <div className="p-4 rounded-2xl bg-white border border-[#F6D28B] flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-[#825D3E] block">
                Your Guaranteed Earnings (Instant Escrow):
              </span>
              <div className="font-display font-extrabold text-3xl text-[#2B4C26] my-0.5">
                ₹{order.driverAmount || 500}
              </div>
              <span className="text-[11px] text-[#5F8A55] font-semibold">
                100% Direct Payout • 0% Platform Deductions
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#E6EFE3] text-[#2B4C26] flex items-center justify-center text-xl font-bold">
              💰
            </div>
          </div>

          {/* Cargo Details: "How much" */}
          <div className="p-3.5 rounded-2xl bg-[#F6F3EB] border border-[#7DA972]/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Package className="w-5 h-5 text-[#2B4C26]" />
              <div>
                <span className="text-[#62432B] block text-[10px]">Cargo to Transport:</span>
                <strong className="text-[#1F361C] text-sm">{order.quantity} kg {order.productName}</strong>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#E6EFE3] text-[#2B4C26] font-bold text-[11px]">
              AI Quality: {order.aiGrade?.grade || 'Grade A'}
            </span>
          </div>

          {/* Route details: "Where to deliver" */}
          <div className="p-4 rounded-2xl bg-white border border-[#7DA972]/30 space-y-3 text-xs">
            {/* Pickup */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#2B4C26] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                🌾
              </div>
              <div>
                <span className="text-[10px] text-[#62432B] font-extrabold uppercase">Pickup Location (Farmer):</span>
                <div className="font-bold text-sm text-[#1F361C]">{order.farmerName}</div>
                <div className="text-[#5F8A55] text-xs">{order.farmerLocation}</div>
              </div>
            </div>

            <div className="ml-3 border-l-2 border-dashed border-[#7DA972] h-4" />

            {/* Delivery */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#0284C7] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                🏪
              </div>
              <div>
                <span className="text-[10px] text-[#62432B] font-extrabold uppercase">Where to Deliver (Retailer):</span>
                <div className="font-bold text-sm text-[#1F361C]">{order.retailerName}</div>
                <div className="text-[#5F8A55] text-xs">{order.retailerLocation}</div>
              </div>
            </div>
          </div>

          {/* Distance & Route Metrics */}
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-white border border-[#7DA972]/20">
              <span className="text-[10px] text-[#62432B] block">Estimated Distance</span>
              <strong className="text-[#1F361C] font-bold text-sm">12.4 km (Green Route 45)</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#7DA972]/20">
              <span className="text-[10px] text-[#62432B] block">Estimated Transit Time</span>
              <strong className="text-[#1F361C] font-bold text-sm">~24 Minutes</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onDecline}
              className="py-3 rounded-2xl bg-white border border-[#7DA972]/40 text-xs font-bold text-[#62432B] hover:bg-[#FAF7F0] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" /> Decline
            </button>

            <button
              type="button"
              onClick={onAccept}
              className="py-3 rounded-2xl bg-gradient-to-r from-[#4EA858] to-[#2B4C26] text-white font-extrabold text-sm hover:scale-[1.02] shadow-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Check className="w-4 h-4" /> Accept Trip (Earn ₹{order.driverAmount || 500})
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
