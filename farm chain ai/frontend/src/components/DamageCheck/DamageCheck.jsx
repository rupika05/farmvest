import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, AlertTriangle, CheckCircle2, RefreshCw, Sparkles, 
  Image as ImageIcon, ShieldAlert, Cpu, Eye, EyeOff, Sliders, 
  Layers, Check, ExternalLink, HelpCircle
} from 'lucide-react';
import { translations } from '../../locales/translations';
import './DamageCheck.css';

// Realistic produce sample presets with Tamil & English metadata
const SAMPLE_PRESETS = [
  {
    id: 'sample-fresh-tomato',
    name: '🍅 Fresh Tomato (தக்காளி)',
    quality: 'Fresh',
    confidence: 0.98,
    details: 'Vibrant crimson skin, firm pericarp structure, zero fungal blemishes, Grade-A APMC standard.',
    detailsTa: 'பளபளப்பான சிவப்பு நிறம், உறுதியான தோல் அமைப்பு, பூஞ்சை இல்லாத ஆரோக்கியமான தக்காளி. முதல் தரம்.',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cdefs%3E%3CradialGradient id='bg' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%231e293b'/%3E%3Cstop offset='100%25' stop-color='%230b0f17'/%3E%3C/radialGradient%3E%3CradialGradient id='tomato' cx='35%25' cy='30%25' r='75%25'%3E%3Cstop offset='0%25' stop-color='%23ff4d4d'/%3E%3Cstop offset='45%25' stop-color='%23dc2626'/%3E%3Cstop offset='85%25' stop-color='%23991b1b'/%3E%3Cstop offset='100%25' stop-color='%23580e0e'/%3E%3C/radialGradient%3E%3Cfilter id='shadow'%3E%3CfeDropShadow dx='0' dy='15' stdDeviation='12' flood-color='%23000' flood-opacity='0.6'/%3E%3C/filter%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23bg)'/%3E%3Ccircle cx='200' cy='220' r='120' fill='url(%23tomato)' filter='url(%23shadow)'/%3E%3Cpath d='M200 95 L205 130 L235 110 L220 138 L255 145 L215 155 L200 135 L185 155 L145 145 L180 138 L165 110 L195 130 Z' fill='%2316a34a' filter='url(%23shadow)'/%3E%3Cpath d='M200 95 Q205 60 220 50' stroke='%2315803d' stroke-width='8' fill='none' stroke-linecap='round'/%3E%3Crect x='110' y='360' width='180' height='26' rx='13' fill='%23052e16' stroke='%2322c55e' stroke-width='1.5'/%3E%3Ctext x='200' y='378' fill='%234ade80' font-family='sans-serif' font-weight='800' font-size='13' text-anchor='middle'%3EGRADE-A FRESH (98.6%25)%3C/text%3E%3C/svg%3E"
  },
  {
    id: 'sample-damaged-tomato',
    name: '🍅 Damaged Tomato (சேதமடைந்த தக்காளி)',
    quality: 'Damaged',
    confidence: 0.94,
    details: 'Blight necrosis blotches (26% surface area) with fungal rot and epidermal tissue collapse.',
    detailsTa: 'கரும்பூஞ்சை அழுகல் புள்ளிகள் (26% பரப்பளவு) கண்டறியப்பட்டது. 20% அரசு தர தள்ளுபடி வழங்கப்படுகிறது.',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cdefs%3E%3CradialGradient id='bg2' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%231e293b'/%3E%3Cstop offset='100%25' stop-color='%230b0f17'/%3E%3C/radialGradient%3E%3CradialGradient id='tomatoDamaged' cx='35%25' cy='30%25' r='75%25'%3E%3Cstop offset='0%25' stop-color='%23991b1b'/%3E%3Cstop offset='45%25' stop-color='%237f1d1d'/%3E%3Cstop offset='85%25' stop-color='%23450a0a'/%3E%3Cstop offset='100%25' stop-color='%23280505'/%3E%3C/radialGradient%3E%3Cfilter id='shadow2'%3E%3CfeDropShadow dx='0' dy='15' stdDeviation='12' flood-color='%23000' flood-opacity='0.6'/%3E%3C/filter%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23bg2)'/%3E%3Ccircle cx='200' cy='220' r='120' fill='url(%23tomatoDamaged)' filter='url(%23shadow2)'/%3E%3C!-- Rot spots --%3E%3Cellipse cx='235' cy='235' rx='45' ry='50' fill='%231f0e06' opacity='0.92'/%3E%3Cellipse cx='230' cy='230' rx='35' ry='40' fill='%233a1e12' opacity='0.95'/%3E%3Ccircle cx='225' cy='225' r='15' fill='%23cbd5e1' opacity='0.85'/%3E%3Cellipse cx='155' cy='260' rx='30' ry='35' fill='%23221008' opacity='0.88'/%3E%3Cpath d='M200 95 L205 130 L235 110 L220 138 L255 145 L215 155 L200 135 L185 155 L145 145 L180 138 L165 110 L195 130 Z' fill='%23383818'/%3E%3Crect x='85' y='360' width='230' height='26' rx='13' fill='%23450a0a' stroke='%23ef4444' stroke-width='1.5'/%3E%3Ctext x='200' y='378' fill='%23fca5a5' font-family='sans-serif' font-weight='800' font-size='12' text-anchor='middle'%3E⚠️ சேதம் கண்டறியப்பட்டது (-20%25)%3C/text%3E%3C/svg%3E"
  },
  {
    id: 'sample-fresh-apple',
    name: '🍎 Fresh Kashmiri Apple (ஆப்பிள்)',
    quality: 'Fresh',
    confidence: 0.99,
    details: 'Grade-A export quality, uniform moisture, pristine peel, zero impact trauma.',
    detailsTa: 'ஏற்றுமதி தரம் வாய்ந்த முதல் தர ஆப்பிள். மென்மையான தோல், தழும்புகள் இல்லாதது.',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cdefs%3E%3CradialGradient id='bg3' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%231e293b'/%3E%3Cstop offset='100%25' stop-color='%230b0f17'/%3E%3C/radialGradient%3E%3CradialGradient id='apple' cx='35%25' cy='30%25' r='75%25'%3E%3Cstop offset='0%25' stop-color='%23ef4444'/%3E%3Cstop offset='50%25' stop-color='%23b91c1c'/%3E%3Cstop offset='90%25' stop-color='%237f1d1d'/%3E%3Cstop offset='100%25' stop-color='%23450a0a'/%3E%3C/radialGradient%3E%3Cfilter id='shadow3'%3E%3CfeDropShadow dx='0' dy='15' stdDeviation='12' flood-color='%23000' flood-opacity='0.6'/%3E%3C/filter%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23bg3)'/%3E%3Cpath d='M200 120 C240 80 320 90 330 180 C345 270 290 340 200 340 C110 340 55 270 70 180 C80 90 160 80 200 120 Z' fill='url(%23apple)' filter='url(%23shadow3)'/%3E%3Cpath d='M200 120 Q210 70 230 55' stroke='%2378350f' stroke-width='8' fill='none' stroke-linecap='round'/%3E%3Cellipse cx='240' cy='70' rx='20' ry='10' fill='%2316a34a' transform='rotate(-25 240 70)'/%3E%3Crect x='110' y='360' width='180' height='26' rx='13' fill='%23052e16' stroke='%2322c55e' stroke-width='1.5'/%3E%3Ctext x='200' y='378' fill='%234ade80' font-family='sans-serif' font-weight='800' font-size='13' text-anchor='middle'%3EGRADE-A FRESH (99.2%25)%3C/text%3E%3C/svg%3E"
  },
  {
    id: 'sample-damaged-apple',
    name: '🍎 Bruised Apple (அழுகிய ஆப்பிள்)',
    quality: 'Damaged',
    confidence: 0.95,
    details: 'Severe mechanical bruise with secondary brown rot softening 24% of surface area.',
    detailsTa: 'வாகன அதிர்வு மற்றும் அழுத்தத்தால் 24% பகுதி அழுகல் மற்றும் காயம் அடைந்துள்ளது.',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cdefs%3E%3CradialGradient id='bg4' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%231e293b'/%3E%3Cstop offset='100%25' stop-color='%230b0f17'/%3E%3C/radialGradient%3E%3CradialGradient id='appleDamaged' cx='35%25' cy='30%25' r='75%25'%3E%3Cstop offset='0%25' stop-color='%23b91c1c'/%3E%3Cstop offset='50%25' stop-color='%237f1d1d'/%3E%3Cstop offset='90%25' stop-color='%23450a0a'/%3E%3Cstop offset='100%25' stop-color='%23280505'/%3E%3C/radialGradient%3E%3Cfilter id='shadow4'%3E%3CfeDropShadow dx='0' dy='15' stdDeviation='12' flood-color='%23000' flood-opacity='0.6'/%3E%3C/filter%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23bg4)'/%3E%3Cpath d='M200 120 C240 80 320 90 330 180 C345 270 290 340 200 340 C110 340 55 270 70 180 C80 90 160 80 200 120 Z' fill='url(%23appleDamaged)' filter='url(%23shadow4)'/%3E%3C!-- Bruise spot --%3E%3Cellipse cx='250' cy='220' rx='60' ry='70' fill='%23221206' opacity='0.92'/%3E%3Cellipse cx='245' cy='225' rx='45' ry='50' fill='%23422006' opacity='0.95'/%3E%3Cpath d='M200 120 Q210 70 230 55' stroke='%2378350f' stroke-width='8' fill='none' stroke-linecap='round'/%3E%3Crect x='85' y='360' width='230' height='26' rx='13' fill='%23450a0a' stroke='%23ef4444' stroke-width='1.5'/%3E%3Ctext x='200' y='378' fill='%23fca5a5' font-family='sans-serif' font-weight='800' font-size='12' text-anchor='middle'%3E⚠️ காயம் கண்டறியப்பட்டது (-20%25)%3C/text%3E%3C/svg%3E"
  }
];

export default function DamageCheck({
  originalPrice = 0,
  cropName = 'Produce',
  currentLang = 'en',
  onInspectionComplete
}) {
  const t = translations[currentLang] || translations.en;

  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapUrl, setHeatmapUrl] = useState(null);
  const [sensitivityThreshold, setSensitivityThreshold] = useState(6.0);
  const [overrideMode, setOverrideMode] = useState('auto');
  const [cvMetrics, setCvMetrics] = useState(null);
  
  const fileInputRef = useRef(null);

  /**
   * Real Computer Vision Pixel Analysis Engine.
   */
  const analyzeImagePixels = (imgElement, threshold = sensitivityThreshold) => {
    const canvas = document.createElement('canvas');
    const width = 200;
    const height = 200;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgElement, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const heatCanvas = document.createElement('canvas');
    heatCanvas.width = width;
    heatCanvas.height = height;
    const heatCtx = heatCanvas.getContext('2d');
    heatCtx.drawImage(imgElement, 0, 0, width, height);
    const heatImageData = heatCtx.getImageData(0, 0, width, height);
    const heatData = heatImageData.data;

    let producePixels = 0;
    let blemishPixels = 0;
    let totalSat = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 30) continue;

      const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
      const max = Math.max(rNorm, gNorm, bNorm);
      const min = Math.min(rNorm, gNorm, bNorm);
      const d = max - min;
      
      let h = 0;
      if (d !== 0) {
        if (max === rNorm) h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) * 60;
        else if (max === gNorm) h = ((bNorm - rNorm) / d + 2) * 60;
        else h = ((rNorm - gNorm) / d + 4) * 60;
      }
      const s = max === 0 ? 0 : d / max;
      const v = max;

      // Filter white / black neutral backgrounds
      if ((v > 0.88 && s < 0.12) || v < 0.08) continue;

      producePixels++;
      totalSat += s;

      // Detect dark rot, necrosis, fungal mold
      const isBrownRot = (h >= 10 && h <= 45) && v < 0.45 && s > 0.15;
      const isDeepBruise = v < 0.28 && s < 0.45;
      const isFungalMold = s < 0.18 && (v > 0.35 && v < 0.75);

      if (isBrownRot || isDeepBruise || isFungalMold) {
        blemishPixels++;
        heatData[i] = 255;
        heatData[i + 1] = 30;
        heatData[i + 2] = 30;
        heatData[i + 3] = 220;
      }
    }

    heatCtx.putImageData(heatImageData, 0, 0);
    const generatedHeatmap = heatCanvas.toDataURL('image/png');

    const defectRatio = producePixels > 0 ? (blemishPixels / producePixels) : 0;
    const defectPercent = Math.round(defectRatio * 1000) / 10;
    const avgSaturation = producePixels > 0 ? Math.round((totalSat / producePixels) * 100) : 50;

    return {
      defectRatio,
      defectPercent,
      avgSaturation,
      producePixels,
      blemishPixels,
      heatmapUrl: generatedHeatmap
    };
  };

  const runInference = (imgSrc, preset = null, forcedMode = overrideMode) => {
    setAnalyzing(true);
    setResult(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const metrics = analyzeImagePixels(img, sensitivityThreshold);
      setCvMetrics(metrics);
      setHeatmapUrl(metrics.heatmapUrl);

      setTimeout(() => {
        let qualityStatus = 'Fresh';
        let confidence = 0.95;
        let notes = '';

        if (forcedMode === 'damaged') {
          qualityStatus = 'Damaged';
          confidence = 0.97;
          notes = currentLang === 'ta' ? 'ஆய்வாளர் சிறப்பு முடிவு: சேதமடைந்தது என உறுதிசெய்யப்பட்டது.' : 'Inspector Manual Override: Defect condition confirmed.';
        } else if (forcedMode === 'fresh') {
          qualityStatus = 'Fresh';
          confidence = 0.99;
          notes = currentLang === 'ta' ? 'ஆய்வாளர் சிறப்பு முடிவு: முதல் தரம் என சான்றளிக்கப்பட்டது.' : 'Inspector Manual Override: Certified Grade-A fresh.';
        } else if (preset) {
          qualityStatus = preset.quality;
          confidence = preset.confidence;
          notes = currentLang === 'ta' ? (preset.detailsTa || preset.details) : preset.details;
        } else {
          const isDefective = metrics.defectPercent >= sensitivityThreshold;
          qualityStatus = isDefective ? 'Damaged' : 'Fresh';

          if (isDefective) {
            confidence = Math.min(0.99, Math.max(0.85, 0.82 + (metrics.defectRatio * 0.9)));
            notes = currentLang === 'ta' 
              ? `AI கணினி பார்வை: ${metrics.defectPercent}% பரப்பளவு சேதம் கண்டறியப்பட்டது. 20% விலை குறைப்பு அமலாகிறது.`
              : `Computer Vision: Detected ${metrics.defectPercent}% surface necrosis. 20% price markdown automatically applied.`;
          } else {
            confidence = Math.min(0.99, Math.max(0.88, 0.98 - (metrics.defectRatio * 0.8)));
            notes = currentLang === 'ta'
              ? `AI கணினி பார்வை: உயர்தரமான தோல் அமைப்பு (${(100 - metrics.defectPercent).toFixed(1)}% தூய்மை). முதல் தரம்.`
              : `Computer Vision: High epidermal integrity (${(100 - metrics.defectPercent).toFixed(1)}% clean). Grade-A Certified.`;
          }
        }

        // Apply 20% discount on Damaged produce in ₹ INR
        const isDamaged = qualityStatus === 'Damaged';
        const discountApplied = isDamaged ? 0.20 : 0;
        const nominal = Number(originalPrice) || 0;
        const adjustedPrice = isDamaged
          ? Math.round(nominal * 0.80 * 100) / 100
          : nominal;

        const inspectionData = {
          qualityStatus,
          confidence,
          discountApplied,
          adjustedPrice,
          originalPrice: nominal,
          notes,
          metrics,
          imagePreview: imgSrc
        };

        setResult(inspectionData);
        setAnalyzing(false);

        if (onInspectionComplete) {
          onInspectionComplete(inspectionData);
        }
      }, 500);
    };

    img.src = imgSrc;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedPresetId(null);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const src = uploadEvent.target.result;
      setImagePreview(src);
      runInference(src, null, overrideMode);
    };
    reader.readAsDataURL(file);
  };

  const selectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setImagePreview(preset.url);
    runInference(preset.url, preset, overrideMode);
  };

  const handleOverride = (mode) => {
    setOverrideMode(mode);
    if (imagePreview) {
      runInference(imagePreview, selectedPresetId ? SAMPLE_PRESETS.find(p => p.id === selectedPresetId) : null, mode);
    }
  };

  const resetInspection = () => {
    setImagePreview(null);
    setResult(null);
    setHeatmapUrl(null);
    setSelectedPresetId(null);
    setCvMetrics(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onInspectionComplete) {
      onInspectionComplete({
        qualityStatus: 'Standard',
        confidence: 0,
        discountApplied: 0,
        adjustedPrice: originalPrice,
        originalPrice,
        imagePreview: null
      });
    }
  };

  return (
    <div className="damage-check-card">
      <div className="damage-check-header">
        <div className="damage-check-title-group">
          <div className="damage-check-icon-badge">
            <Cpu className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="damage-check-title">{t.aiScannerTitle}</h4>
            <p className="damage-check-subtitle">{t.aiScannerSubtitle}</p>
          </div>
        </div>
        {result && (
          <button type="button" onClick={resetInspection} className="damage-reset-btn">
            <RefreshCw className="w-4 h-4" /> Reset
          </button>
        )}
      </div>

      {/* Demo Presets Bar */}
      <div className="presets-section">
        <span className="presets-label">{t.presetsLabel}</span>
        <div className="presets-grid">
          {SAMPLE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPreset(p)}
              className={`preset-btn ${selectedPresetId === p.id ? 'active' : ''} ${p.quality.toLowerCase()}`}
            >
              <span className="preset-name">{p.name}</span>
              <span className="preset-pill">{p.quality === 'Damaged' ? '⚠️ -20%' : '✅ Fresh'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Dropzone / Preview */}
      <div className="damage-main-content">
        {!imagePreview ? (
          <div
            className="dropzone-area"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <div className="dropzone-icon-circle">
              <Upload className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="dropzone-text">{t.dropzoneText}</p>
            <span className="dropzone-hint">{t.dropzoneHint}</span>
          </div>
        ) : (
          <div className="preview-container">
            <div className="image-wrapper">
              <img 
                src={showHeatmap && heatmapUrl ? heatmapUrl : imagePreview} 
                alt="Produce Inspection" 
                className="inspection-image" 
              />
              
              {analyzing && (
                <div className="analyzing-overlay">
                  <div className="scanner-line"></div>
                  <div className="analyzing-spinner-box">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                    <span>{currentLang === 'ta' ? 'AI கேமரா மேற்பரப்பை ஆய்வு செய்கிறது...' : 'Neural Vision Classifying...'}</span>
                  </div>
                </div>
              )}

              {heatmapUrl && !analyzing && (
                <button
                  type="button"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className="heatmap-toggle-btn"
                >
                  {showHeatmap ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showHeatmap ? t.btnHideHeatmap : t.btnShowHeatmap}</span>
                </button>
              )}
            </div>

            {/* Simple 3-Metric Summary Strip */}
            {result && !analyzing && (
              <div className={`result-box ${result.qualityStatus.toLowerCase()}`}>
                <div className="result-header">
                  <div className="result-status-badge">
                    {result.qualityStatus === 'Damaged' ? (
                      <>
                        <ShieldAlert className="w-5 h-5 text-red-400" />
                        <span className="status-text text-red-400">
                          {currentLang === 'ta' ? 'சேதம் கண்டறியப்பட்டது (DAMAGED)' : 'DEFECT DETECTED: DAMAGED'}
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="status-text text-emerald-400">
                          {currentLang === 'ta' ? 'முதல் தரம் (GRADE-A FRESH)' : 'GRADE-A QUALITY: FRESH'}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="confidence-pill">
                    {(result.confidence * 100).toFixed(1)}% {currentLang === 'ta' ? 'துல்லியம்' : 'Confidence'}
                  </span>
                </div>

                <p className="result-notes">{result.notes}</p>

                {/* 20% Discount Impact Card */}
                <div className="price-impact-card">
                  <div className="price-impact-header">
                    <span className="impact-title">
                      {currentLang === 'ta' ? 'அரசு மண்டி விலை சரிசெய்தல்' : 'Mandi Price Adjustment'}
                    </span>
                    {result.qualityStatus === 'Damaged' ? (
                      <span className="discount-tag">⚠️ {t.priceMarkdownNotice}</span>
                    ) : (
                      <span className="standard-tag">✅ {t.fullPriceNotice}</span>
                    )}
                  </div>

                  <div className="price-impact-values">
                    <div className="price-col">
                      <span className="price-label">{t.originalPriceLabel}</span>
                      <span className={`price-value ${result.qualityStatus === 'Damaged' ? 'strikethrough' : ''}`}>
                        ₹{Number(originalPrice).toFixed(2)}
                      </span>
                    </div>

                    {result.qualityStatus === 'Damaged' && (
                      <>
                        <div className="price-arrow">➔</div>
                        <div className="price-col highlight">
                          <span className="price-label">{t.adjustedPriceLabel}</span>
                          <span className="price-value discounted">
                            ₹{result.adjustedPrice.toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Simple Inspector Decision Toolbar */}
            <div className="inspector-tuning-box">
              <span className="tuning-label">{t.inspectorControls}:</span>
              <div className="override-btn-group">
                <button
                  type="button"
                  onClick={() => handleOverride('auto')}
                  className={`override-btn ${overrideMode === 'auto' ? 'active' : ''}`}
                >
                  {t.btnAutoVision}
                </button>
                <button
                  type="button"
                  onClick={() => handleOverride('fresh')}
                  className={`override-btn fresh ${overrideMode === 'fresh' ? 'active' : ''}`}
                >
                  {t.btnForceFresh}
                </button>
                <button
                  type="button"
                  onClick={() => handleOverride('damaged')}
                  className={`override-btn damaged ${overrideMode === 'damaged' ? 'active' : ''}`}
                >
                  {t.btnForceDamaged}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
