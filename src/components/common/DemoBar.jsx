import React from 'react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { useFarmVest } from '../../context/FarmVestContext';
import { 
  Sparkles, 
  RotateCcw, 
  Play, 
  CheckCircle2, 
  Truck, 
  Store, 
  Sprout, 
  ShieldCheck, 
  QrCode, 
  Layers 
} from 'lucide-react';

export default function DemoBar() {
  const { currentUser, loginAsRole, activeView, setActiveView } = useAuth();
  const { 
    activeOrder, 
    resetDemoState, 
    isAutoDemoRunning, 
    setIsAutoDemoRunning,
    demoStepName,
    setDemoStepName,
    setSelectedQrBatch
  } = useFarmVest();

  // Run complete automated walkthrough
  const handleAutoDemo = async () => {
    if (isAutoDemoRunning) return;
    setIsAutoDemoRunning(true);

    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    try {
      // Step 1: Switch to Farmer
      setDemoStepName('Step 1/7: Farmer listing crop & AI Grading');
      loginAsRole('farmer');
      await sleep(2500);

      // Step 2: Switch to Retailer & Place Order
      setDemoStepName('Step 2/7: Retailer ordering 100 kg Tomato via Marketplace');
      loginAsRole('retailer');
      await sleep(2500);

      // Step 3: Switch to Driver
      setDemoStepName('Step 3/7: Driver receiving Trip Request notification');
      loginAsRole('driver');
      await sleep(2500);

      // Step 4: Farmer Handover
      setDemoStepName('Step 4/7: Farmer & Driver performing Pickup Handover');
      loginAsRole('farmer');
      await sleep(2500);

      // Step 5: Live GPS in Transit
      setDemoStepName('Step 5/7: Live GPS tracking on road');
      loginAsRole('driver');
      await sleep(3500);

      // Step 6: Retailer Delivery Handover & Escrow
      setDemoStepName('Step 6/7: Retailer Delivery Handover & Escrow Payout');
      loginAsRole('retailer');
      await sleep(3000);

      // Step 7: Consumer QR Traceability
      setDemoStepName('Step 7/7: Master QR Public Harvest Traceability');
      setSelectedQrBatch({
        batchId: 'FV-TOM-101',
        name: 'Heritage Red Tomato',
        farmerName: 'Green Valley Farm',
        location: 'Saranathan Farm, Valley Sector 4'
      });
      setActiveView('traceability');
      await sleep(3000);

    } finally {
      setIsAutoDemoRunning(false);
      setDemoStepName('');
    }
  };

  return (
    <div className="bg-[#192E16] text-[#FAF7F0] border-b border-[#3D6430]/40 px-3 py-2 text-xs sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Left: Role Switcher Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[#A2C498] font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1 mr-1">
            <span className="w-2 h-2 rounded-full bg-[#4EA858] animate-pulse"></span>
            Demo Switcher:
          </span>

          <button
            onClick={() => { loginAsRole('farmer'); setActiveView('app'); }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
              activeView === 'app' && currentUser?.role === 'farmer'
                ? 'bg-[#4EA858] text-white shadow-sm font-semibold'
                : 'bg-[#253D21] text-[#D0E2CC] hover:bg-[#2F4D2B]'
            }`}
          >
            <Sprout className="w-3.5 h-3.5 text-[#A5D6A7]" />
            🌾 Farmer
          </button>

          <button
            onClick={() => { loginAsRole('driver'); setActiveView('app'); }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
              activeView === 'app' && currentUser?.role === 'driver'
                ? 'bg-[#4EA858] text-white shadow-sm font-semibold'
                : 'bg-[#253D21] text-[#D0E2CC] hover:bg-[#2F4D2B]'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-[#F6D28B]" />
            🚚 Driver
          </button>

          <button
            onClick={() => { loginAsRole('retailer'); setActiveView('app'); }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
              activeView === 'app' && currentUser?.role === 'retailer'
                ? 'bg-[#4EA858] text-white shadow-sm font-semibold'
                : 'bg-[#253D21] text-[#D0E2CC] hover:bg-[#2F4D2B]'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-[#93C5FD]" />
            🏪 Retailer
          </button>

          <button
            onClick={() => {
              setSelectedQrBatch({
                batchId: 'FV-TOM-101',
                name: 'Heritage Red Tomato',
                farmerName: 'Green Valley Farm',
                location: 'Saranathan Farm, Valley Sector 4'
              });
              setActiveView('traceability');
            }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
              activeView === 'traceability'
                ? 'bg-[#D9822B] text-white font-semibold'
                : 'bg-[#253D21] text-[#D0E2CC] hover:bg-[#2F4D2B]'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-[#F6D28B]" />
            🔍 Public QR Trace
          </button>

          <button
            onClick={() => { loginAsRole('admin'); setActiveView('admin'); }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
              activeView === 'admin'
                ? 'bg-[#6366F1] text-white font-semibold'
                : 'bg-[#253D21] text-[#D0E2CC] hover:bg-[#2F4D2B]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#C7D2FE]" />
            ⛓️ Blockchain / Admin
          </button>
        </div>

        {/* Middle: Active Order State Indicator */}
        <div className="hidden lg:flex items-center gap-2 bg-[#223B1E] px-2.5 py-0.5 rounded-full border border-[#3E6634]/50">
          <span className="text-[#8DAA81] text-[11px]">Active Lifecycle:</span>
          <span className="text-white font-semibold text-[11px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#52C41A] animate-ping"></span>
            {activeOrder ? `${activeOrder.status} (${activeOrder.batchId})` : 'Ready for listing & orders'}
          </span>
        </div>

        {/* Right: Auto Demo & Reset controls */}
        <div className="flex items-center gap-2">
          {isAutoDemoRunning && (
            <span className="text-[#F6D28B] animate-pulse font-medium text-[11px] mr-1">
              ⚡ {demoStepName}
            </span>
          )}

          <button
            onClick={handleAutoDemo}
            disabled={isAutoDemoRunning}
            className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-bold transition-all shadow-sm ${
              isAutoDemoRunning
                ? 'bg-[#D9822B] text-white opacity-80 cursor-wait'
                : 'bg-gradient-to-r from-[#4EA858] to-[#3B9245] hover:brightness-110 text-white'
            }`}
            title="Automatically run through Farmer -> Retailer -> Driver -> Handover -> Escrow -> Traceability"
          >
            <Play className="w-3 h-3 fill-current" />
            {isAutoDemoRunning ? 'Running Tour...' : '▶ 1-Click Auto Demo'}
          </button>

          <button
            onClick={resetDemoState}
            className="p-1.5 rounded-lg bg-[#253D21] hover:bg-[#34522E] text-[#D0E2CC] hover:text-white transition-colors"
            title="Reset demo data to initial state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
