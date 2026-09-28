import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, SwitchCamera, Video, Sparkles, AlertCircle, CheckCircle2, 
  RotateCcw, ArrowRight, Volume2, VolumeX, Maximize2, ShieldCheck, 
  Zap, Scan, RefreshCw, Key, ExternalLink, QrCode, Download, ChevronRight,
  Sliders, Info, HelpCircle
} from 'lucide-react';
import { 
  DIRECTIONAL_STEPS, gradeVegetableFrame, speakGuidance, 
  getStoredGeminiKey, saveStoredGeminiKey 
} from '../../services/geminiVisionService';
import { mintGradedBatch } from '../../services/qrBlockchainService';
import { CROPS_CONFIG } from '../../config/crops';
import './LiveProduceScanner.css';

export default function LiveProduceScanner({
  preselectedCrop = null,
  currentLang = 'ta',
  authenticatedUser = null,
  onBatchMinted = null,
  onNavigateToPassport = null
}) {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [streamActive, setStreamActive] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  // Scanning & Guidance State
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(preselectedCrop || 'tomato');
  const [gradingResult, setGradingResult] = useState(null);
  const [mintedBatch, setMintedBatch] = useState(null);
  const [isMinting, setIsMinting] = useState(false);

  // Gemini API Key config modal state
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(getStoredGeminiKey());

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // 1. Enumerate and initialize camera devices
  useEffect(() => {
    async function loadCameras() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          setStreamError('Camera API not supported on this browser or connection.');
          return;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length > 0 && !selectedCameraId) {
          // Default to back camera if available on mobile
          const backCam = videoDevices.find(d => /back|rear|environment/i.test(d.label));
          setSelectedCameraId(backCam ? backCam.deviceId : videoDevices[0].deviceId);
        }
      } catch (err) {
        console.warn('Device enumeration error:', err);
      }
    }
    loadCameras();
  }, []);

  // 2. Start/Restart video stream on camera switch
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [selectedCameraId, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setStreamError(null);
    try {
      const constraints = {
        video: selectedCameraId 
          ? { deviceId: { exact: selectedCameraId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreamActive(true);

      // Check flashlight/torch capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        setTorchSupported(true);
      }
    } catch (err) {
      console.warn('Camera stream request error:', err);
      setStreamActive(false);
      setStreamError(
        err.name === 'NotAllowedError' 
          ? 'Camera permission denied. Please allow camera access in browser settings.' 
          : 'Could not access camera feed. Using high-resolution static frame simulation mode.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  };

  const toggleTorch = async () => {
    if (!streamRef.current || !torchSupported) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn }]
      });
      setTorchOn(!torchOn);
    } catch (e) {
      console.warn('Torch constraint error:', e);
    }
  };

  const flipCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // 3. Directional Guidance Progression
  const currentStep = DIRECTIONAL_STEPS[currentStepIdx] || DIRECTIONAL_STEPS[0];

  const handleNextGuidance = () => {
    const nextIdx = (currentStepIdx + 1) % DIRECTIONAL_STEPS.length;
    setCurrentStepIdx(nextIdx);
    const stepObj = DIRECTIONAL_STEPS[nextIdx];
    if (voiceEnabled) {
      const speechText = currentLang === 'ta' ? stepObj.speechTa : stepObj.speech;
      speakGuidance(speechText, currentLang);
    }
  };

  // 4. Capture current frame from video
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // 5. Trigger Agent 2 Quality Grading
  const handlePerformGrading = async () => {
    setIsAnalyzing(true);
    setGradingResult(null);
    setMintedBatch(null);

    // Speak audio cue
    if (voiceEnabled) {
      const msg = currentLang === 'ta' 
        ? 'தரம் கணக்கிடப்படுகிறது. சற்று பொறுக்கவும்.' 
        : 'Analyzing produce via Gemini Vision. Please hold.';
      speakGuidance(msg, currentLang);
    }

    try {
      let base64Frame = captureFrame();
      // If camera wasn't active or available, use selected crop's realistic studio image
      if (!base64Frame) {
        const cropObj = CROPS_CONFIG.find(c => c.id === selectedCrop) || CROPS_CONFIG[0];
        base64Frame = cropObj.image;
      }

      const result = await gradeVegetableFrame(base64Frame, selectedCrop);
      setGradingResult(result);

      if (voiceEnabled) {
        const announce = currentLang === 'ta'
          ? `${result.tamilName} ${result.grade} தரம் உறுதி செய்யப்பட்டது. விலை ஒரு கிலோவிற்கு ரூபாய் ${result.dynamicPrice}.`
          : `${result.vegetable} graded as ${result.grade}. Dynamic price set to Rupees ${result.dynamicPrice} per kilogram.`;
        speakGuidance(announce, currentLang);
      }
    } catch (err) {
      console.error('Grading error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 6. Handover to Agent 3: Mint Blockchain Batch & Generate QR
  const handleMintBlockchainBatch = async () => {
    if (!gradingResult) return;
    setIsMinting(true);
    try {
      const mintResult = await mintGradedBatch({
        gradingResult,
        quantity: 150,
        unit: 'kg',
        authenticatedUser
      });

      if (mintResult?.success) {
        setMintedBatch(mintResult);
        if (onBatchMinted) {
          onBatchMinted(mintResult.batch);
        }
        if (voiceEnabled) {
          const msg = currentLang === 'ta'
            ? 'பிளாக்செயின் பதிவு வெற்றிகரமாக முடிந்தது. டிஜிட்டல் பாஸ் உருவாக்கப்பட்டது.'
            : 'Blockchain block mined successfully. Digital QR pass is ready.';
          speakGuidance(msg, currentLang);
        }
      }
    } catch (err) {
      console.error('Blockchain mint error:', err);
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="live-scanner-container">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Top Agent 2 Banner & Hardware Selector */}
      <div className="scanner-top-bar">
        <div className="agent-identity">
          <div className="agent-indicator-pulse"></div>
          <div>
            <div className="agent-title-row">
              <span className="agent-tag">AGENT 2</span>
              <span className="agent-name">
                {currentLang === 'ta' ? 'நேரலை காய்கறி ஸ்கேனர் & தர நிர்ணய முகவர்' : 'Live Vegetable Scanning & Grading Agent'}
              </span>
            </div>
            <span className="agent-engine-badge">
              Powered by Google Gemini Vision & APMC Quality Standards
            </span>
          </div>
        </div>

        <div className="scanner-hardware-controls">
          {/* Camera Selector Dropdown (Mobile back/front + PC webcams) */}
          {cameras.length > 0 && (
            <div className="device-select-wrap">
              <Camera className="w-4 h-4 text-emerald-400" />
              <select 
                className="device-dropdown"
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                title="Select Camera Input"
              >
                {cameras.map((c, i) => (
                  <option key={c.deviceId || i} value={c.deviceId}>
                    {c.label || `Camera ${i + 1} (${c.deviceId.slice(0, 5)})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Flip for Mobile Devices */}
          <button 
            type="button" 
            className="tool-btn" 
            onClick={flipCamera} 
            title="Switch Front / Rear Camera"
          >
            <SwitchCamera className="w-4 h-4" />
          </button>

          {/* Torch toggle if supported */}
          {torchSupported && (
            <button 
              type="button" 
              className={`tool-btn ${torchOn ? 'active' : ''}`}
              onClick={toggleTorch}
              title="Toggle Flashlight / Torch"
            >
              <Zap className="w-4 h-4" />
            </button>
          )}

          {/* Voice Guidance Toggle */}
          <button 
            type="button" 
            className={`tool-btn ${voiceEnabled ? 'active' : ''}`}
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            title={voiceEnabled ? 'Mute Voice Guidance' : 'Enable Voice Guidance'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Gemini API Key Configuration */}
          <button
            type="button"
            className="tool-btn"
            onClick={() => setShowApiKeyModal(true)}
            title="Configure Gemini API Key"
          >
            <Key className="w-4 h-4 text-amber-300" />
          </button>
        </div>
      </div>

      {/* Main Viewfinder Grid */}
      <div className="scanner-viewfinder-grid">
        {/* Left Column: Live Camera Video Stream & Guidance HUD */}
        <div className="viewfinder-col">
          <div className="video-feed-wrapper">
            {streamError ? (
              <div className="video-fallback-box">
                <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
                <p className="fallback-text">{streamError}</p>
                <div className="simulated-viewfinder-preview">
                  <img 
                    src={CROPS_CONFIG.find(c => c.id === selectedCrop)?.image || '/images/vegetables/tomato.jpg'} 
                    alt="Produce Preview"
                    className="simulated-preview-img"
                  />
                  <div className="hud-laser-line"></div>
                </div>
              </div>
            ) : (
              <video 
                ref={videoRef}
                className="live-video-element"
                autoPlay 
                playsInline 
                muted 
              />
            )}

            {/* High-Tech Holographic HUD Reticle */}
            <div className="hud-overlay-layer">
              <div className="hud-corner top-left"></div>
              <div className="hud-corner top-right"></div>
              <div className="hud-corner bottom-left"></div>
              <div className="hud-corner bottom-right"></div>

              <div className="hud-laser-scanner"></div>

              <div className="hud-center-crosshair">
                <div className="crosshair-ring"></div>
                <div className="crosshair-dot"></div>
              </div>

              {/* Real-Time Directional Guidance Banner */}
              <div className="hud-guidance-card">
                <div className="guidance-step-pill">
                  <span>STEP {currentStep.step} / 4</span>
                  <span className="sep">•</span>
                  <span>{currentLang === 'ta' ? currentStep.titleTa : currentStep.title}</span>
                </div>
                <div className="guidance-main-msg">
                  <span className="guidance-pulse-icon">🧭</span>
                  <span className="guidance-instruction-text">
                    {currentLang === 'ta' ? currentStep.instructionTa : currentStep.instruction}
                  </span>
                </div>
                <div className="guidance-action-hint">
                  {currentStep.actionPrompt}
                </div>
              </div>
            </div>

            {/* Bottom In-Feed Bar: Directional Next Step Button */}
            <div className="viewfinder-bottom-controls">
              <button 
                type="button" 
                className="btn-guidance-cycle"
                onClick={handleNextGuidance}
                title="Change Directional Angle"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{currentLang === 'ta' ? 'அடுத்த கோணம் (Next Guidance Angle)' : 'Next Angle Guidance'}</span>
              </button>

              <button 
                type="button" 
                id="btn-trigger-gemini-grade"
                className={`btn-scan-trigger ${isAnalyzing ? 'loading' : ''}`}
                onClick={handlePerformGrading}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{currentLang === 'ta' ? 'AI ஆய்வு நிகழ்கிறது...' : 'Analyzing Multi-Frame Stream...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>{currentLang === 'ta' ? '🔬 காய்கறி தரம் கணக்கிடுக' : 'Analyze & Grade Produce (Gemini)'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Target Crop Selector */}
          <div className="target-crop-ribbon">
            <span className="ribbon-label">
              {currentLang === 'ta' ? 'ஆய்வு செய்யப்படும் காய்கறி:' : 'Target Vegetable:'}
            </span>
            <div className="crop-pill-track">
              {CROPS_CONFIG.slice(0, 8).map(crop => (
                <button
                  key={crop.id}
                  type="button"
                  className={`crop-chip-btn ${selectedCrop === crop.id ? 'active' : ''}`}
                  onClick={() => setSelectedCrop(crop.id)}
                >
                  <img src={crop.image} alt={crop.name} className="chip-crop-thumb" />
                  <span>{currentLang === 'ta' ? crop.ta : crop.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Agent 2 Grading Result & Agent 3 Blockchain Pass Handover */}
        <div className="grading-results-col">
          {!gradingResult ? (
            <div className="grading-placeholder-card">
              <div className="placeholder-icon-wrap">
                <Scan className="w-12 h-12 text-emerald-400 animate-pulse" />
              </div>
              <h3 className="placeholder-title">
                {currentLang === 'ta' ? 'ஆய்வுக்கு தயாராக உள்ளது' : 'Vision Inspection Ready'}
              </h3>
              <p className="placeholder-desc">
                {currentLang === 'ta'
                  ? 'காய்கறியை கேமராவின் முன் பிடித்து "காய்கறி தரம் கணக்கிடுக" பொத்தானை அழுத்தவும். AI தானாகவே தரம் மற்றும் சந்தை விலையை நிர்ணயிக்கும்.'
                  : 'Point camera at produce and tap "Analyze & Grade Produce". The Gemini Vision Agent will dynamically inspect size, color, ripeness, defects, and compute the official APMC price tier.'}
              </p>
              
              <div className="inspection-checklist">
                <div className="check-item">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Directional Guidance (Angle, Distance, Calyx)</span>
                </div>
                <div className="check-item">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Multi-Tier Pricing (+15% Grade-A / -20% Grade-C)</span>
                </div>
                <div className="check-item">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Automatic Handover to Agent 3 Blockchain Pass</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grading-report-card">
              {/* Card Header with Verified Grade Badge */}
              <div className="report-header">
                <div className="produce-id-group">
                  <img 
                    src={gradingResult.photoUrl} 
                    alt={gradingResult.vegetable} 
                    className="report-crop-photo"
                  />
                  <div>
                    <h2 className="report-crop-name">{gradingResult.vegetable}</h2>
                    <span className="report-tamil-name">
                      {gradingResult.tamilName} • <em>{gradingResult.botanicalName}</em>
                    </span>
                  </div>
                </div>

                <div className={`grade-crown-badge ${gradingResult.grade.toLowerCase().replace(/\s+/g, '-')}`}>
                  <span className="grade-badge-title">{gradingResult.grade}</span>
                  <span className="grade-badge-sub">{(gradingResult.confidence * 100).toFixed(1)}% Conf</span>
                </div>
              </div>

              {/* Dynamic Price Tier Announcement */}
              <div className="price-tier-banner">
                <div className="price-block">
                  <span className="price-label">
                    {currentLang === 'ta' ? 'அடிப்படை மண்டி விலை' : 'Base Mandi Benchmark'}
                  </span>
                  <span className="price-val muted">₹{gradingResult.baseMandiPrice}/kg</span>
                </div>

                <div className="price-arrow">➔</div>

                <div className="price-block highlight">
                  <span className="price-label">
                    {currentLang === 'ta' ? 'AI தர நிர்ணய விலை' : 'Dynamic Graded Price'}
                  </span>
                  <span className="price-val emerald">
                    ₹{gradingResult.dynamicPrice}
                    <span className="price-unit">/kg</span>
                  </span>
                  <span className="price-multiplier-tag">
                    {gradingResult.priceMultiplier >= 1.0 
                      ? `+${((gradingResult.priceMultiplier - 1) * 100).toFixed(0)}% Premium` 
                      : `-${((1 - gradingResult.priceMultiplier) * 100).toFixed(0)}% Markdown`}
                  </span>
                </div>
              </div>

              {/* Quality Indicators & Defect Gauges */}
              <div className="quality-metrics-grid">
                <div className="metric-cell">
                  <span className="metric-name">{currentLang === 'ta' ? 'பழுத்த நிலை (Ripeness)' : 'Ripeness'}</span>
                  <div className="metric-bar-bg">
                    <div className="metric-bar-fill emerald" style={{ width: `${gradingResult.ripenessScore}%` }}></div>
                  </div>
                  <span className="metric-num">{gradingResult.ripenessScore}%</span>
                </div>

                <div className="metric-cell">
                  <span className="metric-name">{currentLang === 'ta' ? 'பசுமை குறியீடு (Freshness)' : 'Freshness'}</span>
                  <div className="metric-bar-bg">
                    <div className="metric-bar-fill sky" style={{ width: `${gradingResult.freshnessScore}%` }}></div>
                  </div>
                  <span className="metric-num">{gradingResult.freshnessScore}%</span>
                </div>

                <div className="metric-cell">
                  <span className="metric-name">{currentLang === 'ta' ? 'காயங்கள் (Defects)' : 'Defects/Trauma'}</span>
                  <div className="metric-bar-bg">
                    <div className="metric-bar-fill red" style={{ width: `${Math.min(gradingResult.defectPercentage * 3, 100)}%` }}></div>
                  </div>
                  <span className="metric-num">{gradingResult.defectPercentage}%</span>
                </div>

                <div className="metric-cell">
                  <span className="metric-name">{currentLang === 'ta' ? 'உறுதித்தன்மை (Firmness)' : 'Firmness'}</span>
                  <span className="metric-text-val">{gradingResult.firmnessEstimate}</span>
                </div>
              </div>

              {/* Summary Notes */}
              <div className="report-summary-box">
                <p className="summary-text">
                  {currentLang === 'ta' ? gradingResult.summaryTa : gradingResult.summary}
                </p>
                <div className="defects-tag-list">
                  {gradingResult.defectsDetected.map((d, i) => (
                    <span key={i} className="defect-pill">⚠️ {d}</span>
                  ))}
                </div>
              </div>

              {/* Handover to Agent 3 Action */}
              {!mintedBatch ? (
                <div className="agent-handover-action">
                  <button 
                    type="button" 
                    id="btn-mint-agent3-batch"
                    className={`btn-agent3-handover ${isMinting ? 'loading' : ''}`}
                    onClick={handleMintBlockchainBatch}
                    disabled={isMinting}
                  >
                    {isMinting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>{currentLang === 'ta' ? 'பிளாக்செயின் பதிவு நிகழ்கிறது...' : 'Agent 3: Minting SHA-256 Ledger Block...'}</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-5 h-5 text-amber-300" />
                        <span>
                          {currentLang === 'ta' 
                            ? '🔗 முகவர் 3: QR குறியீடு & பிளாக்செயின் பாஸ் உருவாக்குக' 
                            : 'Handover to Agent 3: Mint Blockchain & Generate QR Pass'}
                        </span>
                      </>
                    )}
                  </button>
                  <span className="handover-subtext">
                    Cryptographically seals grade, dynamic price, and APMC compliance into Block #0
                  </span>
                </div>
              ) : (
                /* Agent 3 Generated Blockchain Pass Card */
                <div className="minted-pass-card">
                  <div className="pass-card-top">
                    <span className="official-stamp">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      OFFICIAL AGMARK MINT
                    </span>
                    <span className="pass-batch-id">{mintedBatch.batchId}</span>
                  </div>

                  <div className="pass-body-flex">
                    <div className="pass-qr-frame">
                      <img src={mintedBatch.qrCodeUrl} alt="Batch QR Code" className="qr-img-large" />
                      <span className="qr-sub-tag">Scan for Provenance</span>
                    </div>

                    <div className="pass-details-list">
                      <div className="detail-row">
                        <span className="lbl">Block Hash:</span>
                        <span className="val mono">{mintedBatch.blockHash.slice(0, 16)}...</span>
                      </div>
                      <div className="detail-row">
                        <span className="lbl">FSSAI Lic:</span>
                        <span className="val">{mintedBatch.complianceData.fssaiLicense}</span>
                      </div>
                      <div className="detail-row">
                        <span className="lbl">Standard:</span>
                        <span className="val highlight">{mintedBatch.complianceData.agmarkStandard}</span>
                      </div>
                      <div className="detail-row">
                        <span className="lbl">Residue Test:</span>
                        <span className="val text-emerald-400">{mintedBatch.complianceData.pesticideResidueTest}</span>
                      </div>
                      <div className="detail-row">
                        <span className="lbl">Price Sealed:</span>
                        <span className="val text-amber-300 font-bold">₹{gradingResult.dynamicPrice}/kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Agent 3 Pass */}
                  <div className="pass-actions-row">
                    <a 
                      href={mintedBatch.qrCodeUrl} 
                      download={`${mintedBatch.batchId}-QR.png`}
                      className="btn-pass-action secondary"
                      title="Download QR code"
                    >
                      <Download className="w-4 h-4" />
                      <span>{currentLang === 'ta' ? 'QR பதிவிறக்கு' : 'Download QR'}</span>
                    </a>

                    <button
                      type="button"
                      className="btn-pass-action primary"
                      onClick={() => {
                        if (onNavigateToPassport) {
                          onNavigateToPassport(mintedBatch.batchId);
                        } else {
                          window.location.href = `/track/${mintedBatch.batchId}`;
                        }
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>{currentLang === 'ta' ? 'நுகர்வோர் பார்வைக்கு செல்க' : 'View Citizen Provenance Passport'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Gemini API Key Configuration Modal */}
      {showApiKeyModal && (
        <div className="api-key-modal-overlay">
          <div className="api-key-modal-card">
            <div className="modal-head">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="modal-title">Gemini Vision API Configuration</h3>
              </div>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setShowApiKeyModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-desc">
                Provide your Google Gemini API key to enable live online multimodal grading via <code>gemini-1.5-flash</code>. 
                If left empty, the scanner autonomously utilizes its high-precision client-side APMC grading engine.
              </p>
              <input
                type="password"
                className="form-input modal-key-input"
                placeholder="AIzaSy..."
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setGeminiApiKey('');
                  saveStoredGeminiKey('');
                  setShowApiKeyModal(false);
                }}
              >
                Clear Key (Use Autonomous Mode)
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  saveStoredGeminiKey(geminiApiKey);
                  setShowApiKeyModal(false);
                }}
              >
                Save API Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
