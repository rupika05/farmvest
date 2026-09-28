import React, { useState } from 'react';
import { 
  Sprout, ArrowRightLeft, ShieldCheck, Database, Globe, Check, 
  LogOut, Bot, Info, X, ExternalLink, Sparkles, CheckCircle2, ChevronDown
} from 'lucide-react';
import TnEmblem from './TnEmblem';
import { translations } from '../locales/translations';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  batches = [], 
  selectedBatchId, 
  setSelectedBatchId,
  currentLang = 'ta',
  setLanguage,
  authenticatedUser,
  onLogout,
  onOpenLogin
}) {
  const t = translations[currentLang] || translations.en;
  const [fontSizeScale, setFontSizeScale] = useState('normal'); // 'small' | 'normal' | 'large'
  const [showAboutModal, setShowAboutModal] = useState(false);

  const languages = [
    { code: 'ta', label: 'தமிழ்' },
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' }
  ];

  const handleFontSize = (scale) => {
    setFontSizeScale(scale);
    if (scale === 'small') {
      document.documentElement.style.fontSize = '14px';
    } else if (scale === 'large') {
      document.documentElement.style.fontSize = '18px';
    } else {
      document.documentElement.style.fontSize = '16px';
    }
  };

  return (
    <>
      <header className="minimal-govt-header">
        <div className="minimal-header-container">
          
          {/* 1. Brand & Description Block */}
          <div className="minimal-brand-group">
            <button 
              type="button" 
              className="brand-logo-btn" 
              onClick={() => setActiveTab('farmer')}
              title="FarmChain AI — Home"
            >
              <TnEmblem size={34} className="minimal-crest" />
              <div className="brand-text-col">
                <div className="brand-title-row">
                  <span className="brand-title">FarmChain AI</span>
                  <span className="brand-badge-poc">GovTech PoC</span>
                </div>
                <span className="brand-description-line">
                  {t.portalShortDesc || 'National Agricultural Traceability & Quality Ledger'}
                </span>
              </div>
            </button>

            {/* Platform Description Info Trigger */}
            <button
              type="button"
              className="minimal-info-trigger"
              onClick={() => setShowAboutModal(true)}
              title={currentLang === 'ta' ? 'தளம் பற்றிய விவரம்' : currentLang === 'hi' ? 'प्लेटफॉर्म विवरण' : 'About Platform'}
            >
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              <span className="info-trigger-label">
                {currentLang === 'ta' ? 'விவரம்' : currentLang === 'hi' ? 'विवरण' : 'About'}
              </span>
            </button>
          </div>

          {/* 2. Main Navigation Tabs */}
          <nav className="minimal-nav" role="navigation" aria-label="Main Navigation">
            <button
              id="tab-farmer"
              role="tab"
              aria-selected={activeTab === 'farmer'}
              className={`minimal-tab ${activeTab === 'farmer' ? 'active' : ''}`}
              onClick={() => setActiveTab('farmer')}
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>{currentLang === 'ta' ? 'உழவர் பாஸ்' : t.tabFarmer}</span>
            </button>

            <button
              id="tab-transfer"
              role="tab"
              aria-selected={activeTab === 'transfer'}
              className={`minimal-tab ${activeTab === 'transfer' ? 'active' : ''}`}
              onClick={() => setActiveTab('transfer')}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{currentLang === 'ta' ? 'மண்டி மாற்றம்' : t.tabTransfer}</span>
            </button>

            <button
              id="tab-consumer"
              role="tab"
              aria-selected={activeTab === 'consumer'}
              className={`minimal-tab ${activeTab === 'consumer' ? 'active' : ''}`}
              onClick={() => setActiveTab('consumer')}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{currentLang === 'ta' ? 'நுகர்வோர் பார்வை' : t.tabConsumer}</span>
            </button>

            <button
              id="tab-admin"
              role="tab"
              aria-selected={activeTab === 'admin'}
              className={`minimal-tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{currentLang === 'ta' ? 'அரசு தணிக்கை' : t.tabAdmin}</span>
            </button>

            <button
              id="tab-multiagent"
              role="tab"
              aria-selected={activeTab === 'multiagent'}
              className={`minimal-tab multiagent ${activeTab === 'multiagent' ? 'active' : ''}`}
              onClick={() => setActiveTab('multiagent')}
              title={t.tabMultiagentDesc}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{t.tabMultiagent || (currentLang === 'ta' ? 'பல முகவர்' : 'Multiagent')}</span>
            </button>
          </nav>

          {/* 3. Utility & User Controls */}
          <div className="minimal-utility-group">
            
            {/* Batch Selector */}
            {batches.length > 0 && (
              <div className="minimal-batch-select">
                <span className="batch-select-label">
                  {currentLang === 'ta' ? 'பாஸ்:' : currentLang === 'hi' ? 'बैच:' : 'Pass:'}
                </span>
                <select
                  id="global-batch-select"
                  value={selectedBatchId || ''}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                >
                  {batches.map((b) => (
                    <option key={b.batchId} value={b.batchId}>
                      {b.batchId} ({b.crop})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Language Switcher */}
            <div className="minimal-lang-switcher" role="group" aria-label="Language selection">
              {languages.map((l) => (
                <button
                  key={l.code}
                  id={`btn-nav-lang-${l.code}`}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  className={`lang-pill ${currentLang === l.code ? 'active' : ''}`}
                  title={`Switch to ${l.label}`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Accessibility Font Resizer */}
            <div className="minimal-font-scaler" title="Text Resizer">
              <button 
                type="button" 
                onClick={() => handleFontSize('small')} 
                className={`scale-btn ${fontSizeScale === 'small' ? 'active' : ''}`}
              >
                A-
              </button>
              <button 
                type="button" 
                onClick={() => handleFontSize('normal')} 
                className={`scale-btn ${fontSizeScale === 'normal' ? 'active' : ''}`}
              >
                A
              </button>
              <button 
                type="button" 
                onClick={() => handleFontSize('large')} 
                className={`scale-btn ${fontSizeScale === 'large' ? 'active' : ''}`}
              >
                A+
              </button>
            </div>

            {/* User Session Profile or Citizen Guest */}
            {authenticatedUser ? (
              <div className="minimal-user-badge" id="user-profile-badge">
                <span className="user-icon">
                  {authenticatedUser.role === 'admin' ? '🏛️' : authenticatedUser.role === 'trader' ? '🏪' : '👨‍🌾'}
                </span>
                <span className="user-name">{authenticatedUser.name}</span>
                {onLogout && (
                  <button
                    id="btn-logout"
                    type="button"
                    onClick={onLogout}
                    className="minimal-logout-btn"
                    title={currentLang === 'ta' ? 'வெளியேறு' : currentLang === 'hi' ? 'लॉग आउट' : 'Logout'}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="minimal-guest-actions">
                <span className="citizen-pill">
                  👁️ {currentLang === 'ta' ? 'பொது பார்வை' : 'Citizen'}
                </span>
                {onOpenLogin && (
                  <button
                    type="button"
                    id="btn-mandi-login-nav"
                    onClick={onOpenLogin}
                    className="minimal-login-nav-btn"
                  >
                    <span>🔑 {currentLang === 'ta' ? 'உள்நுழைவு' : 'Login'}</span>
                  </button>
                )}
              </div>
            )}

          </div>

        </div>
      </header>

      {/* Sleek Minimal "About System & Description" Modal */}
      {showAboutModal && (
        <div className="minimal-modal-backdrop" onClick={() => setShowAboutModal(false)}>
          <div 
            className="minimal-modal-card" 
            role="dialog" 
            aria-modal="true" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-wrap">
                <TnEmblem size={28} />
                <div>
                  <h3 className="modal-title">{t.aboutModalTitle || 'About FarmChain AI Platform'}</h3>
                  <span className="modal-subtitle">
                    {currentLang === 'ta' 
                      ? 'தமிழ்நாடு வேளாண்மை மற்றும் TNeGA ஆய்வு மாதிரி திட்டம்' 
                      : 'Proposed GovTech Evaluation Prototype'}
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setShowAboutModal(false)}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-description-paragraph">
                {t.portalDescription || t.aboutModalDesc}
              </p>

              <div className="modal-features-grid">
                <div className="modal-feature-item">
                  <div className="feature-icon emerald">🌾</div>
                  <div>
                    <h4>{currentLang === 'ta' ? '1. உழவர் டிஜிட்டல் பாஸ்' : '1. Digital Mandi Pass'}</h4>
                    <p>{t.aboutFeature1 || 'Instant APMC benchmark discovery & verifiable Genesis blocks.'}</p>
                  </div>
                </div>

                <div className="modal-feature-item">
                  <div className="feature-icon sky">🤖</div>
                  <div>
                    <h4>{currentLang === 'ta' ? '2. AI தர மதிப்பீடு' : '2. Vision AI Quality Grading'}</h4>
                    <p>{t.aboutFeature2 || 'Real-time damage inspection with automated price adjustments.'}</p>
                  </div>
                </div>

                <div className="modal-feature-item">
                  <div className="feature-icon amber">⛓️</div>
                  <div>
                    <h4>{currentLang === 'ta' ? '3. கிரிப்டோகிராபிக் பதிவேடு' : '3. Cryptographic Provenance'}</h4>
                    <p>{t.aboutFeature3 || 'Tamper-evident SHA-256 hash-chain with citizen QR passports.'}</p>
                  </div>
                </div>

                <div className="modal-feature-item">
                  <div className="feature-icon purple">🔍</div>
                  <div>
                    <h4>{currentLang === 'ta' ? '4. நுகர்வோர் சரிபார்ப்பு' : '4. Citizen QR Verification'}</h4>
                    <p>{t.aboutFeature4 || 'QR-accessible provenance with real-time tamper alerts.'}</p>
                  </div>
                </div>
              </div>

              <div className="modal-footer-notes">
                <span className="note-badge">🇮🇳 Digital India</span>
                <span className="note-badge">🌾 e-NAM Mandi Network</span>
                <span className="note-badge">🔒 SHA-256 Hash Chain</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
