import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import FarmVestLogo from '../common/FarmVestLogo';
import { X, Download, Share2, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MasterQRCodeModal({ batch, onClose }) {
  const { setActiveView } = useAuth();
  if (!batch) return null;

  const verificationUrl = `https://farmvest.trade/verify/${batch.batchId || 'FV-TOM-101'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="ghibli-card-elevated bg-[#FAF7F0] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-[#7DA972]/40 p-6 space-y-5 animate-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#7DA972]/20">
          <span className="text-[11px] uppercase font-bold text-[#825D3E] tracking-wider">
            Verified Master QR Tag
          </span>
          <button onClick={onClose} className="p-1 text-[#62432B]/60 hover:text-[#1F361C]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Card to Print / Scan */}
        <div className="p-5 rounded-2xl bg-white border-2 border-[#2B4C26] text-center space-y-4 shadow-md relative">
          
          <div className="flex justify-center">
            <FarmVestLogo size="sm" showTagline={false} />
          </div>

          <div className="flex justify-center p-3 bg-[#FAF7F0] rounded-2xl border border-[#7DA972]/30">
            <QRCodeSVG 
              value={verificationUrl}
              size={160}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="space-y-1">
            <div className="font-mono text-sm font-extrabold text-[#2B4C26]">
              {batch.batchId || 'FV-TOM-101'}
            </div>
            <div className="font-display font-bold text-base text-[#1F361C]">
              {batch.name || 'Heritage Red Tomato'}
            </div>
            <div className="text-xs text-[#5F8A55]">
              {batch.farmerName || 'Green Valley Farm'} • {batch.location || 'Saranathan Farm'}
            </div>
          </div>

          {/* AI Grade pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6EFE3] text-[#2B4C26] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#D9822B]" />
            <span>AI Grade A (92/100 Quality Score)</span>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => {
              if (onClose) onClose();
              setActiveView('traceability');
            }}
            className="w-full py-3 rounded-xl bg-[#2B4C26] hover:bg-[#386332] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-[#A5D6A7]" />
            Open Public Consumer Traceability Page
          </button>

          <button
            onClick={() => window.print()}
            className="w-full py-2 rounded-xl bg-white border border-[#7DA972]/40 hover:bg-[#FAF7F0] text-[#1F361C] font-semibold text-xs flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Print Physical Farm Tag
          </button>
        </div>

      </div>
    </div>
  );
}
