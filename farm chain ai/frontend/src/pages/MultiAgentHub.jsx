import React, { useState } from 'react';
import { 
  Bot, Sparkles, Camera, QrCode, ShieldCheck, Layers, ArrowRight, 
  CheckCircle2, RefreshCw, Eye, Image as ImageIcon, Cpu, Terminal, 
  ExternalLink, BarChart3, Zap
} from 'lucide-react';
import LiveProduceScanner from '../components/LiveScanner/LiveProduceScanner';
import { CROPS_CONFIG } from '../config/crops';
import { translations } from '../locales/translations';
import './MultiAgentHub.css';

export default function MultiAgentHub({
  currentLang = 'ta',
  authenticatedUser = null,
  onNavigateToPassport = null,
  batches = []
}) {
  const t = translations[currentLang] || translations.en;
  const [activeSubTab, setActiveSubTab] = useState('scanner'); // 'scanner' | 'gallery' | 'logs'
  const [selectedCropFilter, setSelectedCropFilter] = useState(null);

  // Simulated live event communications between the 3 agents
  const [agentLogs, setAgentLogs] = useState([
    {
      id: 1,
      time: '14:20:12',
      sender: 'Agent 1 (Visual Consistency)',
      receiver: 'UI System',
      badge: 'Agent 1',
      badgeColor: 'emerald',
      message: 'Photorealistic image replacement complete: 11 studio-quality vegetable photographs synchronized across all portals.'
    },
    {
      id: 2,
      time: '14:20:25',
      sender: 'Agent 2 (Live Grading)',
      receiver: 'Hardware Subsystem',
      badge: 'Agent 2',
      badgeColor: 'sky',
      message: 'Live camera stream initialized. Ready for mobile environment back-cam and desktop webcams.'
    },
    {
      id: 3,
      time: '14:20:38',
      sender: 'Agent 3 (Blockchain & QR)',
      receiver: 'National Ledger',
      badge: 'Agent 3',
      badgeColor: 'amber',
      message: 'Cryptographic SHA-256 hash-chain engine standby. QR code deep-link generator online.'
    }
  ]);

  const handleBatchMinted = (newBatch) => {
    // Append inter-agent communication event
    const newLog1 = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      sender: 'Agent 2 (Live Grading)',
      receiver: 'Agent 3 (Blockchain & QR)',
      badge: 'Agent 2 ➔ 3',
      badgeColor: 'sky',
      message: `Grading payload dispatched for ${newBatch.crop}: Grade ${newBatch.grade} | Dynamic Price: ₹${newBatch.currentPrice}/kg`
    };
    const newLog2 = {
      id: Date.now() + 1,
      time: new Date().toLocaleTimeString(),
      sender: 'Agent 3 (Blockchain & QR)',
      receiver: 'Agent 1 (Visual Consistency)',
      badge: 'Agent 3 ➔ 1',
      badgeColor: 'amber',
      message: `Minted Genesis Block for ${newBatch.batchId}. Attached verified photorealistic asset and issued scannable QR pass.`
    };
    setAgentLogs(prev => [newLog2, newLog1, ...prev]);
  };

  return (
    <div className="multiagent-hub-page">
      {/* Executive Hero Banner */}
      <header className="multiagent-hero">
        <div className="hero-content">
          <div className="hero-pill-badge">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>AUTONOMOUS MULTIAGENT ARCHITECTURE</span>
          </div>
          <h1 className="hero-title">
            {currentLang === 'ta' 
              ? 'விளைபொருள் மேலாண்மை & விலை நிர்ணய பல முகவர் தளம்' 
              : 'Multiagent Produce Inspection, Dynamic Pricing & Ledger System'}
          </h1>
          <p className="hero-desc">
            {currentLang === 'ta'
              ? 'மூன்று பிரத்யேக AI முகவர்கள் இணைந்து செயல்படும் தளம்: முகவர் 1 நிஜ புகைப்படங்களை வழங்குகிறது, முகவர் 2 நேரலை கேமரா மூலம் தரம் நிர்ணயிக்கிறது, முகவர் 3 பிளாக்செயின் பதிவு மற்றும் QR குறியீட்டை உருவாக்குகிறது.'
              : 'A synchronized tripartite agent ecosystem: Agent 1 ensures visual consistency with studio photography, Agent 2 orchestrates real-time video grading with directional guidance, and Agent 3 seals cryptographic blockchain batches with scannable QR passes.'}
          </p>
        </div>
      </header>

      {/* The 3 Specialized Agents Cards Overview */}
      <section className="agents-trio-grid">
        {/* Agent 1 Card */}
        <div className="agent-card agent-1-card">
          <div className="card-top">
            <div className="agent-avatar emerald">
              <ImageIcon className="w-6 h-6" />
            </div>
            <span className="status-badge emerald">ACTIVE • 11 CROPS</span>
          </div>
          <h3 className="agent-card-title">Agent 1: Image Replacement Agent</h3>
          <p className="agent-card-sub">
            {currentLang === 'ta' 
              ? 'அனைத்து காய்கறிகளுக்கும் சீரான ஸ்டுடியோ தர புகைப்படங்கள்' 
              : 'Photorealistic Studio Photography & Visual Consistency'}
          </p>
          <ul className="agent-features-list">
            <li>Replaced all generic emoji/icons with 8K studio vegetable photography</li>
            <li>Consistent lighting, clean slate background, and dewy freshness</li>
            <li>Injected across Farmer, Mandi, and Citizen Provenance views</li>
          </ul>
        </div>

        {/* Agent 2 Card */}
        <div className="agent-card agent-2-card">
          <div className="card-top">
            <div className="agent-avatar sky">
              <Camera className="w-6 h-6" />
            </div>
            <span className="status-badge sky">ACTIVE • GEMINI VISION</span>
          </div>
          <h3 className="agent-card-title">Agent 2: Live Scanning & Grading Agent</h3>
          <p className="agent-card-sub">
            {currentLang === 'ta' 
              ? 'நேரலை கேமரா ஆய்வு & வழிகாட்டுதலுடன் தர மதிப்பீடு' 
              : 'Real-Time Camera HUD, Directional Cues & Dynamic Pricing'}
          </p>
          <ul className="agent-features-list">
            <li>Mobile environment back-cam and desktop external webcam support</li>
            <li>Real-time directional guidance: "Move closer", "Rotate 45°", "Check calyx"</li>
            <li>Dynamic pricing: Grade-A (+15% Premium), Grade-C (-20% Markdown)</li>
          </ul>
        </div>

        {/* Agent 3 Card */}
        <div className="agent-card agent-3-card">
          <div className="card-top">
            <div className="agent-avatar amber">
              <QrCode className="w-6 h-6" />
            </div>
            <span className="status-badge amber">ACTIVE • SHA-256 LEDGER</span>
          </div>
          <h3 className="agent-card-title">Agent 3: Blockchain & QR Ledger Agent</h3>
          <p className="agent-card-sub">
            {currentLang === 'ta' 
              ? 'கிரிப்டோகிராபிக் பதிவு & விரைவு QR பாஸ் உருவாக்கம்' 
              : 'Cryptographic SHA-256 Batch Minting & QR Generation'}
          </p>
          <ul className="agent-features-list">
            <li>Mints Genesis Block #0 with verifiable SHA-256 hash linkage</li>
            <li>Embeds FSSAI, AGMARK, temperature, and pesticide compliance records</li>
            <li>Deep-linked QR code redirects directly to Citizen Provenance Passport</li>
          </ul>
        </div>
      </section>

      {/* Main Operational Tabs */}
      <div className="hub-tabs-bar">
        <button
          type="button"
          className={`hub-tab-btn ${activeSubTab === 'scanner' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('scanner')}
        >
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>{currentLang === 'ta' ? 'நேரலை கேமரா & AI தர ஆய்வு (Agent 2 & 3)' : 'Live Camera Scanner & Grading (Agent 2 & 3)'}</span>
        </button>

        <button
          type="button"
          className={`hub-tab-btn ${activeSubTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('gallery')}
        >
          <ImageIcon className="w-4 h-4 text-sky-400" />
          <span>{currentLang === 'ta' ? 'நிஜ காய்கறி புகைப்படத் தொகுப்பு (Agent 1)' : 'Photorealistic Produce Gallery (Agent 1)'}</span>
        </button>

        <button
          type="button"
          className={`hub-tab-btn ${activeSubTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('logs')}
        >
          <Terminal className="w-4 h-4 text-amber-400" />
          <span>{currentLang === 'ta' ? 'முகவர்கள் தொடர்பு பதிவு (Agent Comms)' : 'Inter-Agent Event Stream'}</span>
        </button>
      </div>

      {/* Tab 1: Live Produce Scanner (Agent 2 & 3 in action) */}
      {activeSubTab === 'scanner' && (
        <section className="hub-section">
          <LiveProduceScanner
            currentLang={currentLang}
            authenticatedUser={authenticatedUser}
            onBatchMinted={handleBatchMinted}
            onNavigateToPassport={onNavigateToPassport}
          />
        </section>
      )}

      {/* Tab 2: Agent 1 Photorealistic Produce Gallery */}
      {activeSubTab === 'gallery' && (
        <section className="hub-section">
          <div className="gallery-header-box">
            <div>
              <h2 className="section-title">Agent 1: Visual Consistency Catalog</h2>
              <p className="section-desc">
                High-resolution studio photography replacing generic placeholder icons across the entire platform.
              </p>
            </div>
            <span className="gallery-count-badge">{CROPS_CONFIG.length} Studio-Lit Produce Assets</span>
          </div>

          <div className="produce-photo-grid">
            {CROPS_CONFIG.map(crop => (
              <div key={crop.id} className="produce-photo-card">
                <div className="photo-frame">
                  <img src={crop.image} alt={crop.name} className="gallery-img" />
                  <span className="photo-crop-badge" style={{ backgroundColor: crop.color }}>
                    {crop.icon} {crop.name}
                  </span>
                </div>
                <div className="photo-card-body">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="crop-title-en">{crop.name}</h4>
                    <span className="crop-price-badge">₹{crop.defaultPrice}/kg</span>
                  </div>
                  <div className="crop-meta-row">
                    <span className="tamil-label">{crop.ta}</span>
                    <span className="botanical-label"><em>{crop.scientificName}</em></span>
                  </div>
                  <div className="crop-specs">
                    <span>Family: {crop.category}</span>
                    <span>Shelf Life: ~{crop.shelfLifeDays} days</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab 3: Inter-Agent Event Stream */}
      {activeSubTab === 'logs' && (
        <section className="hub-section">
          <div className="logs-container">
            <div className="logs-head">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h3 className="logs-title">Multiagent Synchronous Event Stream</h3>
              </div>
              <span className="live-pulse-badge">🔴 LIVE LOG</span>
            </div>

            <div className="logs-timeline">
              {agentLogs.map(log => (
                <div key={log.id} className="log-row">
                  <span className="log-time">{log.time}</span>
                  <span className={`log-badge ${log.badgeColor}`}>{log.badge}</span>
                  <div className="log-content">
                    <span className="log-parties">{log.sender} ➔ {log.receiver}</span>
                    <p className="log-msg">{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
