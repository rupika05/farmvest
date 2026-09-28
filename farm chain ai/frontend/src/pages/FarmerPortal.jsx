import React, { useState, useEffect } from 'react';
import { 
  Sprout, Check, X, ArrowRight, ArrowLeft, Volume2, VolumeX, 
  Copy, RotateCcw, Delete, QrCode, CheckCircle2, ExternalLink, 
  Sparkles, RefreshCw, Globe, CheckCircle, Camera, Bot, Video
} from 'lucide-react';
import { createBatch, fetchPriceSuggestion, getMlPriceRecommendation } from '../services/api';
import { CROPS_CONFIG, getCropImage } from '../config/crops';
import confetti from 'canvas-confetti';
import './FarmerPortal.css';

export default function FarmerPortal({ 
  currentLang = 'ta', 
  setLanguage,
  authenticatedUser,
  onBatchCreated, 
  onNavigateTransfer, 
  onNavigateTrack,
  onNavigateMultiagent
}) {
  // Wizard Step: 1 = Crop Selection, 2 = Quantity Keypad, 3 = Price & Mandi Rate, 4 = QR Confirmation
  const [step, setStep] = useState(1);

  // Form State
  const [selectedCrop, setSelectedCrop] = useState(CROPS_CONFIG[0]);
  const [quantityStr, setQuantityStr] = useState('25');
  const [unit, setUnit] = useState('kg');
  const [suggestedPrice, setSuggestedPrice] = useState(32);
  const [customPriceStr, setCustomPriceStr] = useState('');
  const [isCustomPriceMode, setIsCustomPriceMode] = useState(false);

  // Status & API State
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [priceDetails, setPriceDetails] = useState(null);
  const [mlRecommendation, setMlRecommendation] = useState(null);
  const [loadingMl, setLoadingMl] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdBatch, setCreatedBatch] = useState(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Audio Speech Synthesis State
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Stop speech when component unmounts or step changes
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [step]);

  // Web Speech API Narrator
  const speakScreen = (customText) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not available in browser');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    let textToSpeak = customText;
    if (!textToSpeak) {
      const cropName = currentLang === 'ta' ? selectedCrop.ta : currentLang === 'hi' ? selectedCrop.hi : selectedCrop.name;
      const effectivePrice = isCustomPriceMode && customPriceStr ? Number(customPriceStr) : suggestedPrice;

      if (step === 1) {
        if (currentLang === 'ta') {
          textToSpeak = 'படி 1: உங்கள் காய்கறி அல்லது பயிரைத் தேர்ந்தெடுக்கவும்.';
        } else if (currentLang === 'hi') {
          textToSpeak = 'चरण 1: अपनी सब्जी या फसल चुनें।';
        } else {
          textToSpeak = 'Step 1: Select your crop from the vegetable grid.';
        }
      } else if (step === 2) {
        const qtyNum = quantityStr || '0';
        if (currentLang === 'ta') {
          textToSpeak = `படி 2: பயிர் ${cropName}. அளவு ${qtyNum} கிலோ. அடுத்த படி செல்ல பச்சை பட்டனை அழுத்தவும்.`;
        } else if (currentLang === 'hi') {
          textToSpeak = `चरण 2: फसल ${cropName}। मात्रा ${qtyNum} किलोग्राम। आगे बढ़ने के लिए हरा बटन दबाएं।`;
        } else {
          textToSpeak = `Step 2: Crop ${cropName}. Quantity is ${qtyNum} kilograms. Tap next when done.`;
        }
      } else if (step === 3) {
        if (currentLang === 'ta') {
          textToSpeak = `படி 3: ${cropName} மண்டி விலை ஒரு கிலோவிற்கு ${effectivePrice} ரூபாய். ஏற்க பச்சை சரிக்குறி, நிராகரிக்க சிவப்பு பெருக்கல் குறி.`;
        } else if (currentLang === 'hi') {
          textToSpeak = `चरण 3: ${cropName} के लिए मंडी मूल्य ${effectivePrice} रुपये प्रति किलो है। स्वीकार करने के लिए हरा बटन, अस्वीकार करने के लिए लाल बटन दबाएं।`;
        } else {
          textToSpeak = `Step 3: Market price for ${cropName} is ${effectivePrice} Rupees per kilogram. Press green to accept, red to reject.`;
        }
      } else if (step === 4) {
        if (currentLang === 'ta') {
          textToSpeak = `வெற்றி! உங்கள் உழவர் பாஸ் மற்றும் க்யூ ஆர் குறியீடு தயாராக உள்ளது. முதன்மைப் பக்கத்திற்குச் செல்ல முடிந்தது என்பதை அழுத்தவும்.`;
        } else if (currentLang === 'hi') {
          textToSpeak = `सफलता! आपका किसान पास और क्यूआर कोड तैयार है।`;
        } else {
          textToSpeak = `Success! Your digital pass and QR code are ready. Tap Done to finish.`;
        }
      }
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      if (currentLang === 'ta') {
        utterance.lang = 'ta-IN';
      } else if (currentLang === 'hi') {
        utterance.lang = 'hi-IN';
      } else {
        utterance.lang = 'en-IN';
      }

      utterance.rate = 0.92;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Speech error:', e);
      setIsSpeaking(false);
    }
  };

  // Helper to fetch live APMC Mandi price and AI ML Recommendation
  const loadMandiPrice = async (cropObj) => {
    setLoadingPrice(true);
    setLoadingMl(true);
    setErrorMsg(null);
    let resolvedMandiPrice = cropObj.defaultPrice;

    try {
      const res = await fetchPriceSuggestion(cropObj.apiQuery || cropObj.name);
      if (res?.success && res.averagePrice) {
        resolvedMandiPrice = res.averagePrice;
        setSuggestedPrice(res.averagePrice);
        setPriceDetails(res);
      } else {
        setSuggestedPrice(cropObj.defaultPrice);
      }
    } catch (err) {
      console.warn('Error fetching mandi price, fallback to default:', err);
      setSuggestedPrice(cropObj.defaultPrice);
    } finally {
      setLoadingPrice(false);
    }

    // Query genuine ML Recommendation Engine
    try {
      const mlRes = await getMlPriceRecommendation({
        crop: cropObj.name,
        mandi_price: resolvedMandiPrice,
        quality_grade: 'Grade A',
        quantity_kg: Number(quantityStr) || 25,
        location: authenticatedUser?.location || 'Tamil Nadu',
        demand_level: 'High'
      });
      if (mlRes) {
        setMlRecommendation(mlRes);
      }
    } catch (e) {
      console.warn('ML price engine query error:', e);
    } finally {
      setLoadingMl(false);
    }
  };

  // Step 1: Crop Tile Tap Handler
  const handleSelectCrop = (crop) => {
    setSelectedCrop(crop);
    setIsCustomPriceMode(false);
    setCustomPriceStr('');
    setStep(2);

    const cropName = currentLang === 'ta' ? crop.ta : currentLang === 'hi' ? crop.hi : crop.name;
    const feedback = currentLang === 'ta' ? `${cropName} தேர்ந்தெடுக்கப்பட்டது` : currentLang === 'hi' ? `${cropName} चुना गया` : `${crop.name} selected`;
    speakScreen(feedback);
  };

  // Step 2: Numeric Keypad Handlers
  const handleKeypadPress = (val) => {
    if (val === 'CLEAR') {
      setQuantityStr('');
    } else if (val === 'BACKSPACE') {
      setQuantityStr((prev) => prev.slice(0, -1));
    } else {
      setQuantityStr((prev) => {
        if (prev === '0') return String(val);
        if (prev.length >= 5) return prev;
        return prev + String(val);
      });
    }
  };

  const handleAddQuantity = (delta) => {
    const current = Number(quantityStr) || 0;
    setQuantityStr(String(Math.min(99999, current + delta)));
  };

  const handleConfirmQuantity = () => {
    const qty = Number(quantityStr);
    if (!qty || qty <= 0) return;

    loadMandiPrice(selectedCrop);
    setStep(3);

    const cropName = currentLang === 'ta' ? selectedCrop.ta : currentLang === 'hi' ? selectedCrop.hi : selectedCrop.name;
    const msg = currentLang === 'ta' ? `${qty} கிலோ ${cropName}` : currentLang === 'hi' ? `${qty} किलो ${cropName}` : `${qty} kilograms ${cropName}`;
    speakScreen(msg);
  };

  // Step 3: Accept / Reject Handlers
  const handleAcceptPrice = async () => {
    setErrorMsg(null);
    setSubmitting(true);

    const effectivePrice = isCustomPriceMode && customPriceStr ? Number(customPriceStr) : suggestedPrice;
    const defaultOwner = authenticatedUser?.name || (currentLang === 'ta' ? 'முருகன் (Farmer)' : currentLang === 'hi' ? 'राजेश कुमार (Farmer)' : 'K. Selvam (Farmer)');
    const defaultLocation = authenticatedUser?.location || 'Mandi Farm Gate, TN';

    try {
      const payload = {
        crop: selectedCrop.name,
        quantity: Number(quantityStr) || 25,
        unit: 'kg',
        price: effectivePrice,
        owner: defaultOwner,
        location: defaultLocation,
        harvestDate: new Date().toISOString().slice(0, 10),
        notes: `Farmer batch registered via low-literacy portal. Benchmark rate: ₹${suggestedPrice}/kg.`,
        mlRecommendation: mlRecommendation ? {
          lower: mlRecommendation.recommendations?.farmerToIntermediary?.lower,
          expected: mlRecommendation.recommendations?.farmerToIntermediary?.expected,
          upper: mlRecommendation.recommendations?.farmerToIntermediary?.upper,
          modelVersion: mlRecommendation.model?.version || 'v1.0',
          marketReferencePrice: mlRecommendation.marketReferencePrice || suggestedPrice
        } : null
      };

      const result = await createBatch(payload);

      if (result?.success) {
        setCreatedBatch(result);
        setStep(4);
        if (onBatchCreated) onBatchCreated(result.batchId);

        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch (e) {}

        speakScreen();
      } else {
        setErrorMsg(result?.error || 'Failed to register batch.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error communicating with backend ledger.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectPrice = () => {
    setIsCustomPriceMode(true);
    setCustomPriceStr(String(suggestedPrice));
    const msg = currentLang === 'ta' 
      ? 'மண்டி விலை நிராகரிக்கப்பட்டது. உங்கள் விலையைக் குறிப்பிடவும்.' 
      : currentLang === 'hi'
      ? 'मंडी मूल्य अस्वीकार किया गया। अपनी कीमत दर्ज करें।'
      : 'Price rejected. Enter your desired price using keypad.';
    speakScreen(msg);
  };

  // Step 4: Done / Reset
  const handleDone = () => {
    setStep(1);
    setQuantityStr('25');
    setCreatedBatch(null);
    setIsCustomPriceMode(false);
    setCustomPriceStr('');
    setErrorMsg(null);
  };

  const copyBatchId = () => {
    if (createdBatch?.batchId) {
      navigator.clipboard.writeText(createdBatch.batchId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Localized Labels
  const selectedCropName = currentLang === 'ta' ? selectedCrop.ta : currentLang === 'hi' ? selectedCrop.hi : selectedCrop.name;
  const currentQuantityNum = Number(quantityStr) || 0;
  const currentPriceNum = isCustomPriceMode && customPriceStr ? Number(customPriceStr) : suggestedPrice;
  const totalPayout = Math.round(currentQuantityNum * currentPriceNum);

  return (
    <div className="low-lit-portal">
      {/* Top Header: Language Selector & High-Visibility Audio Narrator */}
      <div className="low-lit-header-row">
        <div className="low-lit-lang-selector">
          <button
            type="button"
            onClick={() => setLanguage && setLanguage('ta')}
            className={`low-lit-lang-btn ${currentLang === 'ta' ? 'active' : ''}`}
          >
            தமிழ்
          </button>
          <button
            type="button"
            onClick={() => setLanguage && setLanguage('en')}
            className={`low-lit-lang-btn ${currentLang === 'en' ? 'active' : ''}`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage && setLanguage('hi')}
            className={`low-lit-lang-btn ${currentLang === 'hi' ? 'active' : ''}`}
          >
            हिन्दी
          </button>
        </div>

        {/* Big "Hear this page" Button (min 56px height) */}
        <button
          type="button"
          id="btn-hear-page"
          onClick={() => speakScreen()}
          className={`btn-hear-page ${isSpeaking ? 'speaking' : ''}`}
          aria-label="Hear this page aloud"
        >
          {isSpeaking ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          <span>
            {isSpeaking 
              ? (currentLang === 'ta' ? 'நிறுத்து' : currentLang === 'hi' ? 'रोकें' : 'Stop Audio')
              : (currentLang === 'ta' ? '🔊 கேட்க' : currentLang === 'hi' ? '🔊 सुनें' : '🔊 Hear this page')}
          </span>
        </button>
      </div>

      {/* 4-Step Progress Stepper */}
      <div className="low-lit-stepper" aria-label="Creation Flow Progress">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`low-lit-step-item ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}
        >
          <div className="low-lit-step-circle">
            {step > 1 ? <Check className="w-5 h-5" /> : '1'}
          </div>
          <span className="low-lit-step-label">
            {currentLang === 'ta' ? 'பயிர்' : currentLang === 'hi' ? 'फसल' : 'Crop'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => step > 2 && setStep(2)}
          disabled={step < 2}
          className={`low-lit-step-item ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}
        >
          <div className="low-lit-step-circle">
            {step > 2 ? <Check className="w-5 h-5" /> : '2'}
          </div>
          <span className="low-lit-step-label">
            {currentLang === 'ta' ? 'அளவு' : currentLang === 'hi' ? 'मात्रा' : 'Quantity'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => step > 3 && setStep(3)}
          disabled={step < 3}
          className={`low-lit-step-item ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}
        >
          <div className="low-lit-step-circle">
            {step > 3 ? <Check className="w-5 h-5" /> : '3'}
          </div>
          <span className="low-lit-step-label">
            {currentLang === 'ta' ? 'விலை' : currentLang === 'hi' ? 'मूल्य' : 'Price'}
          </span>
        </button>

        <button
          type="button"
          disabled={step < 4}
          className={`low-lit-step-item ${step === 4 ? 'active' : ''}`}
        >
          <div className="low-lit-step-circle">
            {step === 4 ? <Check className="w-5 h-5" /> : '4'}
          </div>
          <span className="low-lit-step-label">
            {currentLang === 'ta' ? 'உறுதி' : currentLang === 'hi' ? 'पुष्टि' : 'Pass'}
          </span>
        </button>
      </div>

      {/* Main Wizard Card */}
      <div className="low-lit-card">
        {/* ====================================================================
            SCREEN 1: CROP SELECTION SCREEN (SCROLLABLE REFLOWING GRID)
            ==================================================================== */}
        {step === 1 && (
          <div id="screen-crop-selection">
            <div className="screen-title-banner">
              <h2 className="screen-title">
                <span style={{ fontSize: '1.8rem' }}>🌱</span>
                <span>
                  {currentLang === 'ta' 
                    ? '1. பயிரைத் தேர்வு செய்யவும்' 
                    : currentLang === 'hi' 
                    ? '1. फसल चुनें' 
                    : '1. Select Crop'}
                </span>
              </h2>
              <span className="screen-badge">
                {CROPS_CONFIG.length} {currentLang === 'ta' ? 'பயிர்கள்' : 'Crops'}
              </span>
            </div>

            {/* Agent 2 Live Quality Scanner Direct Launch Shortcut */}
            <div 
              className="farmer-agent2-banner" 
              onClick={() => onNavigateMultiagent && onNavigateMultiagent()}
              role="button"
              tabIndex={0}
              title="Launch Agent 2 Live Scanner"
            >
              <div className="farmer-agent2-left">
                <div className="farmer-agent2-icon-wrap">
                  <Camera className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="farmer-agent2-title">
                    {currentLang === 'ta' 
                      ? '🤖 Agent 2: நேரலை AI கேமரா தர ஆய்வு' 
                      : currentLang === 'hi' 
                      ? '🤖 Agent 2: लाइव एआई कैमरा गुणवत्ता ग्रेडिंग' 
                      : '🤖 Agent 2: Live AI Camera Produce Grading'}
                  </div>
                  <div className="farmer-agent2-desc">
                    {currentLang === 'ta' 
                      ? 'மொபைல்/வெப்கேம் மற்றும் குரல் வழிகாட்டலுடன் நேரலை தரம் மற்றும் விலை காண்க' 
                      : currentLang === 'hi' 
                      ? 'मोबाइल/वेबकैम और वॉइस गाइडेंस से रीयल-टाइम ग्रेडिंग प्राप्त करें' 
                      : 'Real-time multi-angle video scan with voice guidance & instant dynamic pricing'}
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                className="btn-launch-scanner-shortcut"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onNavigateMultiagent) onNavigateMultiagent();
                }}
              >
                <span>{currentLang === 'ta' ? 'கேமரா திற' : currentLang === 'hi' ? 'कैमरा खोलें' : 'Open Scanner'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Container with Realistic Vegetable Photographs (Agent 1) */}
            <div className="crop-cards-scroll-container">
              <div className="crop-cards-grid">
                {CROPS_CONFIG.map((crop) => {
                  const localized = currentLang === 'ta' ? crop.ta : currentLang === 'hi' ? crop.hi : crop.name;
                  const isSelected = selectedCrop.id === crop.id;

                  return (
                    <button
                      key={crop.id}
                      type="button"
                      id={`crop-card-${crop.id}`}
                      onClick={() => handleSelectCrop(crop)}
                      className={`crop-card-button ${isSelected ? 'selected' : ''}`}
                      aria-label={`Select ${crop.name}`}
                    >
                      <div className="crop-card-photo-frame">
                        <img 
                          src={crop.image || getCropImage(crop.id)} 
                          alt={localized} 
                          className="crop-card-real-photo"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const sibling = e.target.nextElementSibling;
                            if (sibling) sibling.style.display = 'block';
                          }}
                        />
                        <span className="crop-card-emoji" style={{ display: 'none' }}>{crop.icon}</span>
                      </div>
                      <span className="crop-card-title">{localized}</span>
                      <span className="crop-card-subname">
                        {currentLang !== 'en' ? crop.name : `₹${crop.defaultPrice}/kg`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            SCREEN 2: QUANTITY SCREEN WITH NUMERIC KEYPAD
            ==================================================================== */}
        {step === 2 && (
          <div id="screen-quantity-keypad">
            <div className="screen-title-banner">
              <button
                type="button"
                id="btn-back-to-crops"
                onClick={() => setStep(1)}
                className="btn-screen-back"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{currentLang === 'ta' ? 'பயிர்' : currentLang === 'hi' ? 'पीछे' : 'Back'}</span>
              </button>

              <div className="crop-summary-pill" style={{ margin: 0 }}>
                <img 
                  src={selectedCrop.image || getCropImage(selectedCrop.id)} 
                  alt={selectedCropName} 
                  className="crop-pill-thumb"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'inline';
                  }}
                />
                <span style={{ fontSize: '1.6rem', display: 'none' }}>{selectedCrop.icon}</span>
                <span>{selectedCropName}</span>
              </div>
            </div>

            {/* Large Bold Running Total Display */}
            <div className="quantity-hero-container">
              <div className="quantity-display-box" id="quantity-display">
                <span className="quantity-digits">{quantityStr || '0'}</span>
                <span className="quantity-unit-tag">kg</span>
              </div>

              {/* Quick Increment Shortcut Chips */}
              <div className="quick-qty-row">
                <button
                  type="button"
                  onClick={() => handleAddQuantity(5)}
                  className="quick-qty-chip"
                >
                  +5 kg
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuantity(10)}
                  className="quick-qty-chip"
                >
                  +10 kg
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuantity(50)}
                  className="quick-qty-chip"
                >
                  +50 kg
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuantity(100)}
                  className="quick-qty-chip"
                >
                  +100 kg
                </button>
              </div>
            </div>

            {/* On-Screen 0-9 Numeric Keypad */}
            <div className="numeric-keypad-grid" role="group" aria-label="Quantity Keypad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  id={`keypad-${num}`}
                  onClick={() => handleKeypadPress(num)}
                  className="keypad-btn"
                >
                  {num}
                </button>
              ))}

              {/* Clear Button */}
              <button
                type="button"
                id="keypad-clear"
                onClick={() => handleKeypadPress('CLEAR')}
                className="keypad-btn keypad-btn-clear"
                aria-label="Clear Quantity"
              >
                C
              </button>

              {/* Zero */}
              <button
                type="button"
                id="keypad-0"
                onClick={() => handleKeypadPress(0)}
                className="keypad-btn"
              >
                0
              </button>

              {/* Backspace Button */}
              <button
                type="button"
                id="keypad-backspace"
                onClick={() => handleKeypadPress('BACKSPACE')}
                className="keypad-btn keypad-btn-backspace"
                aria-label="Backspace"
              >
                <Delete className="w-7 h-7" />
              </button>
            </div>

            {/* Big Green Proceed Button */}
            <button
              type="button"
              id="btn-confirm-quantity"
              onClick={handleConfirmQuantity}
              disabled={!quantityStr || Number(quantityStr) <= 0}
              className="btn-action-next"
            >
              <span>{currentLang === 'ta' ? 'அடுத்த படி' : currentLang === 'hi' ? 'अगला' : 'Next'}</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* ====================================================================
            SCREEN 3: PRICE SCREEN WITH LARGE ₹ NUMBER AND ACCEPT / REJECT
            ==================================================================== */}
        {step === 3 && (
          <div id="screen-price-verification">
            <div className="screen-title-banner">
              <button
                type="button"
                id="btn-back-to-quantity"
                onClick={() => setStep(2)}
                className="btn-screen-back"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{currentLang === 'ta' ? 'அளவு' : currentLang === 'hi' ? 'मात्रा' : 'Back'}</span>
              </button>

              <div className="crop-summary-pill" style={{ margin: 0 }}>
                <img 
                  src={selectedCrop.image || getCropImage(selectedCrop.id)} 
                  alt={selectedCropName} 
                  className="crop-pill-thumb"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'inline';
                  }}
                />
                <span style={{ fontSize: '1.5rem', display: 'none' }}>{selectedCrop.icon}</span>
                <span>{selectedCropName} • {quantityStr} kg</span>
              </div>
            </div>

            {/* Loading Indicator */}
            {loadingPrice && (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#34d399' }}>
                <RefreshCw className="w-8 h-8 animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ fontWeight: 700 }}>
                  {currentLang === 'ta' ? 'மண்டி விலை பெறப்படுகிறது...' : 'Fetching Mandi rate...'}
                </p>
              </div>
            )}

            {/* Hero Price Display: ONE LARGE NUMBER WITH ₹ SYMBOL */}
            <div className="price-display-wrapper">
              <div className="price-source-tag">
                <Sparkles className="w-4 h-4" />
                <span>
                  {currentLang === 'ta' ? 'அரசு மண்டி விலை' : currentLang === 'hi' ? 'सरकारी मंडी दर' : 'Official APMC Mandi Rate'}
                </span>
              </div>

              <div className="price-hero-stat" id="price-hero-stat">
                <span className="price-symbol">₹</span>
                <span className="price-massive-val">{currentPriceNum}</span>
                <span className="price-unit">/ kg</span>
              </div>

              <div className="payout-preview-text">
                <span>{currentLang === 'ta' ? 'மொத்த மதிப்பு: ' : currentLang === 'hi' ? 'कुल राशि: ' : 'Total Payout: '}</span>
                <strong>₹{totalPayout.toLocaleString()}</strong>
              </div>
            </div>

            {/* AI FAIR PRICE RECOMMENDATION CARD */}
            {mlRecommendation && (
              <div className="farmer-ml-card" style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 78, 59, 0.2))',
                border: '1px solid rgba(46, 204, 113, 0.35)',
                borderRadius: '16px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.25)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#2ecc71', color: '#064e3b', fontWeight: 800, fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                      AI Fair Price Recommendation
                    </span>
                    <span style={{ fontSize: '0.82rem', color: '#a7f3d0', fontWeight: 600 }}>
                      Model: {mlRecommendation.model?.version || 'v1.0'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Mandi Baseline: ₹{mlRecommendation.marketReferencePrice || suggestedPrice}/kg
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', background: 'rgba(0, 0, 0, 0.3)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                      {currentLang === 'ta' ? 'பரிந்துரைக்கப்பட்ட உழவர் வரம்பு (Farmer → Intermediary):' : currentLang === 'hi' ? 'अनुशंसित किसान मूल्य सीमा:' : 'Recommended Farmer → Intermediary Range:'}
                    </span>
                    <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#34d399', letterSpacing: '-0.5px' }}>
                      ₹{mlRecommendation.recommendations?.farmerToIntermediary?.lower} – ₹{mlRecommendation.recommendations?.farmerToIntermediary?.upper}
                      <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}> / kg</span>
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Expected Fair Price</span>
                    <strong style={{ fontSize: '1.3rem', color: '#f59e0b' }}>
                      ₹{mlRecommendation.recommendations?.farmerToIntermediary?.expected}/kg
                    </strong>
                  </div>
                </div>

                {/* Factors Explainability */}
                <div style={{ marginTop: '0.9rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', display: 'block', marginBottom: '6px' }}>
                    💡 {currentLang === 'ta' ? 'விலை வரம்பிற்கான முக்கிய காரணிகள்:' : 'Why this range? (Top Market Factors):'}
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(mlRecommendation.explanation?.topFactors || []).slice(0, 4).map((factor, idx) => (
                      <span key={idx} style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '3px 8px',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        color: '#cbd5e1'
                      }}>
                        • {factor.factor} <span style={{ color: '#34d399' }}>({factor.impact})</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: '#6ee7b7', opacity: 0.9 }}>
                  ℹ️ {mlRecommendation.disclaimer}
                </div>
              </div>
            )}

            {/* Error banner if any */}
            {errorMsg && (
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '12px', color: '#f87171', marginBottom: '1.25rem', textAlign: 'center', fontWeight: 700 }}>
                {errorMsg}
              </div>
            )}

            {/* Custom Price Numeric Keypad Panel (if Reject is clicked) */}
            {isCustomPriceMode && (
              <div className="custom-price-panel" id="custom-price-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 800, color: '#fbbf24', fontSize: '1.05rem' }}>
                    {currentLang === 'ta' ? 'உங்கள் விலையை மாற்றவும் (₹/kg):' : 'Enter Your Custom Price (₹/kg):'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCustomPriceMode(false)}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setCustomPriceStr(String(Math.max(1, (Number(customPriceStr) || suggestedPrice) - 1)))}
                    className="btn-screen-back"
                    style={{ fontSize: '1.4rem', fontWeight: 900, minWidth: '60px' }}
                  >
                    - 1
                  </button>
                  <div style={{ background: '#000', border: '2px solid #fbbf24', borderRadius: '12px', padding: '0.5rem 1.5rem', fontSize: '2rem', fontWeight: 900, color: '#fbbf24' }}>
                    ₹{customPriceStr || '0'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomPriceStr(String((Number(customPriceStr) || suggestedPrice) + 1))}
                    className="btn-screen-back"
                    style={{ fontSize: '1.4rem', fontWeight: 900, minWidth: '60px' }}
                  >
                    + 1
                  </button>
                </div>
              </div>
            )}

            {/* Big Dual Action Buttons: ACCEPT (Green) and REJECT (Red) */}
            <div className="price-action-grid">
              {/* Accept Button: Calls POST /batch */}
              <button
                type="button"
                id="btn-accept-price"
                disabled={submitting}
                onClick={handleAcceptPrice}
                className="btn-price-accept"
                aria-label="Accept Price"
              >
                {submitting ? (
                  <RefreshCw className="w-8 h-8 animate-spin" />
                ) : (
                  <>
                    <Check className="w-10 h-10" strokeWidth={3} />
                    <span className="price-btn-label">
                      {currentLang === 'ta' ? 'ஏற்கிறேன்' : currentLang === 'hi' ? 'स्वीकार' : 'Accept'}
                    </span>
                  </>
                )}
              </button>

              {/* Reject Button */}
              <button
                type="button"
                id="btn-reject-price"
                disabled={submitting}
                onClick={handleRejectPrice}
                className="btn-price-reject"
                aria-label="Reject Price"
              >
                <X className="w-10 h-10" strokeWidth={3} />
                <span className="price-btn-label">
                  {currentLang === 'ta' ? 'நிராகரி' : currentLang === 'hi' ? 'अस्वीकार' : 'Reject'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ====================================================================
            SCREEN 4: CONFIRMATION & LARGE CENTERED QR CODE
            ==================================================================== */}
        {step === 4 && createdBatch && (
          <div id="screen-qr-confirmation" className="confirmation-wrapper">
            {/* Celebration Badge */}
            <div className="confirmation-celebration-badge">
              <CheckCircle2 className="w-7 h-7" />
              <span>
                {currentLang === 'ta' ? 'உழவர் பாஸ் உருவாக்கப்பட்டது!' : currentLang === 'hi' ? 'किसान पास बन गया!' : 'Pass Created!'}
              </span>
            </div>

            {/* Large Centered QR Code Box */}
            <div className="large-qr-container" id="large-qr-container">
              <img
                src={createdBatch.qrCode}
                alt={`Official Mandi QR Code for Batch ${createdBatch.batchId}`}
                className="large-qr-image"
              />
              <span className="qr-official-tag">Official Mandi QR</span>
              <span className="qr-scan-hint">
                {currentLang === 'ta' ? 'ஸ்கேன் செய்து சரிபார்க்கவும்' : 'Scan to Verify on Blockchain'}
              </span>
            </div>

            {/* Batch ID with Copy */}
            <div className="batch-id-pill-row">
              <span>{createdBatch.batchId}</span>
              <button
                type="button"
                onClick={copyBatchId}
                className="btn-copy-id"
                title="Copy Batch ID"
              >
                <Copy className="w-4 h-4" />
                {copied ? '✓' : ''}
              </button>
            </div>

            {/* Summary Grid */}
            <div className="confirm-summary-grid">
              <div className="confirm-summary-item">
                <span className="confirm-summary-label">
                  {currentLang === 'ta' ? 'பயிர்' : 'Crop'}
                </span>
                <span className="confirm-summary-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                  <img 
                    src={selectedCrop.image || getCropImage(selectedCrop.id)} 
                    alt={selectedCropName} 
                    style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }}
                  />
                  {selectedCropName}
                </span>
              </div>

              <div className="confirm-summary-item">
                <span className="confirm-summary-label">
                  {currentLang === 'ta' ? 'அளவு' : 'Quantity'}
                </span>
                <span className="confirm-summary-value">
                  {quantityStr} kg
                </span>
              </div>

              <div className="confirm-summary-item">
                <span className="confirm-summary-label">
                  {currentLang === 'ta' ? 'விலை' : 'Rate'}
                </span>
                <span className="confirm-summary-value" style={{ color: '#34d399' }}>
                  ₹{currentPriceNum} / kg
                </span>
              </div>

              <div className="confirm-summary-item">
                <span className="confirm-summary-label">
                  {currentLang === 'ta' ? 'லெட்ஜர்' : 'Blockchain'}
                </span>
                <span className="confirm-summary-value" style={{ color: '#38bdf8' }}>
                  Block #0 Sealed
                </span>
              </div>
            </div>

            {/* Big "Done" Button back to start */}
            <button
              type="button"
              id="btn-done-flow"
              onClick={handleDone}
              className="btn-action-done"
            >
              <Check className="w-7 h-7" strokeWidth={3} />
              <span>{currentLang === 'ta' ? 'முடிந்தது' : currentLang === 'hi' ? 'पूर्ण' : 'Done'}</span>
            </button>

            {/* Secondary Navigation Links */}
            <div className="secondary-nav-row">
              {onNavigateTransfer && (
                <button
                  type="button"
                  id="btn-go-transfer"
                  onClick={() => onNavigateTransfer(createdBatch.batchId)}
                  className="btn-nav-secondary"
                >
                  <span>{currentLang === 'ta' ? 'கைமாற்று' : 'Transfer Produce'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {onNavigateTrack && (
                <button
                  type="button"
                  id="btn-go-track"
                  onClick={() => onNavigateTrack(createdBatch.batchId)}
                  className="btn-nav-secondary"
                >
                  <span>{currentLang === 'ta' ? 'சரிபார்' : 'Track Produce'}</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
