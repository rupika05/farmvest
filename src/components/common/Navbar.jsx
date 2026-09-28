import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFarmVest } from '../../context/FarmVestContext';
import FarmVestLogo from './FarmVestLogo';
import { 
  Bell, 
  ChevronDown, 
  LogOut, 
  Sprout, 
  Store, 
  X, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export default function Navbar() {
  const { 
    currentUser, 
    activeView, 
    setActiveView, 
    logout 
  } = useAuth();

  const { notifications } = useFarmVest();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const unreadCount = notifications.length;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#7DA972]/20 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Logo with Official uploaded mark */}
        <div 
          onClick={() => setActiveView(currentUser ? 'dashboard' : 'landing')}
          className="cursor-pointer flex items-center group py-1"
        >
          <FarmVestLogo size="md" showTagline={true} />
        </div>

        {/* Right Actions: Clean Minimal Navigation */}
        <div className="flex items-center gap-3">
          
          {currentUser ? (
            /* Logged in state */
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2 rounded-xl bg-white/80 border border-[#7DA972]/30 text-[#2B4C26] hover:bg-[#E6EFE3] transition-colors cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D9822B] text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 ghibli-card-elevated p-4 z-50 shadow-2xl animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-3 border-b border-[#7DA972]/20">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#386332]" />
                        <h4 className="font-display font-bold text-[#1F361C] text-sm">Notifications</h4>
                      </div>
                      <button 
                        onClick={() => setIsNotifOpen(false)}
                        className="p-1 text-[#62432B]/60 hover:text-[#1F361C] cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3 max-h-72 overflow-y-auto space-y-2 pr-1">
                      {notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className="p-2.5 rounded-xl bg-white border border-[#7DA972]/20 hover:border-[#5F8A55]/40 transition-all text-xs"
                        >
                          <div className="flex items-start gap-2">
                            {n.type === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-[#4EA858] flex-shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-[#D9822B] flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <div className="font-bold text-[#1F361C]">{n.title}</div>
                              <div className="text-[#462E1C]/80 mt-0.5 leading-relaxed">{n.message}</div>
                              <div className="text-[10px] text-[#7DA972] mt-1">{n.time}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Logged-In User Profile Card */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/90 border border-[#7DA972]/30 hover:border-[#5F8A55] transition-all shadow-sm cursor-pointer"
                >
                  {currentUser.avatar ? (
                    <img 
                      src={currentUser.avatar} 
                      alt={currentUser.name} 
                      className="w-8 h-8 rounded-full object-cover border border-[#5F8A55]/40"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                      currentUser.role === 'farmer' ? 'bg-[#2B4C26]' :
                      currentUser.role === 'merchant' || currentUser.role === 'retailer' ? 'bg-[#D9822B]' :
                      'bg-[#0284C7]'
                    }`}>
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-[#1F361C] flex items-center gap-1.5">
                      {currentUser.name}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        currentUser.role === 'farmer' ? 'bg-[#E6EFE3] text-[#2B4C26]' :
                        currentUser.role === 'merchant' || currentUser.role === 'retailer' ? 'bg-[#FDF3E3] text-[#D9822B]' :
                        'bg-[#E0F2FE] text-[#0369A1]'
                      }`}>
                        {currentUser.role === 'retailer' ? 'merchant' : currentUser.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#62432B]/80 truncate max-w-[120px]">
                      {currentUser.businessName || currentUser.email}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#462E1C]/60" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 ghibli-card-elevated p-3 z-50 shadow-2xl bg-white">
                    <div className="px-2 py-2 border-b border-[#7DA972]/20 mb-2">
                      <div className="font-bold text-sm text-[#1F361C]">{currentUser.name}</div>
                      <div className="text-xs text-[#5F8A55] font-medium">{currentUser.businessName}</div>
                      <div className="text-[11px] text-[#62432B]/80 mt-0.5">{currentUser.email}</div>
                      {currentUser.location && (
                        <div className="text-[10px] text-[#825D3E] mt-1 flex items-center gap-1">
                          📍 {currentUser.location}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <button
                        onClick={() => { setActiveView('dashboard'); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#E6EFE3] flex items-center gap-2 text-xs font-semibold text-[#1F361C] cursor-pointer"
                      >
                        {currentUser.role === 'farmer' && <Sprout className="w-4 h-4 text-[#4EA858]" />}
                        {(currentUser.role === 'merchant' || currentUser.role === 'retailer') && <Store className="w-4 h-4 text-[#D9822B]" />}
                        Go to My Dashboard
                      </button>
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#7DA972]/20">
                      <button
                        onClick={() => { logout(); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-red-50 text-red-700 flex items-center gap-2 text-xs font-bold cursor-pointer transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Logged out state */
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('auth')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#2B4C26] to-[#386332] text-white text-xs font-bold shadow-md hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Sign In / Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
