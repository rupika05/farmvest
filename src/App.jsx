import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FarmVestProvider, useFarmVest } from './context/FarmVestContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import NotificationToast from './components/common/NotificationToast';
import LeafFloatingEffect from './components/common/LeafFloatingEffect';

import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import FarmerDashboard from './components/farmer/FarmerDashboard';
import MerchantDashboard from './components/merchant/MerchantDashboard';
import OfficerDashboard from './components/admin/OfficerDashboard';
import PublicVerifyPage from './components/traceability/PublicVerifyPage';
import MasterQRCodeModal from './components/traceability/MasterQRCodeModal';

function MainLayout() {
  const { currentUser, activeView, setActiveView } = useAuth();
  const { selectedQrBatch, setSelectedQrBatch } = useFarmVest();

  // Handle URL-based routing for /verify/:batchId
  useEffect(() => {
    const hash = window.location.hash;
    const path = window.location.pathname;
    
    // Check both hash and path for /verify/:batchId
    const hashMatch = hash.match(/\/verify\/([^/?#]+)/);
    const pathMatch = path.match(/\/verify\/([^/?#]+)/);
    
    if (hashMatch || pathMatch) {
      setActiveView('verify');
    }
  }, []);

  // Listen for hash changes
  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/verify/')) {
        setActiveView('verify');
      }
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, [setActiveView]);

  const showNavbar = activeView !== 'auth' && activeView !== 'verify';
  const showFooter = activeView !== 'auth' && activeView !== 'verify' && activeView !== 'traceability';

  return (
    <div className="min-h-screen flex flex-col relative text-[#1F361C] selection:bg-[#7DA972]/30 bg-[#FAF7F0]">
      
      {/* Ambient floating leaves */}
      <LeafFloatingEffect />

      {/* Navbar (hidden on auth and verify pages) */}
      {showNavbar && <Navbar />}

      {/* Main content */}
      <main className="flex-1 relative z-10">
        
        {/* Landing page */}
        {activeView === 'landing' && <HomePage />}

        {/* Auth page */}
        {activeView === 'auth' && <AuthPage />}

        {/* Role dashboards */}
        {activeView === 'dashboard' && currentUser && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12">
            {currentUser.role === 'farmer'   && <FarmerDashboard />}
            {currentUser.role === 'merchant' && <MerchantDashboard />}
            {currentUser.role === 'retailer' && <MerchantDashboard />}
            {currentUser.role === 'officer'  && <OfficerDashboard />}
          </div>
        )}

        {/* Redirect if on dashboard without login */}
        {activeView === 'dashboard' && !currentUser && <AuthPage />}

        {/* Public QR Verification (no login needed) */}
        {activeView === 'verify' && <PublicVerifyPage />}

        {/* Legacy traceability page */}
        {activeView === 'traceability' && <PublicVerifyPage />}

      </main>

      {showFooter && <Footer />}

      {/* Toast notifications */}
      <NotificationToast />

      {/* QR Code Modal */}
      {selectedQrBatch && (
        <MasterQRCodeModal
          batch={selectedQrBatch}
          onClose={() => setSelectedQrBatch(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FarmVestProvider>
        <MainLayout />
      </FarmVestProvider>
    </AuthProvider>
  );
}
