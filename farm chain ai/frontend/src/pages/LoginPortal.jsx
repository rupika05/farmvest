import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Smartphone, User, CheckCircle2, ArrowRight, 
  RefreshCw, AlertCircle, Building2, Key, Check, Globe, Sparkles,
  Phone, Mail, FileText, CheckCircle, HelpCircle
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
    <div className="tnega-login-page">
      {/* Topmost Official TNeGA Accessibility & Utility Bar */}
      <div className="tnega-utility-topbar">
        <div className="tnega-utility-inner">
          <div className="tnega-help-links">
            <span className="tnega-demo-pill">⚠️ {currentLang === 'ta' ? 'கருத்துரு முன்மாதிரி (Concept Prototype)' : 'Concept Prototype for Evaluation'}</span>
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
            <div className="tnega-font-controls" title="Text Resizer">
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

            <div className="tnega-lang-group">
              <Globe className="w-3.5 h-3.5 text-amber-300" />
              <button
                type="button"
                onClick={() => setLanguage('ta')}
                className={`tnega-lang-btn ${currentLang === 'ta' ? 'active' : ''}`}
              >
                தமிழ்
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`tnega-lang-btn ${currentLang === 'en' ? 'active' : ''}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`tnega-lang-btn ${currentLang === 'hi' ? 'active' : ''}`}
              >
                हिन्दी
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Official Government Header Banner */}
      <div className="tnega-main-brand-bar">
        <div className="tnega-brand-inner">
          <div className="tnega-brand-left">
            <TnEmblem size={70} className="tnega-state-crest" />
            <div className="tnega-title-block">
              <h2 className="tnega-dept-title">
                {currentLang === 'ta' 
                  ? 'வேளாண்மைத் துறை & TNeGA ஆய்வுக்கான முன்மொழிவு மாதிரி திட்டம்' 
                  : 'PROPOSED CONCEPT PROTOTYPE FOR TNeGA & DEPT OF AGRICULTURE'}
              </h2>
              <h1 className="tnega-agency-title">
                {currentLang === 'ta' 
                  ? 'இ-சேவை உழவர் தளம் (FarmChain AI Prototype)' 
                  : 'e-Sevai Krishi Transparency Portal (Prototype)'}
              </h1>
              <div className="tnega-portal-badge-row">
                <span className="tnega-portal-name">
                  {currentLang === 'ta' 
                    ? 'விளைபொருள் கிரிப்டோகிராபிக் பாஸ் மற்றும் AI தர மதிப்பீட்டு மாதிரி' 
                    : 'Cryptographic Provenance & AI Produce Quality Demonstration'}
                </span>
                <span className="tnega-tag-prototype">⚠️ Concept Prototype</span>
              </div>
            </div>
          </div>

          <div className="tnega-brand-right">
            <div className="tnega-slogan-box">
              <div className="tnega-motto">"இனிய சேவை இணைய சேவை"</div>
              <div className="tnega-submotto">Prototype Demo Inspired by TNeGA UI</div>
            </div>
            <div className="tnega-badge-stack">
              <span className="tnega-chip-badge saffron">🔬 Research PoC</span>
              <span className="tnega-chip-badge green">🌾 Agri Tech Demo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Banner Strip with High Visibility Prototype Disclaimer */}
      <div className="tnega-substrip">
        <div className="tnega-substrip-inner">
          <span className="substrip-tag">
            {currentLang === 'ta' ? 'கருத்துரு மாதிரி வெள்ளோட்டம்' : 'Evaluation Prototype Demo'}
          </span>
          <span className="substrip-msg">
            {currentLang === 'ta' 
              ? '🔔 இது TNeGA மற்றும் உழவர் நலத்துறை மதிப்பீட்டிற்கான முன்மாதிரி வெள்ளோட்டம் (Proof of Concept). உண்மை அரசு தளம் அல்ல.' 
              : '🔔 Demonstration Proof-of-Concept Prototype proposed for TNeGA & Agri Dept. For evaluation purposes only.'}
          </span>
        </div>
      </div>

      {/* Two-Column Authentic TNeGA Layout */}
      <main className="tnega-body-container">
        <div className="tnega-grid-layout">
          
          {/* LEFT COLUMN: Authentic TNeGA 4-Step Process & Citizen Info */}
          <section className="tnega-info-col" aria-label="How to Avail Services">
            <div className="tnega-guide-card">
              <div className="guide-card-header">
                <FileText className="w-5 h-5 text-blue-700" />
                <h3>{currentLang === 'ta' ? 'சேவைகளைப் பெற நான்கு செயல்முறை' : '4 Steps to Access Government e-Services'}</h3>
              </div>
              
              <div className="tnega-steps-list">
                <div className="step-item">
                  <div className="step-num-bubble">1</div>
                  <div className="step-item-content">
                    <h4>{currentLang === 'ta' ? 'இ-சேவை / மண்டி மையத்தை அணுகவும்' : 'Approach e-Sevai / APMC Mandi'}</h4>
                    <p>
                      {currentLang === 'ta' 
                        ? 'உங்கள் அருகிலுள்ள இ-சேவை மையம் அல்லது ஒழுங்குமுறை விற்பனைக் கூடத்தை அணுகவும்.' 
                        : 'Visit your nearest e-Sevai center or APMC regulated mandi market yard.'}
                    </p>
                  </div>
                </div>

                <div className="step-item">
                  <div className="step-num-bubble">2</div>
                  <div className="step-item-content">
                    <h4>{currentLang === 'ta' ? 'வேளாண் சேவையைத் தேர்ந்தெடுக்கவும்' : 'Select Required Agricultural Service'}</h4>
                    <p>
                      {currentLang === 'ta' 
                        ? 'விளைபொருள் பதிவு, APMC மண்டி விலை விவரம் அல்லது AI கணினி பார்வை தர ஆய்வு கோரவும்.' 
                        : 'Choose crop registration, live APMC mandi benchmarks, or AI computer vision quality inspection.'}
                    </p>
                  </div>
                </div>

                <div className="step-item">
                  <div className="step-num-bubble">3</div>
                  <div className="step-item-content">
                    <h4>{currentLang === 'ta' ? 'விவரங்களை சமர்ப்பித்து OTP உறுதி செய்க' : 'Submit Details & Verify via SMS OTP'}</h4>
                    <p>
                      {currentLang === 'ta' 
                        ? 'தங்களின் பதிவுற்ற கைபேசி எண் அல்லது PM-KISAN அட்டை மூலம் எளிய OTP சரிபார்ப்பை முடிக்கவும்.' 
                        : 'Complete instant OTP verification using your registered Mobile Number or PM-KISAN ID.'}
                    </p>
                  </div>
                </div>

                <div className="step-item">
                  <div className="step-num-bubble">4</div>
                  <div className="step-item-content">
                    <h4>{currentLang === 'ta' ? 'டிஜிட்டல் உழவர் பாஸ் & QR பெறுக' : 'Receive Digital Mandi Pass & QR'}</h4>
                    <p>
                      {currentLang === 'ta' 
                        ? 'கிரிப்டோகிராபிக் Block #0 குறியிடப்பட்ட அரசு டிஜிட்டல் பாஸ் மற்றும் QR குறியீட்டை உடனடியாக பெற்றுக்கொள்ளவும்.' 
                        : 'Receive your official cryptographically verified Digital Mandi Pass with QR code immediately.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Citizen Helpdesk Info Box */}
              <div className="tnega-helpdesk-box">
                <div className="helpdesk-header">
                  <HelpCircle className="w-4 h-4 text-emerald-700" />
                  <strong>{currentLang === 'ta' ? 'உதவி மற்றும் ஆலோசனை மையம்' : 'e-Sevai Citizen Helpdesk'}</strong>
                </div>
                <div className="helpdesk-details">
                  <div>📞 {currentLang === 'ta' ? 'கட்டணமில்லா எண்:' : 'Toll-Free:'} <strong>1800 425 6000</strong> (8 AM - 8 PM)</div>
                  <div>✉️ {currentLang === 'ta' ? 'மின்னஞ்சல்:' : 'Email:'} <strong>tnesevaihelpdesk@tn.gov.in</strong></div>
                  <div>🏛️ {currentLang === 'ta' ? 'அலுவலகம்:' : 'Office:'} TNeGA, 807, 7th Floor, PT Lee Chengalvaraya Naicker Maligai, Anna Salai, Chennai - 600002.</div>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: Authentic TNeGA Login Form Box */}
          <section className="tnega-login-col" aria-label="Portal Login">
            <div className="tnega-login-box">
              
              {/* Login Box Header */}
              <div className="login-box-header">
                <div className="login-crest-icon">
                  <TnEmblem size={44} />
                </div>
                <div>
                  <h3 className="login-box-title">
                    {currentLang === 'ta' ? 'இ-சேவை முன்மாதிரி உள்நுழைவு' : 'e-Sevai Prototype Demo Login'}
                  </h3>
                  <p className="login-box-desc">
                    {currentLang === 'ta' 
                      ? 'மதிப்பீட்டாளர் ஆய்வு சாளரம் • மாதிரி வெள்ளோட்டம் (Not Official)' 
                      : 'Evaluation Single Sign-On • Concept Demonstration'}
                  </p>
                </div>
              </div>

              {/* 3 Citizen/Official Role Selector Tabs */}
              <div className="tnega-role-tabs">
                <button
                  type="button"
                  id="role-tab-farmer"
                  onClick={() => handleRoleChange('farmer')}
                  className={`tnega-role-tab ${role === 'farmer' ? 'active' : ''}`}
                >
                  <span className="tab-icon">👨‍🌾</span>
                  <span className="tab-text">{currentLang === 'ta' ? 'குடிமக்கள் / உழவர்' : 'Citizen / Farmer'}</span>
                </button>

                <button
                  type="button"
                  id="role-tab-trader"
                  onClick={() => handleRoleChange('trader')}
                  className={`tnega-role-tab ${role === 'trader' ? 'active' : ''}`}
                >
                  <span className="tab-icon">🏪</span>
                  <span className="tab-text">{currentLang === 'ta' ? 'மண்டி வணிகர்' : 'APMC Trader'}</span>
                </button>

                <button
                  type="button"
                  id="role-tab-admin"
                  onClick={() => handleRoleChange('admin')}
                  className={`tnega-role-tab ${role === 'admin' ? 'active' : ''}`}
                >
                  <span className="tab-icon">🏛️</span>
                  <span className="tab-text">{currentLang === 'ta' ? 'அரசு அலுவலர்' : 'Govt Official'}</span>
                </button>
              </div>

              {/* Simulated Govt SMS Alert Toast */}
              {incomingSmsOtp && (
                <div className="tnega-sms-toast" role="alert">
                  <div className="sms-toast-header">
                    <span className="sms-sender">🔐 TN-GOVT-SMS • e-Sevai Gateway</span>
                    <span className="sms-time">Just Now</span>
                  </div>
                  <p className="sms-msg-text">
                    Your e-Sevai authentication code is <strong className="sms-code-strong">{incomingSmsOtp}</strong>. Valid for 10 minutes.
                  </p>
                  <button
                    type="button"
                    onClick={() => setOtpCode(incomingSmsOtp)}
                    className="tnega-autofill-btn"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{currentLang === 'ta' ? 'தானியங்கி OTP உள்ளிடு (782419)' : 'Auto-Fill Demo OTP (782419)'}</span>
                  </button>
                </div>
              )}

              {/* Error Banner */}
              {errorMsg && (
                <div className="tnega-error-banner" role="alert">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form Body */}
              <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="tnega-login-form">
                <div className="form-group">
                  <label className="tnega-form-label">
                    {role === 'farmer' && (currentLang === 'ta' ? 'உழவர் கைபேசி எண் அல்லது PM-KISAN அட்டை எண்:' : 'Farmer Mobile No or PM-KISAN ID:')}
                    {role === 'trader' && (currentLang === 'ta' ? 'மண்டி உரிம எண் (APMC License No):' : 'Mandi License ID (e.g. APMC-TN-8821):')}
                    {role === 'admin' && (currentLang === 'ta' ? 'அரசு அலுவலர் மின்னஞ்சல் அல்லது பயனர் எண்:' : 'Officer Official Email (@nic.in) or ID:')}
                  </label>
                  <div className="tnega-input-wrapper">
                    <input
                      type="text"
                      className="tnega-form-input"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={role === 'farmer' ? '9842100000' : role === 'trader' ? 'APMC-TN-8821' : 'agricofficer@nic.in'}
                      required
                    />
                  </div>
                </div>

                {!otpSent ? (
                  <button
                    type="submit"
                    id="btn-send-otp"
                    disabled={loading || !identifier}
                    className="tnega-primary-btn"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{currentLang === 'ta' ? 'OTP அனுப்பப்படுகிறது...' : 'Sending OTP...'}</span>
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
                    <div className="form-group">
                      <label className="tnega-form-label">
                        {currentLang === 'ta' ? '6 இலக்க சரிபார்ப்பு OTP குறியீடு:' : '6-Digit Verification Code (OTP):'}
                      </label>
                      <div className="tnega-input-wrapper">
                        <input
                          type="text"
                          maxLength={6}
                          className="tnega-form-input otp-input"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="782419"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      id="btn-verify-otp"
                      disabled={loading || !otpCode}
                      className="tnega-primary-btn"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{currentLang === 'ta' ? 'சரிபார்க்கப்படுகிறது...' : 'Verifying...'}</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>{currentLang === 'ta' ? 'உள்நுழைக (Verify & Enter)' : 'Verify Identity & Enter'}</span>
                        </>
                      )}
                    </button>

                    <div className="tnega-resend-row">
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="tnega-link-btn"
                      >
                        {currentLang === 'ta' ? 'மறுமுறை OTP அனுப்புக' : 'Resend OTP'}
                      </button>
                    </div>
                  </>
                )}
              </form>

              {/* 1-Click Instant Persona Login for Evaluators */}
              <div className="tnega-evaluator-section">
                <div className="evaluator-title">
                  <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                  <span>{currentLang === 'ta' ? 'மதிப்பீட்டாளர் உடனடி உள்நுழைவு (1-Click Personas):' : '1-Click Instant Evaluator Personas:'}</span>
                </div>
                <div className="evaluator-btns-row">
                  <button
                    type="button"
                    id="demo-login-farmer"
                    onClick={() => handleQuickDemoLogin('farmer')}
                    className="evaluator-chip farmer"
                  >
                    👨‍🌾 {currentLang === 'ta' ? 'உழவர் முருகன்' : 'Farmer Murugan'}
                  </button>
                  <button
                    type="button"
                    id="demo-login-trader"
                    onClick={() => handleQuickDemoLogin('trader')}
                    className="evaluator-chip trader"
                  >
                    🏪 {currentLang === 'ta' ? 'வியாபாரி செல்வராஜ்' : 'Trader Selvaraj'}
                  </button>
                  <button
                    type="button"
                    id="demo-login-admin"
                    onClick={() => handleQuickDemoLogin('admin')}
                    className="evaluator-chip admin"
                  >
                    🏛️ {currentLang === 'ta' ? 'அரசு அலுவலர்' : 'Officer Swaminathan'}
                  </button>
                </div>

                {onEnterAsCitizen && (
                  <button
                    type="button"
                    id="btn-public-citizen-access"
                    onClick={onEnterAsCitizen}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#f0fdf4',
                      border: '1.5px dashed #059669',
                      borderRadius: '6px',
                      color: '#065f46',
                      fontWeight: '700',
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      marginTop: '0.85rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>
                      {currentLang === 'ta'
                        ? '🔎 நுகர்வோர் நேரடி அணுகல் (உள்நுழைவு இன்றி பாஸ்போர்ட் காண்க)'
                        : '🔎 Citizen Public Access (Inspect Traceability without Login)'}
                    </span>
                  </button>
                )}
              </div>

            </div>
          </section>

        </div>
      </main>

      {/* Prototype Disclaimer Footer */}
      <footer className="tnega-footer">
        <div className="tnega-footer-inner">
          <div className="footer-col-main">
            <div className="footer-title">
              {currentLang === 'ta' 
                ? 'TNeGA & வேளாண்மைத் துறை ஆய்வுக்கான கருத்துரு மாதிரி (FarmChain AI Concept Prototype)' 
                : 'Concept Prototype Proposed for TNeGA & Department of Agriculture (FarmChain AI)'}
            </div>
            <p className="footer-desc">
              {currentLang === 'ta'
                ? '⚠️ அறிவிப்பு: இது மதிப்பீட்டு வெள்ளோட்டத்திற்கான முன்மாதிரி திட்டம் (Research PoC). உண்மை அரசு தளம் அல்ல. TNeGA இடைமுக பாணியில் ஆய்வுக்காக உருவாக்கப்பட்டது.'
                : '⚠️ Notice: This application is an evaluation proof-of-concept prototype demonstrating blockchain-style provenance & AI produce quality checks. Not an official live government deployment.'}
            </p>
          </div>
          <div className="footer-col-badges">
            <span className="footer-seal-pill">🔬 Research PoC</span>
            <span className="footer-seal-pill">⚠️ Prototype Only</span>
            <span className="footer-seal-pill">🔐 SHA-256 Ledger</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
