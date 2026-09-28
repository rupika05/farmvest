import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import FarmVestLogo from '../components/common/FarmVestLogo';
import { 
  Sprout, 
  Truck, 
  Store, 
  ArrowRight, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

export default function AuthPage() {
  const { 
    login, 
    register,
    loading,
    authTargetRole, 
    setAuthTargetRole, 
    setActiveView 
  } = useAuth();

  const [activeTab, setActiveTab] = useState(authTargetRole || 'farmer'); // 'farmer', 'driver', 'retailer'
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  // Form states - ALWAYS start completely empty with NO default prefilled data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  useEffect(() => {
    if (authTargetRole) {
      setActiveTab(authTargetRole);
    }
  }, [authTargetRole]);

  // Clear inputs and error on tab change
  useEffect(() => {
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setBusinessName('');
    setLocation('');
    setVehicle('');
    setVehicleNumber('');
  }, [activeTab, isSignUp]);

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
        businessName: businessName.trim() || (activeTab === 'farmer' ? `${name}'s Farm` : activeTab === 'retailer' ? `${name}'s Supermarket` : `${name} Logistics`),
        location: location.trim() || '',
        vehicle: activeTab === 'driver' ? vehicle.trim() : undefined,
        vehicleNumber: activeTab === 'driver' ? vehicleNumber.trim() : undefined
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
      
      {/* Back button to Home */}
      <button
        onClick={() => setActiveView('landing')}
        className="absolute top-6 left-6 px-4 py-2 rounded-xl bg-white border border-[#7DA972]/40 text-xs font-bold text-[#1F361C] hover:bg-[#E6EFE3] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home Page
      </button>

      <div className="w-full max-w-lg space-y-6">
        
        {/* Brand Logo */}
        <div className="flex justify-center">
          <FarmVestLogo size="lg" showTagline={true} />
        </div>

        {/* Card Container */}
        <div className="ghibli-card-elevated p-6 sm:p-8 bg-white border-[#7DA972]/40 shadow-2xl space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-1">
            <h2 className="font-display font-extrabold text-2xl text-[#1F361C]">
              {isSignUp ? 'Create FarmVest Account' : 'Sign In to FarmVest'}
            </h2>
            <p className="text-xs text-[#62432B]/80">
              Select your role first, then enter your login credentials
            </p>
          </div>

          {/* STEP 1: SELECT YOUR ROLE FIRST */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-[#1F361C] uppercase tracking-wider block text-center">
              1. Select Your Role:
            </label>
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#FAF7F0] border border-[#7DA972]/30">
              <button
                type="button"
                onClick={() => { setActiveTab('farmer'); setAuthTargetRole('farmer'); }}
                className={`py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'farmer'
                    ? 'bg-[#2B4C26] text-white shadow-md scale-[1.02]'
                    : 'text-[#2B4C26] hover:bg-white'
                }`}
              >
                <span className="text-lg">🌾</span>
                <span>Farmer</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('driver'); setAuthTargetRole('driver'); }}
                className={`py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'driver'
                    ? 'bg-[#D9822B] text-white shadow-md scale-[1.02]'
                    : 'text-[#D9822B] hover:bg-white'
                }`}
              >
                <span className="text-lg">🚚</span>
                <span>Driver</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('retailer'); setAuthTargetRole('retailer'); }}
                className={`py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'retailer'
                    ? 'bg-[#0284C7] text-white shadow-md scale-[1.02]'
                    : 'text-[#0284C7] hover:bg-white'
                }`}
              >
                <span className="text-lg">🏪</span>
                <span>Retailer</span>
              </button>
            </div>
          </div>

          {/* Role Description Banner */}
          <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            activeTab === 'farmer' ? 'bg-[#E6EFE3] border-[#7DA972]/40 text-[#2B4C26]' :
            activeTab === 'driver' ? 'bg-[#FDF3E3] border-[#F6D28B] text-[#D9822B]' :
            'bg-[#E0F2FE] border-[#BAE6FD] text-[#0369A1]'
          }`}>
            <span className="font-bold">
              {activeTab === 'farmer' && '🌾 Logging in as Farmer: Manage crops for sale, upload harvest for AI grading & handover.'}
              {activeTab === 'driver' && '🚚 Logging in as Driver: Receive pickup orders, live GPS transit & earn per delivery.'}
              {activeTab === 'retailer' && '🏪 Logging in as Retailer: Browse marketplace, AI dynamic pricing & check-in scan.'}
            </span>
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 2: EMAIL & PASSWORD FORM (EMPTY BY DEFAULT) */}
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
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#7DA972]/30 text-xs focus:outline-none focus:border-[#2B4C26] bg-[#FAF7F0]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1F361C]">
                    {activeTab === 'farmer' ? 'Farm / Collective Name' : activeTab === 'retailer' ? 'Supermarket / Store Name' : 'Logistics Provider Name'}
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#7DA972]/30 text-xs focus:outline-none focus:border-[#2B4C26] bg-[#FAF7F0]"
                  />
                </div>

                {activeTab === 'driver' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1F361C]">Vehicle Model</label>
                      <input
                        type="text"
                        value={vehicle}
                        onChange={(e) => setVehicle(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#7DA972]/30 text-xs focus:outline-none focus:border-[#2B4C26] bg-[#FAF7F0]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#1F361C]">Vehicle Number</label>
                      <input
                        type="text"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#7DA972]/30 text-xs focus:outline-none focus:border-[#2B4C26] bg-[#FAF7F0]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1F361C]">
                      {activeTab === 'farmer' ? 'Farm Location & Village' : 'Store Address / City'}
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-[#5F8A55] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#7DA972]/30 text-xs focus:outline-none focus:border-[#2B4C26] bg-[#FAF7F0]"
                      />
                    </div>
                  </div>
                )}
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
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#7DA972]/30 text-xs focus:outline-none focus:border-[#2B4C26] bg-[#FAF7F0]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-wait ${
                activeTab === 'farmer' ? 'bg-gradient-to-r from-[#2B4C26] to-[#386332]' :
                activeTab === 'driver' ? 'bg-gradient-to-r from-[#D9822B] to-[#c27020]' :
                'bg-gradient-to-r from-[#0284C7] to-[#0369A1]'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" /></svg> Please wait...</span>
              ) : (
                <><span>{isSignUp ? `Create ${activeTab} Account` : `Sign In as ${activeTab}`}</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Toggle between Sign In and Sign Up */}
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

        </div>

      </div>
    </div>
  );
}
