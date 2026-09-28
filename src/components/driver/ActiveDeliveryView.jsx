import React from 'react';
import { useFarmVest } from '../../context/FarmVestContext';
import LiveGPSMap from '../maps/LiveGPSMap';
import { 
  Truck, 
  MapPin, 
  Handshake, 
  CheckCircle2, 
  Navigation, 
  Radio, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export default function ActiveDeliveryView() {
  const { 
    activeOrder, 
    acceptPickupHandover, 
    requestDeliveryHandover,
    gpsData 
  } = useFarmVest();

  if (!activeOrder) return null;

  return (
    <div className="space-y-6">
      
      {/* Active Navigation Top Card */}
      <div className="ghibli-card-elevated p-5 sm:p-6 bg-white border-[#D9822B]/40 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#7DA972]/20">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#52C41A] animate-ping" />
            <h3 className="font-display font-extrabold text-xl text-[#1F361C]">
              Active Trip: {activeOrder.productName} ({activeOrder.quantity} kg)
            </h3>
          </div>
          <div className="text-xs font-mono font-bold text-[#D9822B] bg-[#FDF3E3] px-3 py-1 rounded-full self-start">
            Status: {activeOrder.status}
          </div>
        </div>

        {/* 3-Step Driver Stage Progress */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          
          <div className={`p-2.5 rounded-xl border font-bold transition-all ${
            activeOrder.status === 'Waiting for Pickup' || activeOrder.status === 'Pickup Requested'
              ? 'bg-[#E6EFE3] border-[#2B4C26] text-[#1F361C]'
              : 'bg-[#FAF7F0] border-[#7DA972]/20 text-[#62432B]/60'
          }`}>
            <span className="text-[10px] block font-mono">STEP 1</span>
            1. Pickup Farm
          </div>

          <div className={`p-2.5 rounded-xl border font-bold transition-all ${
            activeOrder.status === 'In Transit'
              ? 'bg-[#E6EFE3] border-[#2B4C26] text-[#1F361C]'
              : 'bg-[#FAF7F0] border-[#7DA972]/20 text-[#62432B]/60'
          }`}>
            <span className="text-[10px] block font-mono">STEP 2</span>
            2. Transit & GPS
          </div>

          <div className={`p-2.5 rounded-xl border font-bold transition-all ${
            activeOrder.status === 'Driver Arrived at Destination' || activeOrder.status === 'Delivery Requested' || activeOrder.status === 'Delivered'
              ? 'bg-[#E6EFE3] border-[#2B4C26] text-[#1F361C]'
              : 'bg-[#FAF7F0] border-[#7DA972]/20 text-[#62432B]/60'
          }`}>
            <span className="text-[10px] block font-mono">STEP 3</span>
            3. Store Delivery
          </div>

        </div>

        {/* HANDOVER CONTROLLER #1: Pickup Handover Accept */}
        {activeOrder.status === 'Pickup Requested' && (
          <div className="p-4 rounded-2xl bg-[#E6EFE3] border-2 border-[#4EA858] space-y-3 animate-in zoom-in-95">
            <div className="flex items-center gap-2">
              <Handshake className="w-5 h-5 text-[#2B4C26]" />
              <h4 className="font-display font-bold text-sm text-[#1F361C]">
                Product Handover Request from Farmer
              </h4>
            </div>

            <p className="text-xs text-[#2B4C26] leading-relaxed">
              Farmer has initiated physical custody transfer for <strong>{activeOrder.quantity} kg {activeOrder.productName}</strong> (Batch: {activeOrder.batchId}, AI Grade: {activeOrder.aiGrade?.grade || 'Grade A'}). Inspect the produce before accepting.
            </p>

            <button
              onClick={() => acceptPickupHandover(activeOrder.id)}
              className="w-full py-3 rounded-xl bg-[#2B4C26] hover:bg-[#386332] text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-[#A5D6A7]" />
              Accept Handover & Start Shipment
            </button>
          </div>
        )}

        {/* HANDOVER CONTROLLER #2: Delivery Handover Request */}
        {(activeOrder.status === 'Driver Arrived at Destination' || (activeOrder.status === 'In Transit' && gpsData.progress >= 90)) && (
          <div className="p-4 rounded-2xl bg-[#FDF3E3] border-2 border-[#D9822B] space-y-3 animate-in zoom-in-95">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#D9822B]" />
              <h4 className="font-display font-bold text-sm text-[#1F361C]">
                Arrived at Retailer (FreshMart Superstore)
              </h4>
            </div>

            <p className="text-xs text-[#825D3E] leading-relaxed">
              You have arrived at the destination. Request the store manager (Priya Sharma) to inspect cargo and complete the delivery handover to release your ₹500 payout.
            </p>

            <button
              onClick={() => requestDeliveryHandover(activeOrder.id)}
              className="w-full py-3 rounded-xl bg-[#D9822B] hover:bg-[#c27020] text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <Handshake className="w-4 h-4 text-white" />
              Request Delivery Handover
            </button>
          </div>
        )}

        {activeOrder.status === 'Delivery Requested' && (
          <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/40 text-xs text-[#1F361C] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#D9822B] animate-spin" />
            <span>Delivery handover requested. Awaiting retailer inspection and escrow confirmation...</span>
          </div>
        )}

        {activeOrder.status === 'Delivered' && (
          <div className="p-4 rounded-2xl bg-[#E6EFE3] border border-[#4EA858] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#2B4C26] font-bold">
              <CheckCircle2 className="w-5 h-5 text-[#4EA858]" />
              Delivery Verified & ₹500 Released to Wallet!
            </div>
            <span className="text-[#5F8A55] font-semibold">UPI: arun.logistics@okicici</span>
          </div>
        )}

        {/* Live GPS Map Display */}
        <div className="pt-2">
          <LiveGPSMap 
            originName={activeOrder.farmerLocation}
            destinationName={activeOrder.retailerLocation}
            driverName={activeOrder.driver?.name}
            isMoving={activeOrder.status === 'In Transit'}
          />
        </div>

      </div>

    </div>
  );
}
