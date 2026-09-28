import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FarmVestProvider, useFarmVest } from './context/FarmVestContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import NotificationToast from './components/common/NotificationToast';
import LeafFloatingEffect from './components/common/LeafFloatingEffect';

import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import FarmerDashboard from './components/farmer/FarmerDashboard';
import RetailerMarketplace from './components/retailer/RetailerMarketplace';
import DriverDashboard from './components/driver/DriverDashboard';
import PublicTraceabilityPage from './components/traceability/PublicTraceabilityPage';
import MasterQRCodeModal from './components/traceability/MasterQRCodeModal';

function MainLayout() {
  const { currentUser, activeView, setActiveView } = useAuth();
  const { selectedQrBatch, setSelectedQrBatch } = useFarmVest();

  return (
    <div className="min-h-screen flex flex-col relative text-[#1F361C] selection:bg-[#7DA972]/30 bg-[#FAF7F0]">
      
      {/* Subtle Ghibli ambient floating leaves */}
      <LeafFloatingEffect />

      {/* Role-Aware Sticky Navigation Bar */}
      {activeView !== 'auth' && <Navbar />}

      {/* Dynamic Main Body */}
      <main className="flex-1 relative z-10">
        
        {/* 1. Simplified Home Page */}
        {activeView === 'landing' && (
          <HomePage />
        )}

        {/* 2. Role Selection & Authentication Page */}
        {activeView === 'auth' && (
          <AuthPage />
        )}

        {/* 3. Role-specific Dashboard for Logged In User */}
        {activeView === 'dashboard' && currentUser && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12">
            {currentUser.role === 'farmer' && <FarmerDashboard />}
            {currentUser.role === 'retailer' && <RetailerMarketplace />}
            {currentUser.role === 'driver' && <DriverDashboard />}
          </div>
        )}

        {/* Fallback if on dashboard view without logged in user */}
        {activeView === 'dashboard' && !currentUser && (
          <AuthPage />
        )}

        {/* 4. Public Master QR Final Harvest Journey Certificate */}
        {activeView === 'traceability' && (
          <PublicTraceabilityPage />
        )}
      </main>

      {/* Footer (displayed on landing and dashboards) */}
      {activeView !== 'auth' && activeView !== 'traceability' && <Footer />}

      {/* Interactive Toast Notifications */}
      <NotificationToast />

      {/* Master QR Code Tag Modal */}
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
