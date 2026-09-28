import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFarmVest } from '../../context/FarmVestContext';
import TripRequestModal from './TripRequestModal';
import LiveGPSMap from '../maps/LiveGPSMap';
import { 
  Truck, 
  MapPin, 
  IndianRupee, 
  Star, 
  Radio, 
  CheckCircle, 
  Clock, 
  Navigation, 
  ShieldCheck, 
  Layers,
  ChevronRight,
  TrendingUp,
  Bell,
  Home,
  CheckCircle2,
  Handshake,
  ArrowRight,
  Package
} from 'lucide-react';

export default function DriverDashboard() {
  const { currentUser } = useAuth();
  const { 
    activeOrder, 
    acceptTrip,
    acceptPickupHandover,
    requestDeliveryHandover,
    gpsData 
  } = useFarmVest();

  const [activeSidebarNav, setActiveSidebarNav] = useState('home'); // 'home', 'requests', 'active_trip', 'completed', 'earnings', 'notifications'
  const [isOnline, setIsOnline] = useState(true);

  // Incoming order notification
  const isIncomingTrip = activeOrder && activeOrder.status === 'Ordered';
  const hasActiveTrip = activeOrder && activeOrder.status !== 'Delivered';

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Banner */}
      <div className="p-6 rounded-3xl shadow-md bg-gradient-to-r from-[#E6EFE3] to-[#CBE0C4] border border-[#7DA972]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[#1F361C]">
        <div className="flex items-center gap-4">
          <img 
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'} 
            alt={currentUser?.name || 'Driver'} 
            className="w-14 h-14 rounded-2xl object-cover border-2 border-[#D9822B] shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-2xl text-[#1F361C]">{currentUser?.name || 'Arun Kumar'}</h1>
              <span className="flex items-center gap-1 bg-[#FDF3E3] text-[#D9822B] text-xs font-bold px-2 py-0.5 rounded-md border border-[#D9822B]/20">
                <Star className="w-3 h-3 fill-current" /> 4.9
              </span>
            </div>
            <p className="text-xs text-[#62432B] flex items-center gap-2 mt-0.5 font-medium">
              <span>{currentUser?.vehicle || 'Tata Ace Mini Truck (EV)'}</span>
              <span>•</span>
              <span className="font-mono text-[#825D3E]">{currentUser?.vehicleNumber || 'TN 45 BK 2049'}</span>
            </p>
          </div>
        </div>

        {/* GPS Duty Status */}
        <div className="flex items-center gap-3 bg-white/40 p-2 rounded-2xl border border-[#7DA972]/30 self-start sm:self-auto">
          <span className="text-xs font-bold text-[#2B4C26]">
            {isOnline ? '🟢 GPS Duty Online' : '⚪ Offline'}
          </span>
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shadow-inner ${
              isOnline ? 'bg-[#4EA858]' : 'bg-[#CBE0C4]'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
              isOnline ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* Main Grid with Sidebar and Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* DRIVER SIDEBAR */}
        <div className="lg:col-span-3 space-y-2">
          <div className="ghibli-card p-3 bg-white space-y-1.5 shadow-sm sticky top-24">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#825D3E] px-3 py-1 block">
              Driver Console
            </span>

            <button
              onClick={() => setActiveSidebarNav('home')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeSidebarNav === 'home' ? 'bg-[#2B4C26] text-white shadow-md' : 'text-[#1F361C] hover:bg-[#FAF7F0]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Home className={`w-4 h-4 ${activeSidebarNav === 'home' ? 'text-white' : 'text-[#2B4C26]'}`} />
                <span>Home</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSidebarNav('requests')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeSidebarNav === 'requests' ? 'bg-[#2B4C26] text-white shadow-md' : 'text-[#1F361C] hover:bg-[#FAF7F0]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bell className={`w-4 h-4 ${activeSidebarNav === 'requests' ? 'text-white' : 'text-[#D9822B]'}`} />
                <span>Trip Requests</span>
              </div>
              {isIncomingTrip && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#D9822B] animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveSidebarNav('active_trip')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeSidebarNav === 'active_trip' ? 'bg-[#2B4C26] text-white shadow-md' : 'text-[#1F361C] hover:bg-[#FAF7F0]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Truck className={`w-4 h-4 ${activeSidebarNav === 'active_trip' ? 'text-white' : 'text-[#0284C7]'}`} />
                <span>Active Trip</span>
              </div>
              {hasActiveTrip && (
                <span className="px-2 py-0.5 rounded-full bg-[#52C41A] text-white text-[9px] font-bold">LIVE</span>
              )}
            </button>

            <button
              onClick={() => setActiveSidebarNav('completed')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeSidebarNav === 'completed' ? 'bg-[#2B4C26] text-white shadow-md' : 'text-[#1F361C] hover:bg-[#FAF7F0]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle className={`w-4 h-4 ${activeSidebarNav === 'completed' ? 'text-white' : 'text-[#4EA858]'}`} />
                <span>Completed Trips</span>
              </div>
              <span className="text-[10px] font-bold bg-[#E6EFE3] text-[#2B4C26] px-2 py-0.5 rounded-full">
                {activeOrder?.status === 'Delivered' ? 1 : 0}
              </span>
            </button>

            <button
              onClick={() => setActiveSidebarNav('earnings')}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeSidebarNav === 'earnings' ? 'bg-[#2B4C26] text-white shadow-md' : 'text-[#1F361C] hover:bg-[#FAF7F0]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <IndianRupee className={`w-4 h-4 ${activeSidebarNav === 'earnings' ? 'text-white' : 'text-[#D9822B]'}`} />
                <span>Earnings</span>
              </div>
            </button>
          </div>
        </div>

        {/* DRIVER MAIN DISPLAY AREA */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* 1. HOME VIEW */}
          {activeSidebarNav === 'home' && (
            <div className="space-y-6">
              
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="ghibli-card p-4 bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase text-[#62432B]">Active Freight</span>
                    <Truck className="w-4 h-4 text-[#D9822B]" />
                  </div>
                  <div className="font-display font-extrabold text-2xl text-[#1F361C]">
                    {hasActiveTrip ? 1 : 0}
                  </div>
                  <div className="text-[10px] text-[#5F8A55] font-semibold mt-0.5">GPS Live Status</div>
                </div>

                <div className="ghibli-card p-4 bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase text-[#62432B]">Completed</span>
                    <CheckCircle className="w-4 h-4 text-[#4EA858]" />
                  </div>
                  <div className="font-display font-extrabold text-2xl text-[#1F361C]">
                    {activeOrder?.status === 'Delivered' ? 1 : 0}
                  </div>
                  <div className="text-[10px] text-[#4EA858] font-semibold mt-0.5">100% Verified</div>
                </div>

                <div className="ghibli-card p-4 bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase text-[#62432B]">Distance</span>
                    <Navigation className="w-4 h-4 text-[#0284C7]" />
                  </div>
                  <div className="font-display font-extrabold text-2xl text-[#1F361C]">12.4 km</div>
                  <div className="text-[10px] text-[#0284C7] font-semibold mt-0.5">Green Route 45</div>
                </div>

                <div className="ghibli-card p-4 bg-white border-[#D9822B]/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase text-[#D9822B]">Total Earnings</span>
                    <IndianRupee className="w-4 h-4 text-[#D9822B]" />
                  </div>
                  <div className="font-display font-extrabold text-2xl text-[#2B4C26]">
                    ₹{activeOrder?.status === 'Delivered' ? (activeOrder?.driverAmount || 500) : 0}
                  </div>
                  <div className="text-[10px] text-[#4EA858] font-semibold mt-0.5">Instant Escrow Payout</div>
                </div>
              </div>

              {/* INCOMING ORDER BANNER */}
              {isIncomingTrip && (
                <div className="p-6 rounded-3xl bg-gradient-to-r from-[#D9822B] to-[#ECA946] text-white shadow-xl space-y-4 animate-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl animate-bounce">
                        🚚
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#FDF3E3]">NEW TRIP ALLOCATION</span>
                        <h3 className="font-display font-extrabold text-2xl text-white">You've received an order!</h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-[#FDF3E3]">Driver Earnings:</span>
                      <div className="font-display font-extrabold text-3xl text-white">₹{activeOrder.driverAmount || 500}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-white/10 rounded-2xl backdrop-blur-sm text-xs">
                    <div>
                      <span className="text-white/75 block">📦 Cargo:</span>
                      <strong className="text-white text-sm">{activeOrder.quantity} kg {activeOrder.productName}</strong>
                    </div>
                    <div>
                      <span className="text-white/75 block">🛣️ Distance & Route:</span>
                      <strong className="text-white text-sm">12.4 km (~24 mins)</strong>
                    </div>
                    <div>
                      <span className="text-white/75 block">🌾 Pickup Location:</span>
                      <strong className="text-white">{activeOrder.farmerName}</strong> ({activeOrder.farmerLocation})
                    </div>
                    <div>
                      <span className="text-white/75 block">🏪 Delivery Location:</span>
                      <strong className="text-white">{activeOrder.retailerName}</strong> ({activeOrder.retailerLocation})
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      onClick={() => acceptTrip(activeOrder.id)}
                      className="px-8 py-3 rounded-2xl bg-white text-[#D9822B] font-extrabold text-sm hover:scale-105 transition-all shadow-lg cursor-pointer"
                    >
                      ✓ Accept Trip & Start Navigation
                    </button>
                  </div>
                </div>
              )}

              {/* Active Trip Quick Access */}
              {hasActiveTrip && !isIncomingTrip && (
                <div className="ghibli-card p-6 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-lg text-[#1F361C]">Active Freight Delivery in Progress</h3>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E6EFE3] text-[#2B4C26]">
                      {activeOrder.status}
                    </span>
                  </div>
                  <LiveGPSMap 
                    originName={activeOrder.farmerLocation}
                    destinationName={activeOrder.retailerLocation}
                    driverName={currentUser?.name || 'Arun Kumar'}
                    isMoving={activeOrder.status === 'In Transit'}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => setActiveSidebarNav('active_trip')}
                      className="px-5 py-2.5 rounded-xl bg-[#2B4C26] text-white font-bold text-xs hover:bg-[#386332] flex items-center gap-1.5 cursor-pointer"
                    >
                      Open Trip Handover Controls <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {!hasActiveTrip && !isIncomingTrip && (
                <div className="ghibli-card p-10 text-center bg-white space-y-3">
                  <div className="w-16 h-16 rounded-full bg-[#FAF7F0] border border-[#7DA972]/30 flex items-center justify-center text-3xl mx-auto text-[#D9822B] animate-pulse">
                    📡
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#1F361C]">Driver Radar is Active</h3>
                  <p className="text-xs text-[#62432B]/80 max-w-sm mx-auto">
                    You are in the dispatch queue. When a retailer orders crops from a farmer, a trip alert will appear here automatically.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 2. TRIP REQUESTS VIEW */}
          {activeSidebarNav === 'requests' && (
            <div className="space-y-4">
              <h3 className="font-display font-bold text-xl text-[#1F361C]">Available Trip Requests</h3>
              
              {isIncomingTrip ? (
                <div className="ghibli-card p-6 bg-white border-2 border-[#D9822B] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#7DA972]/20">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-[#D9822B]" />
                      <h4 className="font-display font-extrabold text-lg text-[#1F361C]">You've received an order!</h4>
                    </div>
                    <span className="font-display font-extrabold text-2xl text-[#2B4C26]">₹{activeOrder.driverAmount || 500}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div><strong>Product:</strong> {activeOrder.quantity} kg {activeOrder.productName}</div>
                    <div><strong>Distance:</strong> 12.4 km (~24 min)</div>
                    <div><strong>Pickup:</strong> {activeOrder.farmerName} ({activeOrder.farmerLocation})</div>
                    <div><strong>Delivery:</strong> {activeOrder.retailerName} ({activeOrder.retailerLocation})</div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => acceptTrip(activeOrder.id)}
                      className="px-6 py-2.5 rounded-xl bg-[#2B4C26] text-white font-bold text-xs hover:bg-[#386332] cursor-pointer"
                    >
                      Accept Trip (₹{activeOrder.driverAmount || 500})
                    </button>
                  </div>
                </div>
              ) : (
                <div className="ghibli-card p-8 text-center bg-white text-xs text-[#62432B]">
                  No pending trip requests right now. Standing by for incoming orders.
                </div>
              )}
            </div>
          )}

          {/* 3. ACTIVE TRIP VIEW & DUAL HANDOVERS */}
          {activeSidebarNav === 'active_trip' && (
            <div className="space-y-6">
              {hasActiveTrip ? (
                <div className="ghibli-card-elevated p-6 bg-white space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#7DA972]/20">
                    <div>
                      <h3 className="font-display font-extrabold text-xl text-[#1F361C]">
                        Active Delivery: {activeOrder.quantity} kg {activeOrder.productName}
                      </h3>
                      <p className="text-xs text-[#5F8A55]">{activeOrder.timelineStatus}</p>
                    </div>
                    <div className="text-xs font-bold text-[#D9822B] bg-[#FDF3E3] px-3 py-1 rounded-full self-start">
                      Status: {activeOrder.status}
                    </div>
                  </div>

                  {/* HANDOVER 1: Pickup Handover Accept */}
                  {activeOrder.status === 'Pickup Requested' && (
                    <div className="p-4 rounded-2xl bg-[#E6EFE3] border-2 border-[#4EA858] space-y-3 animate-in zoom-in-95">
                      <div className="flex items-center gap-2">
                        <Handshake className="w-5 h-5 text-[#2B4C26]" />
                        <h4 className="font-display font-bold text-sm text-[#1F361C]">
                          Product Handover Request from Farmer
                        </h4>
                      </div>
                      <p className="text-xs text-[#2B4C26]">
                        Farmer has requested handover for <strong>{activeOrder.quantity} kg {activeOrder.productName}</strong> (Batch: {activeOrder.batchId}). Inspect produce and confirm custody.
                      </p>
                      <button
                        onClick={() => acceptPickupHandover(activeOrder.id)}
                        className="w-full py-3 rounded-xl bg-[#2B4C26] hover:bg-[#386332] text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#A5D6A7]" />
                        Accept Handover & Start Shipment
                      </button>
                    </div>
                  )}

                  {/* HANDOVER 2: Delivery Handover Request */}
                  {(activeOrder.status === 'Driver Arrived at Destination' || (activeOrder.status === 'In Transit' && gpsData.progress >= 90)) && (
                    <div className="p-4 rounded-2xl bg-[#FDF3E3] border-2 border-[#D9822B] space-y-3 animate-in zoom-in-95">
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-[#D9822B]" />
                        <h4 className="font-display font-bold text-sm text-[#1F361C]">
                          Arrived at Retailer ({activeOrder.retailerName})
                        </h4>
                      </div>
                      <p className="text-xs text-[#825D3E]">
                        You have arrived at the supermarket destination. Request store manager to scan and complete delivery handover to release your ₹{activeOrder.driverAmount || 500} payment.
                      </p>
                      <button
                        onClick={() => requestDeliveryHandover(activeOrder.id)}
                        className="w-full py-3 rounded-xl bg-[#D9822B] hover:bg-[#c27020] text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Handshake className="w-4 h-4 text-white" />
                        Request Delivery Handover
                      </button>
                    </div>
                  )}

                  {activeOrder.status === 'Delivery Requested' && (
                    <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/40 text-xs text-[#1F361C] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#D9822B] animate-spin" />
                      <span>Delivery handover requested. Awaiting retailer QR check-in & escrow release...</span>
                    </div>
                  )}

                  {/* Live GPS Map */}
                  <LiveGPSMap 
                    originName={activeOrder.farmerLocation}
                    destinationName={activeOrder.retailerLocation}
                    driverName={currentUser?.name || 'Arun Kumar'}
                    isMoving={activeOrder.status === 'In Transit'}
                  />
                </div>
              ) : (
                <div className="ghibli-card p-8 text-center bg-white text-xs text-[#62432B]">
                  No active delivery in progress. Accept a trip request to start navigation.
                </div>
              )}
            </div>
          )}

          {/* 4. COMPLETED TRIPS VIEW */}
          {activeSidebarNav === 'completed' && (
            <div className="ghibli-card-elevated p-6 bg-white space-y-4">
              <h3 className="font-display font-bold text-xl text-[#1F361C]">Completed Freight Trips</h3>
              {activeOrder?.status === 'Delivered' ? (
                <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#4EA858] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-sm text-[#1F361C]">Trip #{activeOrder.id} • {activeOrder.quantity} kg {activeOrder.productName}</div>
                    <div className="text-[#5F8A55]">{activeOrder.farmerName} → {activeOrder.retailerName} (12.4 km)</div>
                    <div className="text-[10px] text-[#62432B] mt-0.5">Payment Method: Instant Multi-Sig Smart Escrow</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-xl text-[#2B4C26]">₹{activeOrder.driverAmount || 500}</div>
                    <div className="text-[11px] text-[#4EA858] font-bold">✓ Credited Instantly</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-[#62432B]">
                  Completed trips will appear here with verified receipt logs upon delivery handover acceptance.
                </div>
              )}
            </div>
          )}

          {/* 5. EARNINGS VIEW */}
          {activeSidebarNav === 'earnings' && (
            <div className="ghibli-card-elevated p-6 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-[#7DA972]/20 pb-3">
                <h3 className="font-display font-bold text-xl text-[#1F361C]">Driver Logistics Earnings</h3>
                <span className="text-xs font-bold text-[#4EA858] bg-[#E6EFE3] px-3 py-1 rounded-full">
                  0% Commission Charged
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#F6D28B] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#825D3E] font-bold block">Wallet Balance:</span>
                  <div className="font-display font-extrabold text-3xl text-[#2B4C26]">
                    ₹{activeOrder?.status === 'Delivered' ? (activeOrder?.driverAmount || 500) : 0}
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#5F8A55]">UPI / Direct Bank Payout</span>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* POPUP MODAL FOR INCOMING TRIP */}
      {isIncomingTrip && (
        <TripRequestModal 
          order={activeOrder}
          onAccept={() => acceptTrip(activeOrder.id)}
          onDecline={() => console.log('Declined')}
        />
      )}

    </div>
  );
}
