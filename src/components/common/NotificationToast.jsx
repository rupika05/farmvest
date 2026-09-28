import React from 'react';
import { useFarmVest } from '../../context/FarmVestContext';
import { CheckCircle2, AlertCircle, Sparkles, X, ArrowRight } from 'lucide-react';
export default function NotificationToast() {
  const { activeToast, setActiveToast, activeOrder } = useFarmVest();

  if (!activeToast) return null;

  const isSuccess = activeToast.type === 'success';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${
        isSuccess 
          ? 'bg-[#1F361C]/95 border-[#5F8A55] text-white shadow-[#1F361C]/20' 
          : 'bg-[#462E1C]/95 border-[#D9822B] text-white shadow-[#462E1C]/20'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl flex-shrink-0 ${
            isSuccess ? 'bg-[#5F8A55]/30 text-[#A5D6A7]' : 'bg-[#D9822B]/30 text-[#F6D28B]'
          }`}>
            {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>

          <div className="flex-1 min-w-0">
            <h5 className="font-display font-bold text-sm text-white tracking-wide">
              {activeToast.title}
            </h5>
            <p className="text-xs text-[#FAF7F0]/85 mt-1 leading-relaxed">
              {activeToast.message}
            </p>
          </div>

          <button
            onClick={() => setActiveToast(null)}
            className="text-white/60 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
