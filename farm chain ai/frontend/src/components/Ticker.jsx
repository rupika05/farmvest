import React from 'react';
import { Activity } from 'lucide-react';

export default function Ticker({ currentLang = 'ta' }) {
  const notices = {
    ta: [
      'நேரடி APMC மண்டி விலைப்பட்டியல் & e-NAM சந்தை விகிதங்கள் உடனுக்குடன் புதுப்பிக்கப்படுகிறது.',
      'AI கணினி பார்வை கொண்டு தக்காளி, வெங்காயம், உருளைக்கிழங்கு தர ஆய்வு மற்றும் தானியங்கி விலை சரிசெய்தல் வசதி தயார்.',
      'கிரிப்டோகிராபிக் SHA-256 ஹாஷ்-செயின் மூலம் விளைபொருள் மாற்றங்கள் 100% பாதுகாப்பாக பதிவு செய்யப்படுகின்றன.',
      'உழவர்கள் தங்கள் கைபேசி எண் அல்லது PM-KISAN அட்டை மூலம் டிஜிட்டல் மண்டி பாஸ் பெற்றுக்கொள்ளலாம்.',
      'அரசு ஆய்வு மாதிரி (GovTech PoC): TNeGA மற்றும் உழவர் நலத்துறை பயன்பாட்டு வெள்ளோட்டம்.'
    ],
    en: [
      'Live APMC Mandi Price Benchmarks & e-NAM market terminal rates synchronized in real-time.',
      'Gemini Vision AI Produce Inspection active: automated APMC quality grading & defect markdown applied.',
      'Cryptographic SHA-256 hash-chain guarantees 100% tamper-evident supply chain transparency.',
      'Registered farmers can mint instant Digital Mandi Passes with QR code verification.',
      'GovTech Evaluation PoC: Proposed agricultural traceability system for TNeGA & Dept of Agriculture.'
    ],
    hi: [
      'एपीएमसी विनियमित मंडी एवं e-NAM लाइव बेंचमार्क दरें वास्तविक समय में अपडेट की जा रही हैं।',
      'जेमिनी विज़न एआई गुणवत्ता जांच सक्रिय: स्वचालित गुणवत्ता ग्रेडिंग एवं मूल्य कटौती सुविधा उपलब्ध।',
      'क्रिप्टोग्राफिक SHA-256 लेजर द्वारा 100% छेड़छाड़-मुक्त आपूर्ति श्रृंखला पारदर्शिता सुनिश्चित।',
      'पंजीकृत किसान मोबाइल नंबर या पीएम-किसान आईडी द्वारा डिजिटल मंडी पास बना सकते हैं।',
      'गवटेक अनुसंधान प्रोटोटाइप: कृषि विभाग एवं TNeGA हेतु प्रस्तावित पारदर्शी प्रणाली।'
    ]
  };

  const list = notices[currentLang] || notices.en;

  return (
    <div className="minimal-live-ticker" role="region" aria-label="Live Mandi Updates">
      <div className="ticker-label-badge">
        <span className="live-pulse-dot"></span>
        <Activity className="w-3.5 h-3.5 text-emerald-400" />
        <span className="ticker-title">
          {currentLang === 'ta' ? 'நேரலை மண்டி' : currentLang === 'hi' ? 'लाइव मंडी' : 'LIVE MANDI FEED'}
        </span>
      </div>
      <div className="ticker-track">
        <span className="ticker-scroll-text">
          {list.join('  •  ')}
        </span>
      </div>
      <div className="ticker-ledger-pill">
        <span className="ledger-status-tag">
          {currentLang === 'ta' ? '🔒 SHA-256 பாதுகாப்பு' : '🔒 SHA-256 SECURED'}
        </span>
      </div>
    </div>
  );
}
