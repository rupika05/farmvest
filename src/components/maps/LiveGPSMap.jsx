import React from 'react';
import { useFarmVest } from '../../context/FarmVestContext';
import { Navigation, Compass, Radio, MapPin, Truck, Store, Sprout } from 'lucide-react';

export default function LiveGPSMap({ 
  originName = 'Saranathan Farm, Valley Sector 4', 
  destinationName = 'FreshMart Superstore, Main Junction',
  driverName = 'Arun Kumar',
  isMoving = false
}) {
  const { gpsData } = useFarmVest();

  // Progress along the path (0 to 100%)
  const progress = gpsData.isActive ? gpsData.progress : (isMoving ? 45 : 0);

  // SVG road path waypoints
  const pathD = "M 80 190 Q 200 120, 320 160 T 520 100 T 700 80";

  // Calculate truck position along curved spline
  // Linear approximation of the curve for the demo
  const startX = 80, startY = 190;
  const midX = 380, midY = 135;
  const endX = 700, endY = 80;
  
  const t = progress / 100;
  const currentX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
  const currentY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * endY;

  return (
    <div className="ghibli-card overflow-hidden bg-[#FAF7F0] border border-[#7DA972]/30 shadow-md">
      
      {/* Map Header / Telemetry Bar */}
      <div className="p-3.5 bg-[#1F361C] text-white flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[#A5D6A7] font-bold">
            <Radio className="w-4 h-4 animate-pulse text-[#52C41A]" />
            <span>GPS Telemetry: {gpsData.isActive ? 'ACTIVE' : 'READY'}</span>
          </div>
          <span className="text-white/30">•</span>
          <span className="text-xs text-[#CBE0C4]">Green Route 45</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="text-[#F6D28B]">
            Speed: <strong>{gpsData.speedKmh || (isMoving ? 42 : 0)} km/h</strong>
          </span>
          <span className="text-[#A5D6A7]">
            Distance: <strong>{gpsData.distanceRemainingKm} km</strong>
          </span>
          <span className="text-white bg-white/10 px-2 py-0.5 rounded font-bold">
            ETA: <strong>{gpsData.etaMinutes} min</strong>
          </span>
        </div>
      </div>

      {/* Map Canvas Visualizer */}
      <div className="relative h-64 sm:h-80 bg-gradient-to-br from-[#E3EFE5] via-[#EDE7DA] to-[#D5E8D8] overflow-hidden p-4">
        
        {/* Subtle Countryside Topography Contours */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 800 300">
          <circle cx="150" cy="80" r="120" fill="none" stroke="#2B4C26" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="650" cy="200" r="160" fill="none" stroke="#2B4C26" strokeWidth="1" strokeDasharray="4 4" />
          <path d="M 0 100 Q 200 40 400 120 T 800 90" fill="none" stroke="#5F8A55" strokeWidth="1.5" />
          <path d="M 0 240 Q 300 180 600 260 T 800 220" fill="none" stroke="#5F8A55" strokeWidth="1.5" />
        </svg>

        {/* Road Track SVG */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
          {/* Outer Road Stroke */}
          <path d={pathD} fill="none" stroke="#825D3E" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
          {/* Inner Road Path */}
          <path d={pathD} fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
          {/* Traveled Breadcrumb Line */}
          <path d={pathD} fill="none" stroke="#4EA858" strokeWidth="6" strokeDasharray="10 6" strokeLinecap="round" />
        </svg>

        {/* Origin Pin: 🌾 Farmer */}
        <div 
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: '10%', top: '65%' }}
        >
          <div className="px-2.5 py-1 rounded-full bg-[#1F361C] text-white text-[10px] font-bold shadow-md mb-1 whitespace-nowrap border border-[#A5D6A7]/40 flex items-center gap-1">
            <Sprout className="w-3 h-3 text-[#A5D6A7]" />
            {originName.split(',')[0]}
          </div>
          <div className="w-9 h-9 rounded-full bg-[#2B4C26] text-white flex items-center justify-center text-lg shadow-xl border-2 border-white ring-4 ring-[#4EA858]/30">
            🌾
          </div>
        </div>

        {/* Destination Pin: 🏪 Retailer */}
        <div 
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: '88%', top: '28%' }}
        >
          <div className="px-2.5 py-1 rounded-full bg-[#0369A1] text-white text-[10px] font-bold shadow-md mb-1 whitespace-nowrap border border-white/40 flex items-center gap-1">
            <Store className="w-3 h-3" />
            {destinationName.split(',')[0]}
          </div>
          <div className="w-9 h-9 rounded-full bg-[#0284C7] text-white flex items-center justify-center text-lg shadow-xl border-2 border-white ring-4 ring-[#0284C7]/30">
            🏪
          </div>
        </div>

        {/* Moving Vehicle Marker: 🚚 Driver */}
        <div 
          className="absolute z-30 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-1000 ease-linear"
          style={{ 
            left: `${10 + (progress * 0.78)}%`, 
            top: `${65 - (progress * 0.37)}%` 
          }}
        >
          <div className="px-2.5 py-0.5 rounded-full bg-[#D9822B] text-white text-[10px] font-bold shadow-lg mb-1 whitespace-nowrap border border-white animate-bounce flex items-center gap-1">
            <Truck className="w-3 h-3" />
            {driverName} ({gpsData.speedKmh || (isMoving ? 42 : 0)} km/h)
          </div>
          
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#FAF7F0] border-2 border-[#D9822B] text-xl flex items-center justify-center shadow-2xl ring-4 ring-[#F6D28B]/50 animate-pulse">
              🚚
            </div>
          </div>
        </div>

        {/* Waypoint Markers */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-white/80 text-[9px] font-bold text-[#62432B] border border-[#7DA972]/30 shadow-sm pointer-events-none">
          Arterial Highway Junction 45
        </div>

      </div>

      {/* Map Footer status */}
      <div className="p-3 bg-white border-t border-[#7DA972]/20 flex flex-wrap items-center justify-between text-xs text-[#1F361C]">
        <div className="flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-[#5F8A55]" />
          <span>Heading: <strong>North-East (48°)</strong></span>
          <span className="text-[#7DA972]">•</span>
          <span>Lat: {gpsData.currentLat}, Lng: {gpsData.currentLng}</span>
        </div>
        <div className="text-[11px] text-[#5F8A55] font-medium">
          Verified GPS Satellite Locks: 14/14
        </div>
      </div>

    </div>
  );
}
