import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import FarmVestLogo from '../components/common/FarmVestLogo';
import { 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  AlertCircle,
  ArrowLeft,
  Sprout,
  Store,
  ShieldCheck
} from 'lucide-react';

const ROLES = [
  {
    key: 'farmer',
    label: 'Farmer',
    emoji: '🌾',
    color: '#2B4C26',
    bg: 'bg-[#2B4C26]',
    hover: 'hover:bg-[#E6EFE3]',
    textColor: 'text-[#2B4C26]',
    infoBg: 'bg-[#E6EFE3]',
    infoBorder: 'border-[#7DA972]/40',
    infoText: 'text-[#2B4C26]',
    btnGradient: 'bg-gradient-to-r from-[#2B4C26] to-[#386332]',
    desc: '🌾 Logging in as Farmer: Add produce, run AI quality grading, create batches & generate QR product passports.'
  },
  {
    key: 'merchant',
    label: 'Merchant',
    emoji: '🏪',
    color: '#D9822B',
    bg: 'bg-[#D9822B]',
    hover: 'hover:bg-[#FDF3E3]',
    textColor: 'text-[#D9822B]',
    infoBg: 'bg-[#FDF3E3]',
    infoBorder: 'border-[#F6D28B]',
    infoText: 'text-[#D9822B]',
    btnGradient: 'bg-gradient-to-r from-[#D9822B] to-[#c27020]',
    desc: '🏪 Logging in as Merchant: Browse verified marketplace, view AI quality certificates & place orders with custody handovers.'
  },
  {
    key: 'officer',
    label: 'Officer',
    emoji: '🛡️',
    color: '#0284C7',
    bg: 'bg-[#0284C7]',
    hover: 'hover:bg-[#E0F2FE]',
    textColor: 'text-[#0284C7]',
    infoBg: 'bg-[#E0F2FE]',
    infoBorder: 'border-[#BAE6FD]',
    infoText: 'text-[#0369A1]',
    btnGradient: 'bg-gradient-to-r from-[#0284C7] to-[#0369A1]',
    desc: '🛡️ Logging in as Officer: Monitor supply chains, verify hash-chain integrity, audit batches & ensure compliance.'
  }
];

export default function AuthPage() {
  const { 
    login, 
    register,
    loading,
    authTargetRole, 
    setAuthTargetRole, 
    setActiveView 
  } = useAuth();

  const [activeTab, setActiveTab] = useState(authTargetRole || 'farmer');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (authTargetRole && ROLES.find(r => r.key === authTargetRole)) {
      setActiveTab(authTargetRole);
    }
  }, [authTargetRole]);

  useEffect(() => {
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setBusinessName('');
    setLocation('');
  }, [activeTab, isSignUp]);

  const activeRole = ROLES.find(r => r.key === activeTab) || ROLES[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isSignUp) {
      if (!name.trim() || !email.trim() || !password.trim()) {
        setError('Please fill in all required fields (Name, Email, and Password).');
        return;
      }
      const res = await register({
        role: activeTab,
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        phone: phone.trim() || '',
        businessName: businessName.trim() || (
          activeTab === 'farmer' ? `${name}'s Farm` :
          activeTab === 'merchant' ? `${name}'s Store` :
          `${name} Authority`
        ),
        location: location.trim() || '',
      });
      if (!res.success) setError(res.error);
    } else {
      if (!email.trim() || !password.trim()) {
        setError('Please enter your email and password.');
        return;
      }
      const res = await login(email.trim(), password.trim(), activeTab);
      if (!res.success) setError(res.error);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center bg-[#FAF7F0] relative">
      
      {/* Back button */}
      <button
        onClick={() => setActiveView('landing')}
        className="absolute top-6 left-6 px-4 py-2 rounded-xl bg-white border border-[#7DA972]/40 text-xs font-bold text-[#1F361C] hover:bg-[#E6EFE3] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <div className="w-full max-w-lg space-y-6">
        
        {/* Brand Logo */}
        <div className="flex justify-center">
          <FarmVestLogo size="lg" showTagline={true} />
        </div>

        {/* Card */}
        <div className="ghibli-card-elevated p-6 sm:p-8 bg-white border-[#7DA972]/40 shadow-2xl space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-1">
            <h2 className="font-display font-extrabold text-2xl text-[#1F361C]">
              {isSignUp ? 'Create FarmVest Account' : 'Sign In to FarmVest'}
            </h2>
            <p className="text-xs text-[#62432B]/80">
              Select your role, then enter your credentials
            </p>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-[#1F361C] uppercase tracking-wider block text-center">
              1. Select Your Role:
            </label>
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#FAF7F0] border border-[#7DA972]/30">
              {ROLES.map((role) => (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => { setActiveTab(role.key); setAuthTargetRole(role.key); }}
                  className={`py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    activeTab === role.key
                      ? `${role.bg} text-white shadow-md scale-[1.02]`
                      : `${role.textColor} ${role.hover}`
                  }`}
                >
                  <span className="text-lg">{role.emoji}</span>
                  <span>{role.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Role Description Banner */}
          <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${activeRole.infoBg} ${activeRole.infoBorder} ${activeRole.infoText}`}>
            <span className="font-semibold leading-relaxed">{activeRole.desc}</span>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isSignUp && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1F361C]">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#5F8A55] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#7DA972]/30 text-xs focus:outline-none focus:border-[#2B4C26] bg-[#FAF7F0]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1F361C]">
                    {activeTab === 'farmer' ? 'Farm / Collective Name' :
                     activeTab === 'merchant' ? 'Business / Store Name' :
                     'Organisation / Authority Name'}
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Optional — leave blank for auto-fill"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#7DA972]/30 text-xs focus:outline-none focus:border-[#2B4C26] bg-[#FAF7F0]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1F361C]">
                    {activeTab === 'farmer' ? 'Farm Location' :
                     activeTab === 'merchant' ? 'Store / City Location' :
                     'Office / Jurisdiction Location'}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#5F8A55] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, district or address"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#7DA972]/30 text-xs focus:outline-none focus:border-[#2B4C26] bg-[#FAF7F0]"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1F361C]">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#5F8A55] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#7DA972]/30 text-xs focus:outline-none focus:border-[#2B4C26] bg-[#FAF7F0]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1F361C]">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#5F8A55] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#7DA972]/30 text-xs focus:outline-none focus:border-[#2B4C26] bg-[#FAF7F0]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-wait ${activeRole.btnGradient}`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" />
                  </svg>
                  Please wait...
                </span>
              ) : (
                <>
                  <span>{isSignUp ? `Create ${activeRole.label} Account` : `Sign In as ${activeRole.label}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Sign In / Sign Up */}
          <div className="pt-2 text-center text-xs text-[#62432B] border-t border-[#7DA972]/20">
            {isSignUp ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="font-bold text-[#2B4C26] hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                New to FarmVest?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="font-bold text-[#2B4C26] hover:underline cursor-pointer"
                >
                  Register New Account
                </button>
              </span>
            )}
          </div>

          {/* Consumer note */}
          <div className="pt-1 text-center text-[10px] text-[#62432B]/60 border-t border-[#7DA972]/10">
            🛒 Consumers: Scan a product QR code to view the product passport — no login required.
          </div>

        </div>
      </div>
    </div>
  );
}
