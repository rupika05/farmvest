import React, { useState } from 'react';
import { Sprout, ArrowRightLeft, ShieldCheck, Database, Globe, Check, LogOut, Phone, Mail, Eye, Sparkles, Bot } from 'lucide-react';
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
    <header className="tnega-header-wrapper">
      {/* Topmost Official TNeGA Accessibility & Utility Bar */}
      <div className="tnega-utility-topbar">
        <div className="tnega-utility-inner">
          <div className="tnega-help-links">
            <span className="tnega-demo-pill">⚠️ {currentLang === 'ta' ? 'முன்மாதிரி வெள்ளோட்டம் (Concept Prototype)' : 'Evaluation Prototype Demo'}</span>
            <span className="util-sep">|</span>
            <a href="mailto:tnesevaihelpdesk@tn.gov.in" className="tnega-util-link">
              <Mail className="w-3.5 h-3.5" />
              <span>tnesevaihelpdesk@tn.gov.in (TNeGA Ref)</span>
            </a>
            <span className="util-sep">|</span>
            <a href="tel:18004256000" className="tnega-util-link">
              <Phone className="w-3.5 h-3.5" />
              <span>{currentLang === 'ta' ? 'உதவி எண் (Demo Ref): 1800 425 6000' : 'Help (Demo Ref): 1800 425 6000'}</span>
            </a>
          </div>

          <div className="tnega-util-actions">
            {/* Accessibility & Font Size Controls (A- / A / A+) */}
            <div className="tnega-font-controls" title="Text Resizer / எழுத்து அளவு">
              <button 
                type="button" 
                onClick={() => handleFontSize('small')} 
                className={`font-btn ${fontSizeScale === 'small' ? 'active' : ''}`}
              >
                A-
              </button>
              <button 
                type="button" 
                onClick={() => handleFontSize('normal')} 
                className={`font-btn ${fontSizeScale === 'normal' ? 'active' : ''}`}
              >
                A
              </button>
              <button 
                type="button" 
                onClick={() => handleFontSize('large')} 
                className={`font-btn ${fontSizeScale === 'large' ? 'active' : ''}`}
              >
                A+
              </button>
            </div>

            <span className="util-sep">|</span>

            {/* Language Selector */}
            <div className="tnega-lang-group">
              <Globe className="w-3.5 h-3.5 text-amber-300" />
              <div className="tnega-lang-btns">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    id={`btn-nav-lang-${l.code}`}
                    type="button"
                    onClick={() => setLanguage(l.code)}
                    className={`tnega-lang-btn ${currentLang === l.code ? 'active' : ''}`}
                  >
                    {l.label}
                    {currentLang === l.code && <Check className="w-3 h-3 ml-0.5 inline" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Official Government Header Banner (White Canvas with Emblem) */}
      <div className="tnega-main-brand-bar">
        <div className="tnega-brand-inner">
          <div className="tnega-brand-left" onClick={() => setActiveTab('farmer')} style={{ cursor: 'pointer' }}>
            <TnEmblem size={68} className="tnega-state-crest" />
            <div className="tnega-title-block">
              <h2 className="tnega-dept-title">
                {currentLang === 'ta' 
                  ? 'வேளாண்மைத் துறை & TNeGA ஆய்வுக்கான முன்மொழிவு மாதிரி திட்டம்' 
                  : currentLang === 'hi' 
                  ? 'कृषि विभाग और TNeGA अनुसंधान हेतु प्रस्तावित प्रोटोटाइप' 
                  : 'PROPOSED CONCEPT PROTOTYPE FOR TNeGA & DEPT OF AGRICULTURE'}
              </h2>
              <h1 className="tnega-agency-title">
                {currentLang === 'ta' 
                  ? 'இ-சேவை உழவர் தளம் (FarmChain AI Prototype)' 
                  : currentLang === 'hi' 
                  ? 'ई-सेवा कृषि मंच (FarmChain AI प्रोटोटाइप)' 
                  : 'e-Sevai Krishi Transparency Portal (Prototype)'}
              </h1>
              <div className="tnega-portal-badge-row">
                <span className="tnega-portal-name">
                  {currentLang === 'ta' 
                    ? 'விளைபொருள் கிரிப்டோகிராபிக் பாஸ் மற்றும் AI தர மதிப்பீட்டு மாதிரி' 
                    : currentLang === 'hi' 
                    ? 'क्रिप्टोग्राफिक कृषि पास और एआई गुणवत्ता मूल्यांकन प्रोटोटाइप' 
                    : 'Cryptographic Provenance & AI Produce Quality Demonstration'}
                </span>
                <span className="tnega-tag-prototype">⚠️ Concept Prototype</span>
              </div>
            </div>
          </div>

          <div className="tnega-brand-right">
            <div className="tnega-slogan-box">
              <div className="tnega-motto">"இனிய சேவை இணைய சேவை"</div>
              <div className="tnega-submotto">Sweet Service • Online Service</div>
            </div>
            <div className="tnega-badge-stack">
              <span className="tnega-chip-badge saffron">🇮🇳 Digital India</span>
              <span className="tnega-chip-badge green">🌾 e-NAM Mandi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary TNeGA Royal Navy Navigation Bar */}
      <nav className="tnega-navbar" role="navigation" aria-label="Main Government Navigation">
        <div className="tnega-navbar-inner">
          {/* Navigation Tabs */}
          <div className="tnega-nav-tabs" role="tablist">
            <button
              id="tab-farmer"
              role="tab"
              aria-selected={activeTab === 'farmer'}
              className={`tnega-tab-btn ${activeTab === 'farmer' ? 'active' : ''}`}
              onClick={() => setActiveTab('farmer')}
            >
              <Sprout className="w-4 h-4" />
              <span>{currentLang === 'ta' ? '1. இ-சேவை உழவர் பாஸ்' : t.tabFarmer}</span>
            </button>

            <button
              id="tab-transfer"
              role="tab"
              aria-selected={activeTab === 'transfer'}
              className={`tnega-tab-btn ${activeTab === 'transfer' ? 'active' : ''}`}
              onClick={() => setActiveTab('transfer')}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>{currentLang === 'ta' ? '2. மண்டி மாற்றம் & AI தரம்' : t.tabTransfer}</span>
            </button>

            <button
              id="tab-consumer"
              role="tab"
              aria-selected={activeTab === 'consumer'}
              className={`tnega-tab-btn ${activeTab === 'consumer' ? 'active' : ''}`}
              onClick={() => setActiveTab('consumer')}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{currentLang === 'ta' ? '3. நுகர்வோர் சரிபார்ப்பு' : t.tabConsumer}</span>
            </button>

            <button
              id="tab-admin"
              role="tab"
              aria-selected={activeTab === 'admin'}
              className={`tnega-tab-btn admin-btn-highlight ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <Database className="w-4 h-4" />
              <span>{currentLang === 'ta' ? '4. அரசு நிர்வாக மையம்' : t.tabAdmin}</span>
            </button>

            <button
              id="tab-multiagent"
              role="tab"
              aria-selected={activeTab === 'multiagent'}
              className={`tnega-tab-btn multiagent-tab-btn ${activeTab === 'multiagent' ? 'active' : ''}`}
              onClick={() => setActiveTab('multiagent')}
              style={{
                background: activeTab === 'multiagent' 
                  ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' 
                  : 'rgba(16, 185, 129, 0.12)',
                color: activeTab === 'multiagent' ? '#ffffff' : '#34d399',
                borderColor: activeTab === 'multiagent' ? '#34d399' : 'rgba(52, 211, 153, 0.35)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
              title={t.tabMultiagentDesc}
            >
              <Bot className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span>{t.tabMultiagent || (currentLang === 'ta' ? '5. பல முகவர் தளம்' : '5. AI Multiagent Hub')}</span>
            </button>
          </div>

          {/* Right Action Stack: Authenticated Badge & Batch Switcher */}
          <div className="tnega-nav-actions">
            {authenticatedUser ? (
              <div className="tnega-user-pill" id="user-profile-badge">
                <span className="tnega-user-icon">
                  {authenticatedUser.role === 'admin' ? '🏛️' : authenticatedUser.role === 'trader' ? '🏪' : '👨‍🌾'}
                </span>
                <div className="tnega-user-meta">
                  <span className="tnega-user-name">{authenticatedUser.name}</span>
                  <span className="tnega-user-role">
                    {authenticatedUser.role === 'admin'
                      ? (currentLang === 'ta' ? 'அரசு அலுவலர்' : currentLang === 'hi' ? 'सरकारी अधिकारी' : 'Govt Official')
                      : authenticatedUser.role === 'trader'
                      ? (currentLang === 'ta' ? 'மண்டி உரிமதாரர்' : currentLang === 'hi' ? 'मंडी व्यापारी' : 'Mandi Trader')
                      : (currentLang === 'ta' ? 'பதிவுற்ற உழவர்' : currentLang === 'hi' ? 'पंजीकृत किसान' : 'Farmer')}
                    {' • '}
                    <span className="tnega-user-id">{authenticatedUser.id || authenticatedUser.phone}</span>
                  </span>
                </div>
                {onLogout && (
                  <button
                    id="btn-logout"
                    type="button"
                    onClick={onLogout}
                    className="tnega-logout-btn"
                    title={currentLang === 'ta' ? 'வெளியேறு' : currentLang === 'hi' ? 'लॉग आउट' : 'Logout'}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{currentLang === 'ta' ? 'வெளியேறு' : currentLang === 'hi' ? 'लॉग आउट' : 'Logout'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 700, background: '#ecfdf5', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                  👁️ {currentLang === 'ta' ? 'பொது நுகர்வோர் பார்வை' : 'Citizen View'}
                </span>
                {onOpenLogin && (
                  <button
                    type="button"
                    id="btn-mandi-login-nav"
                    onClick={onOpenLogin}
                    style={{
                      background: '#d4af37',
                      color: '#0b3c5d',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.35rem 0.65rem',
                      fontWeight: '700',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <span>🔑 {currentLang === 'ta' ? 'உள்நுழைவு' : 'Login'}</span>
                  </button>
                )}
              </div>
            )}

            {batches.length > 0 && (
              <div className="tnega-batch-select-box">
                <label htmlFor="global-batch-select">
                  {currentLang === 'ta' ? 'பாஸ்:' : currentLang === 'hi' ? 'बैच:' : 'Pass:'}
                </label>
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
          </div>
        </div>
      </nav>
    </header>
  );
}
