import React, { useState } from 'react';
import { useFarmVest } from '../../context/FarmVestContext';
import { 
  X, 
  Sparkles, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Plus, 
  Minus, 
  Truck, 
  CheckCircle2, 
  Coins, 
  Cpu, 
  Award, 
  Navigation 
} from 'lucide-react';

export default function ProductDetailModal({ product, onClose }) {
  const { placeOrder } = useFarmVest();
  const [quantity, setQuantity] = useState(100); // 100 kg default

  if (!product) return null;

  // AI Dynamic Price Fixer using Blockchain & Grading criteria
  // Base unit price adjusted for Grade A / B / C quality
  const gradeMultiplier = product.aiGrade?.score >= 95 ? 1.05 : 1.0;
  const unitPrice = Math.round(product.pricePerKg * gradeMultiplier) || 40;
  
  const productTotal = quantity * unitPrice;
  
  // AI Logistics fee based on distance (12.4 km) and weight
  const distanceKm = 12.4;
  const transportFee = 500;
  const platformFee = 0; // FarmVest Fair Trade guarantee
  const grandTotal = productTotal + transportFee + platformFee;

  const handleConfirmOrder = () => {
    placeOrder({
      product,
      quantityKg: quantity,
      retailerName: 'FreshMart Superstores',
      deliveryAddress: 'FreshMart Hyperstore, Main Junction, Trichy'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="ghibli-card-elevated bg-[#FAF7F0] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-[#7DA972]/40 my-8 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#1F361C] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#4EA858] text-white text-[11px] font-bold">
              {product.aiGrade?.grade || 'Grade A'} Verified
            </span>
            <span className="font-mono text-xs text-[#CBE0C4]">Batch: {product.batchId}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white text-white/60 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Left: Product Image & AI Quality Certificate */}
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden aspect-square border border-[#7DA972]/30 shadow-md">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-[#1F361C]/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
                  <Sparkles className="w-4 h-4 text-[#F6D28B]" />
                  <span>AI Score: {product.aiGrade?.score || 92}/100</span>
                </div>
              </div>

              {/* AI Quality Certificate Box */}
              <div className="p-3.5 rounded-xl bg-white border border-[#4EA858]/40 text-xs text-[#1F361C] space-y-1.5 shadow-sm">
                <div className="font-bold text-[#2B4C26] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#4EA858]" />
                  <span>AI Bio-Vision Quality Certificate:</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[11px] text-center pt-1">
                  <div className="p-1 rounded bg-[#E6EFE3] font-semibold text-[#2B4C26]">
                    Freshness: {product.aiGrade?.freshness || 94}%
                  </div>
                  <div className="p-1 rounded bg-[#E6EFE3] font-semibold text-[#2B4C26]">
                    Visual: {product.aiGrade?.visualQuality || 92}%
                  </div>
                  <div className="p-1 rounded bg-[#FDF3E3] font-semibold text-[#D9822B]">
                    Defects: {product.aiGrade?.defects || 6}%
                  </div>
                </div>
                <div className="text-[10px] text-[#5F8A55] pt-1">
                  ✓ Certified for supermarket retail distribution & safe cold-chain transit.
                </div>
              </div>
            </div>

            {/* Right: Cultivation details, Farmer & Pricing */}
            <div className="space-y-4">
              <div>
                <h3 className="font-display font-extrabold text-2xl text-[#1F361C]">{product.name}</h3>
                <div className="text-xs text-[#5F8A55] flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" /> Farm Origin: <strong>{product.farmerName || 'Green Valley Farm'}</strong> ({product.location})
                </div>
                <div className="text-xs text-[#D9822B] flex items-center gap-1 mt-1 font-semibold">
                  <Calendar className="w-3.5 h-3.5" /> Cultivated & Harvested: {product.harvestDate}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#7DA972]/30 flex items-center justify-between">
                <span className="text-xs text-[#62432B]">AI Fixed Unit Price:</span>
                <span className="font-display font-extrabold text-xl text-[#2B4C26]">
                  ₹{unitPrice} <span className="text-xs font-normal text-[#62432B]">/ {product.unit || 'kg'}</span>
                </span>
              </div>

              <p className="text-xs text-[#62432B]/85 leading-relaxed">
                {product.description || 'Pesticide-free organic crop cultivated with precision irrigation and natural bio-compost.'}
              </p>

              {/* Quantity Selector */}
              <div className="pt-2 border-t border-[#7DA972]/20 space-y-2">
                <label className="font-bold text-xs text-[#1F361C] block">
                  Select Order Quantity (Available: {product.availableQuantity} {product.unit || 'kg'})
                </label>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(50, quantity - 50))}
                    className="w-10 h-10 rounded-xl bg-white border border-[#7DA972]/40 hover:bg-[#E6EFE3] flex items-center justify-center font-bold text-[#1F361C] cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="px-5 py-2 rounded-xl bg-white border border-[#7DA972]/40 font-display font-extrabold text-lg text-[#1F361C] min-w-[120px] text-center">
                    {quantity} kg
                  </div>

                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.availableQuantity || 500, quantity + 50))}
                    className="w-10 h-10 rounded-xl bg-white border border-[#7DA972]/40 hover:bg-[#E6EFE3] flex items-center justify-center font-bold text-[#1F361C] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* AI BLOCKCHAIN PRICING FIXER BREAKDOWN */}
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#7DA972]/40 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#1F361C] border-b border-[#7DA972]/20 pb-2">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#2B4C26]" />
                AI Fixed Price Split-Up (Smart Escrow Protocol)
              </span>
              <span className="text-[#5F8A55] font-semibold">Polygon Multi-Sig</span>
            </div>

            <div className="space-y-1.5 text-xs text-[#462E1C]">
              <div className="flex justify-between">
                <span>🌾 Farmer Share (Fixed on AI Grade & {quantity} kg):</span>
                <strong className="text-[#2B4C26] font-extrabold text-sm">₹{productTotal.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between">
                <span>🚚 Driver Logistics Share ({distanceKm} km transit):</span>
                <strong className="text-[#D9822B] font-extrabold text-sm">₹{transportFee.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between text-[#5F8A55]">
                <span>🛡️ FarmVest Protocol Cut:</span>
                <strong className="font-bold">₹0.00 (0% Fair Trade Guarantee)</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-[#7DA972]/30 flex justify-between items-center text-sm">
              <span className="font-bold text-[#1F361C]">Total Escrow Payment to Lock:</span>
              <span className="font-display font-extrabold text-2xl text-[#2B4C26]">
                ₹{grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#62432B] hover:bg-white cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmOrder}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#2B4C26] to-[#386332] text-white font-extrabold text-sm hover:scale-105 transition-all shadow-xl flex items-center gap-2 cursor-pointer"
            >
              <Coins className="w-4 h-4 text-[#F6D28B]" />
              Lock Escrow & Place Order (₹{grandTotal.toLocaleString()})
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
