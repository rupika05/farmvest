import React, { useState } from 'react';
import { useFarmVest } from '../../context/FarmVestContext';
import LiveGPSMap from '../maps/LiveGPSMap';
import SmartEscrowVisualizer from '../escrow/SmartEscrowVisualizer';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Handshake, 
  ShieldCheck, 
  QrCode, 
  Coins, 
  ArrowRight,
  Sparkles,
  Scan,
  CreditCard,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

export default function RetailerOrders() {
  const { 
    activeOrder, 
    acceptDeliveryHandover, 
    setSelectedQrBatch 
  } = useFarmVest();
  const { setActiveView } = useAuth();
  
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [isCheckInScanModalOpen, setIsCheckInScanModalOpen] = useState(false);

  if (!activeOrder) {
    return (
      <div className="ghibli-card p-12 text-center bg-white space-y-4 max-w-xl mx-auto border-2 border-dashed border-[#7DA972]/40">
        <div className="w-16 h-16 rounded-full bg-[#E0F2FE] text-3xl flex items-center justify-center mx-auto text-[#0284C7]">
          🛒
        </div>
        <h3 className="font-display font-bold text-xl text-[#1F361C]">No Active Orders Yet</h3>
        <p className="text-xs text-[#62432B]/80 leading-relaxed">
          Explore the agricultural marketplace and place an order to trigger automated AI logistics, live GPS transit, check-in scanning, and instant smart escrow payment!
        </p>
      </div>
    );
  }

  const handleScanCheckInAndPay = () => {
    acceptDeliveryHandover(activeOrder.id);
    setIsCheckInScanModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Active Order Card */}
      <div className="ghibli-card-elevated p-6 bg-white border-[#7DA972]/40 space-y-6">
        
        {/* Header with Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#7DA972]/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#E6EFE3] text-[#2B4C26] font-bold text-xs">
                Order #{activeOrder.id}
              </span>
              <span className="font-mono text-xs text-[#62432B]">Batch: {activeOrder.batchId}</span>
            </div>
            <h3 className="font-display font-extrabold text-2xl text-[#1F361C] mt-1">
              {activeOrder.quantity} kg {activeOrder.productName}
            </h3>
            <p className="text-xs text-[#5F8A55]">{activeOrder.timelineStatus}</p>
          </div>

          {/* CHECK-IN & ESCROW PAYMENT ACTION CONTROLLER */}
          <div className="flex items-center gap-3">
            {/* Delivery requested by driver */}
            {(activeOrder.status === 'Delivery Requested' || activeOrder.status === 'Driver Arrived at Destination') && (
              <div className="p-3.5 rounded-2xl bg-[#E0F2FE] border-2 border-[#0284C7] space-y-2 animate-in zoom-in-95">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0369A1]">
                  <Scan className="w-4 h-4 text-[#0284C7]" />
                  Driver Arrived — Check-in & Scan Produce!
                </div>
                <div className="text-[11px] text-[#0369A1]/80">
                  Inspect cargo ({activeOrder.quantity} kg {activeOrder.productName}) and release the instant escrow split.
                </div>
                <button
                  onClick={() => setIsCheckInScanModalOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Scan className="w-4 h-4" />
                  Scan Check-in & Release Escrow Payment
                </button>
              </div>
            )}

            {activeOrder.status === 'Delivered' && (
              <div className="p-3.5 rounded-2xl bg-[#E6EFE3] border border-[#4EA858] flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#4EA858] flex-shrink-0" />
                <div>
                  <div className="font-bold text-xs text-[#2B4C26]">Order Verified & Escrow Settled!</div>
                  <div className="text-[11px] text-[#5F8A55]">
                    ₹{activeOrder.farmerAmount} paid to Farmer • ₹{activeOrder.driverAmount} paid to Driver
                  </div>
                </div>
              </div>
            )}

            {activeOrder.status === 'In Transit' && (
              <div className="px-4 py-2 rounded-xl bg-[#FDF3E3] border border-[#F6D28B] text-xs font-bold text-[#D9822B] flex items-center gap-2">
                <Clock className="w-4 h-4 animate-spin" />
                Driver En-Route with Cargo (GPS Active)
              </div>
            )}
          </div>
        </div>

        {/* AI LOGISTICS ROADMAP VISUALIZER */}
        <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#7DA972]/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4EA858] animate-ping" />
              <h4 className="font-display font-bold text-sm text-[#1F361C]">AI Logistics Roadmap</h4>
            </div>
            <span className="text-[10px] font-bold text-[#5F8A55] bg-white px-2 py-0.5 rounded border border-[#7DA972]/20">
              Optimal Carbon Route
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-[#7DA972]/25 shadow-sm">
              <div className="text-[10px] font-bold uppercase text-[#825D3E] mb-1">🌾 Farm Origin</div>
              <div className="font-bold text-[#1F361C]">{activeOrder.farmerName}</div>
              <div className="text-[11px] text-[#62432B]/80 truncate">{activeOrder.farmerLocation}</div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#F6D28B] shadow-sm">
              <div className="text-[10px] font-bold uppercase text-[#D9822B] mb-1">🚚 Assigned Driver</div>
              <div className="font-bold text-[#1F361C]">{activeOrder.driver?.name}</div>
              <div className="text-[11px] text-[#5F8A55]">{activeOrder.driver?.vehicle} • GPS Active</div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#7DA972]/25 shadow-sm">
              <div className="text-[10px] font-bold uppercase text-[#0369A1] mb-1">🏪 Destination Store</div>
              <div className="font-bold text-[#1F361C]">{activeOrder.retailerName}</div>
              <div className="text-[11px] text-[#62432B]/80 truncate">{activeOrder.retailerLocation}</div>
            </div>
          </div>
        </div>

        {/* Live GPS Map for Retailer */}
        <div>
          <LiveGPSMap 
            originName={activeOrder.farmerLocation}
            destinationName={activeOrder.retailerLocation}
            driverName={activeOrder.driver?.name}
            isMoving={activeOrder.status === 'In Transit'}
          />
        </div>

        {/* Price Split-up & Final QR Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#7DA972]/20">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowEscrowModal(true)}
              className="px-4 py-2 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/40 text-xs font-bold text-[#2B4C26] hover:bg-[#E6EFE3] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Coins className="w-4 h-4 text-[#D9822B]" /> View AI Escrow Split-Up
            </button>

            <button
              onClick={() => {
                setSelectedQrBatch({
                  batchId: activeOrder.batchId,
                  name: activeOrder.productName,
                  farmerName: activeOrder.farmerName,
                  location: activeOrder.farmerLocation
                });
                setActiveView('traceability');
              }}
              className="px-4 py-2 rounded-xl bg-[#2B4C26] text-white text-xs font-bold hover:bg-[#386332] flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
            >
              <QrCode className="w-4 h-4 text-[#A5D6A7]" /> View Final Master QR Certificate
            </button>
          </div>

          <div className="text-right text-xs">
            <span className="text-[#62432B]">Total Escrow Payment:</span>{' '}
            <strong className="font-display text-base text-[#2B4C26]">₹{activeOrder.totalAmount?.toLocaleString()}</strong>
          </div>
        </div>

      </div>

      {/* CHECK-IN SCAN & ESCROW PAYMENT MODAL */}
      {isCheckInScanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="ghibli-card-elevated bg-[#FAF7F0] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-2 border-[#0284C7] p-6 space-y-5 animate-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#7DA972]/20">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-[#0284C7]" />
                <h3 className="font-display font-bold text-lg text-[#1F361C]">Cargo Scan & Check-in Verification</h3>
              </div>
              <button onClick={() => setIsCheckInScanModalOpen(false)} className="text-[#62432B] hover:text-black cursor-pointer font-bold text-sm">
                ✕
              </button>
            </div>

            {/* Scan animation */}
            <div className="p-4 rounded-2xl bg-white border border-[#0284C7]/30 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mx-auto text-2xl animate-pulse">
                📦
              </div>
              <div className="font-bold text-sm text-[#1F361C]">
                Batch {activeOrder.batchId} Verified ✓
              </div>
              <p className="text-xs text-[#5F8A55]">
                {activeOrder.quantity} kg {activeOrder.productName} • AI Quality Grade: {activeOrder.aiGrade?.grade || 'Grade A'}
              </p>
            </div>

            {/* Instant Multi-Sig Split Preview */}
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#7DA972]/30 space-y-2 text-xs">
              <span className="font-extrabold uppercase text-[#825D3E] block">Instant Smart Escrow Payout Split:</span>
              <div className="flex justify-between border-b border-[#7DA972]/20 pb-1.5">
                <span>🌾 Farmer Payout ({activeOrder.farmerName}):</span>
                <strong className="text-[#2B4C26] text-sm">₹{activeOrder.farmerAmount}</strong>
              </div>
              <div className="flex justify-between border-b border-[#7DA972]/20 pb-1.5">
                <span>🚚 Driver Payout ({activeOrder.driver?.name}):</span>
                <strong className="text-[#D9822B] text-sm">₹{activeOrder.driverAmount}</strong>
              </div>
              <div className="flex justify-between text-[#5F8A55]">
                <span>🛡️ Platform Fee:</span>
                <strong>₹0.00 (Zero Cut)</strong>
              </div>
            </div>

            <button
              onClick={handleScanCheckInAndPay}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#0284C7] to-[#0369A1] text-white font-extrabold text-sm shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              Confirm Check-in & Release Escrow Payment (₹{activeOrder.totalAmount})
            </button>
          </div>
        </div>
      )}

      {/* Smart Escrow Breakdown Visualizer */}
      {showEscrowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl">
            <SmartEscrowVisualizer 
              order={activeOrder}
              onClose={() => setShowEscrowModal(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}
