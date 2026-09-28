import React from 'react';
import { useFarmVest } from '../../context/FarmVestContext';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Cpu, 
  Layers, 
  TrendingUp, 
  Users, 
  Truck, 
  Store, 
  Coins, 
  Activity, 
  Sparkles,
  ArrowRight,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

export default function AdminDashboard() {
  const { blocks, products, activeOrder } = useFarmVest();
  const { setActiveView } = useAuth();

  const metrics = [
    { label: 'Total Verified Farmers', value: '1,248', change: '+12% this month', icon: Users, color: 'text-[#2B4C26]' },
    { label: 'Active Green Drivers', value: '412', change: '98% on-time rate', icon: Truck, color: 'text-[#D9822B]' },
    { label: 'Registered Superstores', value: '864', change: 'Direct sourcing', icon: Store, color: 'text-[#0284C7]' },
    { label: 'Total Escrow Transacted', value: '₹4.82 Cr', change: '0% platform cut', icon: Coins, color: 'text-[#4EA858]' }
  ];

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="ghibli-card-elevated p-6 sm:p-8 bg-gradient-to-r from-[#192E16] to-[#2B4C26] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-[#A5D6A7] font-semibold border border-white/10 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Polygon Smart Contract Network & Audit
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white">
            Operations & Blockchain Ledger
          </h1>
          <p className="text-xs sm:text-sm text-[#CBE0C4] mt-1">
            Real-time oracle telemetry, cryptographic block confirmations, and smart contract escrow distribution.
          </p>
        </div>

        <button
          onClick={() => setActiveView('landing')}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all self-start sm:self-auto"
        >
          Back to Home
        </button>
      </div>

      {/* 4 Network KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="ghibli-card p-5 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase text-[#62432B]">{m.label}</span>
                <Icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <div className="font-display font-extrabold text-2xl text-[#1F361C]">{m.value}</div>
              <div className="text-[10px] text-[#5F8A55] font-semibold mt-0.5">{m.change}</div>
            </div>
          );
        })}
      </div>

      {/* Blockchain Ledger Table */}
      <div className="ghibli-card-elevated p-6 bg-white space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#7DA972]/20">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#2B4C26]" />
            <h3 className="font-display font-bold text-lg text-[#1F361C]">
              Immutable Polygon Block Ledger
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-[#2B4C26] bg-[#E6EFE3] px-3 py-1 rounded-full">
            Network: Polygon Amoy PoS (80002)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#7DA972]/20 text-[#62432B] font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Block #</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Smart Contract Event</th>
                <th className="py-2.5 px-3">Transaction Hash</th>
                <th className="py-2.5 px-3 text-right">Gas Used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#7DA972]/15">
              {blocks.map((b, idx) => (
                <tr key={idx} className="hover:bg-[#FAF7F0] transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-[#2B4C26]">#{b.blockNumber}</td>
                  <td className="py-3 px-3 text-[#62432B]">{new Date(b.timestamp).toLocaleTimeString()}</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-[#1F361C] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#4EA858]" />
                      {b.event}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[10px] text-[#5F8A55] truncate max-w-xs">
                    {b.hash}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[#825D3E]">
                    {b.gasUsed || '135,210 Gwei'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
