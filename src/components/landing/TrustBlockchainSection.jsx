import React from 'react';
import { useFarmVest } from '../../context/FarmVestContext';
import { Shield, CheckCircle2, Lock, Cpu, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TrustBlockchainSection() {
  const { blocks } = useFarmVest();
  const { setActiveView } = useAuth();

  return (
    <section className="py-20 bg-[#FAF7F0] border-t border-[#7DA972]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left: Blockchain & Escrow Trust Value Prop */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6EFE3] text-xs font-bold text-[#2B4C26] uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-[#386332]" />
              Cryptographic Integrity
            </div>

            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#142412] leading-tight">
              Backed by <span className="text-[#2B4C26]">Polygon Smart Contracts</span> & Multi-Sig Escrow
            </h2>

            <p className="text-sm sm:text-base text-[#462E1C]/85 leading-relaxed">
              Every critical lifecycle event — from AI quality certification to driver custody handovers and consumer receipts — is anchored immutably on-chain. Funds are held in escrow and released the instant the retailer confirms physical handover.
            </p>

            <div className="space-y-3 text-xs sm:text-sm text-[#1F361C]">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/90 border border-[#7DA972]/25 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-[#4EA858] flex-shrink-0" />
                <div>
                  <strong>Zero Payment Default Risk:</strong> Buyer funds are locked before driver dispatch.
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/90 border border-[#7DA972]/25 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-[#4EA858] flex-shrink-0" />
                <div>
                  <strong>Dual Custody Verification:</strong> Both Farmer and Driver must approve handover to initiate transit.
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/90 border border-[#7DA972]/25 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-[#4EA858] flex-shrink-0" />
                <div>
                  <strong>Permanent Consumer Certificate:</strong> Every QR code queries verifiable block state.
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setActiveView('admin')}
                className="px-5 py-2.5 rounded-xl bg-[#2B4C26] text-white text-xs font-bold hover:bg-[#386332] transition-all flex items-center gap-2 shadow-md"
              >
                ⛓️ View Live Blockchain Explorer <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Real-time Live Block Stream Feed */}
          <div className="lg:col-span-6">
            <div className="ghibli-card-elevated p-6 bg-white/95 border border-[#7DA972]/30 shadow-xl">
              
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#7DA972]/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4EA858] animate-ping" />
                  <h4 className="font-display font-bold text-sm text-[#142412]">
                    Polygon PoS Live Block Stream
                  </h4>
                </div>
                <span className="text-[10px] font-mono bg-[#E6EFE3] text-[#2B4C26] px-2 py-0.5 rounded font-bold">
                  Chain 80002
                </span>
              </div>

              {/* Blocks Stream List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {blocks.slice(0, 5).map((b, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 rounded-xl bg-[#FAF7F0] border border-[#7DA972]/20 hover:border-[#5F8A55] transition-all text-xs"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                      <span className="text-[#2B4C26] font-bold">Block #{b.blockNumber}</span>
                      <span className="text-[#825D3E] text-[10px]">{new Date(b.timestamp).toLocaleTimeString()}</span>
                    </div>

                    <div className="font-bold text-[#1F361C] flex items-center gap-1.5 mb-1">
                      <Cpu className="w-3.5 h-3.5 text-[#5F8A55]" />
                      {b.event}
                    </div>

                    <div className="font-mono text-[10px] text-[#62432B]/80 truncate bg-white/80 p-1.5 rounded border border-[#7DA972]/15">
                      Hash: {b.hash}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-[#7DA972]/20 flex items-center justify-between text-[11px] text-[#5F8A55]">
                <span>Status: Fully Synced</span>
                <span>Gas Price: ~32.5 Gwei</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
