import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, ShieldAlert, Cpu, Award } from 'lucide-react';

export default function AICropScanner({ imageSrc, cropName = 'Tomato', onScanComplete }) {
  const [scanningPhase, setScanningPhase] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const scanSteps = [
    'Initializing AI BioVision Neural Engine...',
    'Analyzing morphological surface geometry & skin tension...',
    'Detecting defects, micro-punctures & chlorophyll reflectance...',
    'Checking freshness index & moisture equilibrium...',
    'Computing multi-spectral grade certificate...'
  ];

  useEffect(() => {
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < scanSteps.length) {
        setScanningPhase(currentStep);
      } else {
        clearInterval(interval);
        setIsDone(true);
        if (onScanComplete) onScanComplete();
      }
    }, 800);

    return () => clearInterval(interval);
  }, [imageSrc]);

  return (
    <div className="space-y-6">
      {/* Scanner Visual Frame */}
      <div className="relative rounded-2xl overflow-hidden bg-[#1F361C] aspect-video max-h-72 border-2 border-[#5F8A55] shadow-2xl flex items-center justify-center">
        <img 
          src={imageSrc} 
          alt="Crop preview for AI inspection" 
          className="w-full h-full object-cover opacity-85"
        />

        {/* Scan Laser Beam Animation */}
        {!isDone && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#4EA858] to-transparent shadow-[0_0_15px_#4EA858] animate-scan-beam" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#4EA858]/10 via-transparent to-transparent pointer-events-none" />
            
            {/* AI Bounding Boxes overlay */}
            <div className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-dashed border-[#F6D28B] rounded-xl flex items-start justify-start p-1.5 animate-pulse">
              <span className="bg-[#1F361C]/90 text-[10px] text-[#F6D28B] px-1 py-0.5 rounded font-mono font-bold">
                ROI: Surface 98.4%
              </span>
            </div>

            <div className="absolute bottom-1/4 right-1/4 w-28 h-28 border-2 border-dashed border-[#4EA858] rounded-xl flex items-end justify-end p-1.5 animate-pulse">
              <span className="bg-[#1F361C]/90 text-[10px] text-[#A5D6A7] px-1 py-0.5 rounded font-mono font-bold">
                Defect: 4.1% (Low)
              </span>
            </div>
          </div>
        )}

        {/* Status Badge overlay */}
        <div className="absolute bottom-3 left-3 right-3 bg-[#142412]/90 backdrop-blur-md p-2.5 rounded-xl border border-white/15 flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-2">
            <Cpu className={`w-4 h-4 ${isDone ? 'text-[#4EA858]' : 'text-[#F6D28B] animate-spin'}`} />
            <span className="font-mono text-[11px]">
              {isDone ? 'AI Quality Grading Complete ✓' : scanSteps[scanningPhase]}
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A5D6A7]">
            {isDone ? 'Certified' : 'Analyzing'}
          </span>
        </div>
      </div>

      {/* Grade Result Card */}
      {isDone && (
        <div className="ghibli-card-elevated p-6 border-[#4EA858]/40 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#7DA972]/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4EA858] to-[#2B4C26] text-white flex flex-col items-center justify-center shadow-lg">
                <span className="font-display font-extrabold text-2xl leading-none">92</span>
                <span className="text-[10px] uppercase font-bold text-[#A5D6A7]">/ 100</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-extrabold text-2xl text-[#1F361C]">Grade A</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E6EFE3] text-[#2B4C26] font-bold text-xs">
                    AI Certified
                  </span>
                </div>
                <p className="text-xs text-[#5F8A55]">BioVision Model v3.4 • Confidence 95%</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-[#62432B]/80">Status:</div>
              <div className="text-sm font-bold text-[#2B4C26]">Premium Retail Ready</div>
            </div>
          </div>

          {/* 4 Quality Metric Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
            <div className="p-2.5 rounded-xl bg-white border border-[#7DA972]/20 text-center">
              <span className="text-[10px] text-[#62432B] uppercase font-bold block">Freshness</span>
              <span className="text-lg font-bold text-[#2B4C26]">94%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#7DA972]/20 text-center">
              <span className="text-[10px] text-[#62432B] uppercase font-bold block">Visual Quality</span>
              <span className="text-lg font-bold text-[#2B4C26]">92%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#7DA972]/20 text-center">
              <span className="text-[10px] text-[#62432B] uppercase font-bold block">Defect Index</span>
              <span className="text-lg font-bold text-[#D9822B]">6%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#7DA972]/20 text-center">
              <span className="text-[10px] text-[#62432B] uppercase font-bold block">Confidence</span>
              <span className="text-lg font-bold text-[#2B4C26]">95%</span>
            </div>
          </div>

          {/* Observations Checklist */}
          <div className="space-y-1.5 text-xs text-[#1F361C] bg-[#FAF7F0] p-3 rounded-xl border border-[#7DA972]/20">
            <div className="font-bold text-[#2B4C26] mb-1">AI Inspection Observations:</div>
            <div className="flex items-center gap-1.5 text-[#386332]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4EA858] flex-shrink-0" />
              <span>Good surface quality and firm skin tension</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#386332]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4EA858] flex-shrink-0" />
              <span>Minimal visible damage (within 6% tolerance)</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#386332]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4EA858] flex-shrink-0" />
              <span>Suitable for retail supermarket distribution & cold-chain transit</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
