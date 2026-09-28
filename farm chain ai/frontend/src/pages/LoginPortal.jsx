import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Smartphone, User, CheckCircle2, ArrowRight, 
  RefreshCw, AlertCircle, Building2, Key, Check, Globe, Sparkles,
  Phone, Mail, FileText, CheckCircle, HelpCircle, Layers, Cpu, QrCode, Sprout
} from 'lucide-react';
import TnEmblem from '../components/TnEmblem';
import { sendOtp, verifyOtp } from '../services/api';
import { translations } from '../locales/translations';
import './LoginPortal.css';

export default function LoginPortal({ 
  currentLang = 'ta', 
  setLanguage, 
  onLoginSuccess,
  onEnterAsCitizen 
}) {
  const t = translations[currentLang] || translations.en;

  const [role, setRole] = useState('farmer'); // 'farmer' | 'trader' | 'admin'
  const [identifier, setIdentifier] = useState('9842100000');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [incomingSmsOtp, setIncomingSmsOtp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [fontSizeScale, setFontSizeScale] = useState('normal');

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

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setOtpSent(false);
    setOtpCode('');
    setIncomingSmsOtp(null);
    setErrorMsg(null);

    if (newRole === 'farmer') {
      setIdentifier('9842100000');
    } else if (newRole === 'trader') {
      setIdentifier('APMC-TN-8821');
    } else if (newRole === 'admin') {
      setIdentifier('agricofficer@nic.in');
    }
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!identifier) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await sendOtp(identifier, role);
      if (res?.success) {
        setOtpSent(true);
        setIncomingSmsOtp(res.otp);
      } else {
        setErrorMsg(res?.error || 'Failed to dispatch verification OTP.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Government verification gateway unreachable.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otpCode) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await verifyOtp(identifier, otpCode, role);
      if (res?.success && res?.user) {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      } else {
        setErrorMsg(res?.error || 'Invalid verification code. Please check SMS.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoRole) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const id = demoRole === 'farmer' ? '9842100000' : demoRole === 'trader' ? 'APMC-TN-8821' : 'agricofficer@nic.in';
      const res = await verifyOtp(id, '782419', demoRole);
      if (res?.success && res?.user) {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="minimal-login-page">
      {/* 1. Minimal Top Header Bar */}
      <header className="minimal-login-header">
        <div className="minimal-login-header-inner">
          <div className="minimal-login-brand">
            <TnEmblem size={36} />
            <div className="login-brand-meta">
              <div className="brand-row">
                <span className="login-brand-title">FarmChain AI</span>
                <span className="login-poc-badge">GovTech PoC</span>
              </div>
              <span className="login-dept-title">
                {currentLang === 'ta' 
                  ? 'தமிழ்நாடு வேளாண்மை & TNeGA ஆய்வு மாதிரி' 
                  : currentLang === 'hi'
                  ? 'कृषि विभाग एवं TNeGA अनुसंधान प्रोटोटाइप'
                  : 'Dept of Agriculture & TNeGA Research Prototype'}
              </span>
            </div>
          </div>

          <div className="minimal-login-header-controls">
            {/* Direct Citizen Quick Bypass */}
            {onEnterAsCitizen && (
              <button
                type="button"
                onClick={onEnterAsCitizen}
                className="minimal-citizen-shortcut"
                title={currentLang === 'ta' ? 'நுகர்வோர் நேரடி அணுகல்' : 'Direct Citizen Access'}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentLang === 'ta' ? 'நுகர்வோர் நேரடி பார்வை' : 'Citizen Explorer'}</span>
              </button>
            )}

            {/* Language Switcher */}
            <div className="minimal-lang-switcher" role="group" aria-label="Language selection">
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  className={`lang-pill ${currentLang === l.code ? 'active' : ''}`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Accessibility Font Scaler */}
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
          </div>
        </div>
      </header>

      {/* 2. Main Minimal 2-Column Content Layout */}
      <main className="minimal-login-container">
        <div className="minimal-login-grid">
          
          {/* LEFT COLUMN: Clean System Description & Pillars */}
          <section className="minimal-desc-col" aria-label="About the Platform">
            
            <div className="minimal-poc-pill">
              <span className="poc-dot"></span>
              <span>{currentLang === 'ta' ? 'தேசிய உழவர் ஒளிவுமறைவற்ற தளம்' : 'NATIONAL KRISHI TRANSPARENCY REGISTRY'}</span>
            </div>

            <h1 className="minimal-hero-heading">
              {t.loginHeroHeadline || (currentLang === 'ta' 
                ? 'நேர்மையான விளைபொருள் தரம் மற்றும் விநியோகச் சங்கிலி சரிபார்ப்பு' 
                : 'Verifiable Farm-to-Fork Traceability & AI Produce Grading')}
            </h1>

            <p className="minimal-hero-desc">
              {t.loginHeroDesc || (currentLang === 'ta'
                ? 'பாரம்பரிய காகித ரசீதுகளுக்கு மாற்றாக, SHA-256 பிளாக்செயின் மற்றும் ஜெமினி AI கணினி பார்வை மூலம் உழவர் முதல் நுகர்வோர் வரை வெளிப்படையான விலையையும் தரத்தையும் FarmChain AI உறுதி செய்கிறது.'
                : 'FarmChain AI replaces paper mandi slips and opaque wholesale margins with an immutable cryptographic ledger and Gemini multimodal vision AI. Every harvest minted into the registry carries verified APMC mandi prices and automated quality grades.')}
            </p>

            {/* 3 Minimal Pillars */}
            <div className="minimal-pillars-grid">
              
              <div className="minimal-pillar-card">
                <div className="pillar-icon-box emerald">
                  <Sprout className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="pillar-content">
                  <h3>{currentLang === 'ta' ? '1. டிஜிட்டல் மண்டி பாஸ்' : '1. Digital Mandi Pass'}</h3>
                  <p>
                    {currentLang === 'ta'
                      ? 'அறுவடைக்கு நேரடி APMC மண்டி விலை மற்றும் கிரிப்டோகிராபிக் ஜெனிசிஸ் பிளாக் உருவாக்கம்.'
                      : 'Real-time APMC mandi price benchmarks & verifiable Genesis Block minting.'}
                  </p>
                </div>
              </div>

              <div className="minimal-pillar-card">
                <div className="pillar-icon-box sky">
                  <Cpu className="w-5 h-5 text-sky-400" />
                </div>
                <div className="pillar-content">
                  <h3>{currentLang === 'ta' ? '2. AI தர மதிப்பீடு' : '2. Multimodal AI Vision'}</h3>
                  <p>
                    {currentLang === 'ta'
                      ? 'கேமரா மூலம் சேதங்கள் கண்டறிந்து 20% தானியங்கி விலை குறைப்பு அல்லது பிரீமியம் நிர்ணயம்.'
                      : 'Real-time optical HUD detects produce blemishes and applies automated fair markdown.'}
                  </p>
                </div>
              </div>

              <div className="minimal-pillar-card">
                <div className="pillar-icon-box amber">
                  <QrCode className="w-5 h-5 text-amber-400" />
                </div>
                <div className="pillar-content">
                  <h3>{currentLang === 'ta' ? '3. கிரிப்டோகிராபிக் பாஸ்போர்ட்' : '3. Provenance Passport'}</h3>
                  <p>
                    {currentLang === 'ta'
                      ? 'நுகர்வோர் ஸ்கேன் செய்யக்கூடிய QR பாஸ் மற்றும் SHA-256 திருத்த எதிர்ப்பு ஆய்வு.'
                      : 'End-to-end QR code tracking with SHA-256 tamper-evident cyber defense checks.'}
                  </p>
                </div>
              </div>

            </div>

            {/* Direct Citizen Access Action Card */}
            {onEnterAsCitizen && (
              <div className="minimal-citizen-banner">
                <div className="citizen-banner-info">
                  <h4>{currentLang === 'ta' ? 'பொது நுகர்வோர் மற்றும் தணிக்கையாளர் பார்வை' : 'Citizen & Public Evaluator Access'}</h4>
                  <p>
                    {currentLang === 'ta'
                      ? 'உள்நுழைவு தேவையின்றி QR பாஸ்போர்ட் மற்றும் பிளாக்செயின் தணிக்கை சாளரத்தை நேரடியாக பார்வையிடலாம்.'
                      : 'Inspect verified produce passports, custody handoffs, and tamper attack resilience without login.'}
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-public-citizen-access"
                  onClick={onEnterAsCitizen}
                  className="minimal-citizen-action-btn"
                >
                  <span>{currentLang === 'ta' ? 'நுகர்வோர் பார்வை திறக்க ➔' : 'Explore Citizen Passport ➔'}</span>
                </button>
              </div>
            )}

          </section>

          {/* RIGHT COLUMN: Minimal Modern Authentication Card */}
          <section className="minimal-auth-col" aria-label="Portal Login">
            <div className="minimal-auth-card">
              
              <div className="auth-card-top">
                <h2 className="auth-card-title">{t.loginTitle || 'Registry Authentication'}</h2>
                <p className="auth-card-sub">
                  {currentLang === 'ta' 
                    ? 'உங்கள் அடையாள வகையை தேர்வு செய்து OTP மூலம் உள்நுழைக' 
                    : 'Select your persona to access digital mandi passes and audit ledgers'}
                </p>
              </div>

              {/* 3 Identity Category Tabs */}
              <div className="minimal-role-selector">
                <button
                  type="button"
                  id="role-tab-farmer"
                  onClick={() => handleRoleChange('farmer')}
                  className={`role-btn ${role === 'farmer' ? 'active' : ''}`}
                >
                  <span className="role-icon">👨‍🌾</span>
                  <span className="role-label">{currentLang === 'ta' ? 'உழவர்' : 'Farmer'}</span>
                </button>

                <button
                  type="button"
                  id="role-tab-trader"
                  onClick={() => handleRoleChange('trader')}
                  className={`role-btn ${role === 'trader' ? 'active' : ''}`}
                >
                  <span className="role-icon">🏪</span>
                  <span className="role-label">{currentLang === 'ta' ? 'வணிகர்' : 'Trader'}</span>
                </button>

                <button
                  type="button"
                  id="role-tab-admin"
                  onClick={() => handleRoleChange('admin')}
                  className={`role-btn ${role === 'admin' ? 'active' : ''}`}
                >
                  <span className="role-icon">🏛️</span>
                  <span className="role-label">{currentLang === 'ta' ? 'அதிகாரி' : 'Official'}</span>
                </button>
              </div>

              {/* Simulated SMS Alert Toast */}
              {incomingSmsOtp && (
                <div className="minimal-sms-toast" role="alert">
                  <div className="sms-toast-header">
                    <span className="sms-sender">🔐 TN-GOVT-SMS • e-Sevai Gateway</span>
                    <span className="sms-time">Now</span>
                  </div>
                  <p className="sms-text">
                    e-Sevai verification code is <strong className="sms-code">{incomingSmsOtp}</strong>. Valid for 10 min.
                  </p>
                  <button
                    type="button"
                    onClick={() => setOtpCode(incomingSmsOtp)}
                    className="minimal-autofill-btn"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{currentLang === 'ta' ? 'தானியங்கி OTP (782419)' : 'Auto-Fill OTP (782419)'}</span>
                  </button>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="minimal-error-banner" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="minimal-auth-form">
                <div className="form-field">
                  <label className="field-label">
                    {role === 'farmer' && (currentLang === 'ta' ? 'கைபேசி எண் அல்லது PM-KISAN எண்:' : 'Mobile Number or PM-KISAN ID:')}
                    {role === 'trader' && (currentLang === 'ta' ? 'மண்டி உரிம எண் (APMC License):' : 'Mandi License ID (e.g. APMC-TN-8821):')}
                    {role === 'admin' && (currentLang === 'ta' ? 'அதிகாரி மின்னஞ்சல் (@nic.in) அல்லது எண்:' : 'Officer Email (@nic.in) or ID:')}
                  </label>
                  <input
                    type="text"
                    className="minimal-input"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={role === 'farmer' ? '9842100000' : role === 'trader' ? 'APMC-TN-8821' : 'agricofficer@nic.in'}
                    required
                  />
                </div>

                {!otpSent ? (
                  <button
                    type="submit"
                    id="btn-send-otp"
                    disabled={loading || !identifier}
                    className="minimal-submit-btn"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{currentLang === 'ta' ? 'OTP அனுப்பப்படுகிறது...' : 'Dispatching OTP...'}</span>
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4" />
                        <span>{currentLang === 'ta' ? 'சரிபார்ப்பு OTP பெறுக' : 'Send Verification OTP'}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <div className="form-field">
                      <label className="field-label">
                        {currentLang === 'ta' ? '6 இலக்க சரிபார்ப்பு OTP குறியீடு:' : '6-Digit Verification Code (OTP):'}
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        className="minimal-input otp-field"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="782419"
                        required
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      id="btn-verify-otp"
                      disabled={loading || !otpCode}
                      className="minimal-submit-btn"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{currentLang === 'ta' ? 'சரிபார்க்கப்படுகிறது...' : 'Verifying...'}</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>{currentLang === 'ta' ? 'உள்நுழைக' : 'Verify & Enter'}</span>
                        </>
                      )}
                    </button>

                    <div className="resend-row">
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="minimal-link-btn"
                      >
                        {currentLang === 'ta' ? 'மறுமுறை OTP அனுப்புக' : 'Resend OTP'}
                      </button>
                    </div>
                  </>
                )}
              </form>

              {/* 1-Click Persona Shortcuts */}
              <div className="minimal-personas-section">
                <span className="personas-label">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{currentLang === 'ta' ? 'உடனடி மாதிரி உள்நுழைவு:' : 'Instant 1-Click Evaluation:'}</span>
                </span>
                <div className="personas-row">
                  <button
                    type="button"
                    id="demo-login-farmer"
                    onClick={() => handleQuickDemoLogin('farmer')}
                    className="persona-chip farmer"
                    title="Login as Farmer Murugan"
                  >
                    👨‍🌾 {currentLang === 'ta' ? 'முருகன் (உழவர்)' : 'Murugan (Farmer)'}
                  </button>
                  <button
                    type="button"
                    id="demo-login-trader"
                    onClick={() => handleQuickDemoLogin('trader')}
                    className="persona-chip trader"
                    title="Login as Mandi Trader Selvaraj"
                  >
                    🏪 {currentLang === 'ta' ? 'செல்வராஜ் (வணிகர்)' : 'Selvaraj (Trader)'}
                  </button>
                  <button
                    type="button"
                    id="demo-login-admin"
                    onClick={() => handleQuickDemoLogin('admin')}
                    className="persona-chip admin"
                    title="Login as Regulatory Officer Swaminathan"
                  >
                    🏛️ {currentLang === 'ta' ? 'சுவாமிநாதன் (அதிகாரி)' : 'Swaminathan (Admin)'}
                  </button>
                </div>
              </div>

            </div>
          </section>

        </div>
      </main>

      {/* 3. Minimal GovTech Footer */}
      <footer className="minimal-login-footer">
        <div className="minimal-login-footer-inner">
          <div className="footer-left">
            <span className="footer-title">
              {currentLang === 'ta' 
                ? 'வேளாண்மைத் துறை & TNeGA ஆய்வுக்கான கருத்துரு முன்மாதிரி' 
                : 'National Krishi Transparency Registry • Govt Research PoC'}
            </span>
            <p className="footer-subtext">
              {currentLang === 'ta'
                ? 'விளைபொருள் உண்மைத் தன்மை, APMC மண்டி விலை மற்றும் கிரிப்டோகிராபிக் SHA-256 பதிவேட்டு வெள்ளோட்டம்.'
                : 'Decentralized agricultural traceability prototype powered by SHA-256 cryptographic ledgers & Gemini Vision AI.'}
            </p>
          </div>
          <div className="footer-tags">
            <span className="footer-tag-pill">🇮🇳 Digital India</span>
            <span className="footer-tag-pill">🌾 e-NAM Network</span>
            <span className="footer-tag-pill">🔒 SHA-256 Ledger</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
