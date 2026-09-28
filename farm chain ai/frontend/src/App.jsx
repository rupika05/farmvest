import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Ticker from './components/Ticker';
import LoginPortal from './pages/LoginPortal';
import FarmerPortal from './pages/FarmerPortal';
import TransferPortal from './pages/TransferPortal';
import ConsumerTracker from './pages/ConsumerTracker';
import AdminDashboard from './pages/AdminDashboard';
import MultiAgentHub from './pages/MultiAgentHub';
import { getAllBatches } from './services/api';
import useSeo from './hooks/useSeo';

export default function App() {
  const [activeTab, setActiveTab] = useState('farmer');
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  
  // Default to Tamil (or English/Hindi)
  const [currentLang, setCurrentLang] = useState('ta');

  // Authenticated user session state (initialized from localStorage if present)
  const [authenticatedUser, setAuthenticatedUser] = useState(() => {
    try {
      const saved = localStorage.getItem('farmchain_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Public visitor mode (allows citizen crawling and QR code scan provenance view)
  const [isPublicVisitor, setIsPublicVisitor] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      return path.startsWith('/track/') || params.get('tab') === 'consumer' || params.get('tab') === 'ledger' || params.get('public') === 'true';
    }
    return false;
  });

  // Check URL pathname for /track/:batchId deep link
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/track/')) {
      const idFromUrl = path.replace('/track/', '').trim();
      if (idFromUrl) {
        setSelectedBatchId(idFromUrl);
        setActiveTab('consumer');
        setIsPublicVisitor(true);
      }
    }
  }, []);

  // SEO & Head Metadata Dynamic Management
  const seoConfig = {
    farmer: {
      title: 'உழவர் டிஜிட்டல் பாஸ் பதிவு | FarmChain AI Farmer Mandi Portal',
      description: 'Register farm produce batches, fetch real-time APMC mandi benchmarks, and mint cryptographic SHA-256 genesis blocks.',
      path: '/?tab=farmer'
    },
    transfer: {
      title: 'மண்டி கைமாற்றம் & AI தர சோதனை | FarmChain AI Custody Transfer',
      description: 'Record APMC mandi custody transfer with neural network produce damage classification and automated 20% discount adjustments.',
      path: '/?tab=transfer'
    },
    consumer: {
      title: selectedBatchId 
        ? `விளைபொருள் பாஸ்போர்ட் (${selectedBatchId}) | FarmChain AI Citizen Passport`
        : 'நுகர்வோர் சரிபார்ப்பு பாஸ்போர்ட் | FarmChain AI Citizen Provenance Passport',
      description: 'Verify end-to-end farm-to-table provenance, harvest timestamps, and tamper-evident SHA-256 ledger integrity.',
      path: selectedBatchId ? `/track/${selectedBatchId}` : '/?tab=consumer'
    },
    admin: {
      title: 'அரசு தணிக்கை மற்றும் மண்டி புள்ளிவிவரங்கள் | FarmChain AI Regulatory Dashboard',
      description: 'State-level APMC metrics, ledger health monitoring, and automated cryptographic audit compliance.',
      path: '/?tab=admin'
    },
    multiagent: {
      title: 'AI பல முகவர் ஆய்வு மையம் | FarmChain AI Multi-Agent Orchestration Hub',
      description: 'Autonomous tripartite agricultural agents: Agent 1 (Visual Consistency), Agent 2 (Live Vision & Voice Scanner), Agent 3 (QR & Blockchain Ledger).',
      path: '/?tab=multiagent'
    }
  };

  const activeSeo = (!authenticatedUser && !isPublicVisitor)
    ? {
        title: 'இ-சேவை உழவர் தளம் | FarmChain AI Krishi Authentication Portal',
        description: 'Official evaluation prototype for agricultural traceability, digital mandi passes, and cryptographic crop quality grading.',
        path: '/'
      }
    : (seoConfig[activeTab] || seoConfig.consumer);

  useSeo(activeSeo);

  const refreshBatches = async () => {
    try {
      const res = await getAllBatches();
      if (res?.batches) {
        setBatches(res.batches);
        if (!selectedBatchId && res.batches.length > 0) {
          setSelectedBatchId(res.batches[0].batchId);
        }
      }
    } catch (err) {
      console.error('Failed to load batches:', err);
    }
  };

  useEffect(() => {
    refreshBatches();
  }, []);

  const handleBatchCreated = (newBatchId) => {
    setSelectedBatchId(newBatchId);
    refreshBatches();
  };

  const handleTransferCompleted = (batchId) => {
    setSelectedBatchId(batchId);
    refreshBatches();
  };

  const handleLoginSuccess = (user) => {
    setAuthenticatedUser(user);
    setIsPublicVisitor(false);
    try {
      localStorage.setItem('farmchain_user', JSON.stringify(user));
    } catch (e) {
      console.error('Error saving user session:', e);
    }

    if (user?.role === 'admin') {
      setActiveTab('admin');
    } else if (user?.role === 'trader') {
      setActiveTab('transfer');
    } else {
      setActiveTab('farmer');
    }
  };

  const handleLogout = () => {
    setAuthenticatedUser(null);
    setIsPublicVisitor(false);
    try {
      localStorage.removeItem('farmchain_user');
    } catch (e) {
      console.error('Error removing user session:', e);
    }
  };

  // If user is not authenticated and hasn't selected public citizen mode, gate with Login & Verification portal
  if (!authenticatedUser && !isPublicVisitor) {
    return (
      <LoginPortal
        currentLang={currentLang}
        setLanguage={setCurrentLang}
        onLoginSuccess={handleLoginSuccess}
        onEnterAsCitizen={() => {
          setIsPublicVisitor(true);
          setActiveTab('consumer');
        }}
      />
    );
  }

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        batches={batches}
        selectedBatchId={selectedBatchId}
        setSelectedBatchId={setSelectedBatchId}
        currentLang={currentLang}
        setLanguage={setCurrentLang}
        authenticatedUser={authenticatedUser}
        onLogout={handleLogout}
        onOpenLogin={() => setIsPublicVisitor(false)}
      />

      <Ticker currentLang={currentLang} />

      <main className="main-content">
        {activeTab === 'farmer' && (
          <FarmerPortal
            currentLang={currentLang}
            setLanguage={setCurrentLang}
            authenticatedUser={authenticatedUser}
            onBatchCreated={handleBatchCreated}
            onNavigateTransfer={(id) => {
              setSelectedBatchId(id);
              setActiveTab('transfer');
            }}
            onNavigateTrack={(id) => {
              setSelectedBatchId(id);
              setActiveTab('consumer');
            }}
            onNavigateMultiagent={() => setActiveTab('multiagent')}
          />
        )}

        {activeTab === 'transfer' && (
          <TransferPortal
            initialBatchId={selectedBatchId}
            batches={batches}
            currentLang={currentLang}
            onTransferCompleted={handleTransferCompleted}
            onNavigateTrack={(id) => {
              setSelectedBatchId(id);
              setActiveTab('consumer');
            }}
          />
        )}

        {activeTab === 'consumer' && (
          <ConsumerTracker
            batchId={selectedBatchId}
            batches={batches}
            currentLang={currentLang}
            onSelectBatch={(id) => setSelectedBatchId(id)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            batches={batches}
            currentLang={currentLang}
            onSelectBatch={(id) => setSelectedBatchId(id)}
            onRefreshBatches={refreshBatches}
          />
        )}

        {activeTab === 'multiagent' && (
          <MultiAgentHub
            currentLang={currentLang}
            authenticatedUser={authenticatedUser}
            batches={batches}
            onBatchMinted={(batchId) => {
              setSelectedBatchId(batchId);
              refreshBatches();
            }}
            onNavigateToPassport={(batchId) => {
              setSelectedBatchId(batchId);
              setActiveTab('consumer');
            }}
          />
        )}
      </main>

      {/* Official Government Footer */}
      <footer className="govt-footer">
        <div className="govt-footer-inner">
          <div className="footer-left">
            <strong>தேசிய உழவர் ஒளிவுமறைவற்ற தளம் | National Krishi Transparency Portal</strong>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
              Ministry of Agriculture & Farmers Welfare, Government of India • Digital India Portal
            </p>
          </div>
          <div className="footer-badges">
            <span className="footer-tag">🇮🇳 e-NAM Integrated</span>
            <span className="footer-tag">SHA-256 Ledger Verified</span>
            <span className="footer-tag">APMC Mandi Network</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
