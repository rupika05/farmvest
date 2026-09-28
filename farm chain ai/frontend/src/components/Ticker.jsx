import React, { useState } from 'react';
import { Megaphone, Bell, ArrowRight } from 'lucide-react';

export default function Ticker({ currentLang = 'ta' }) {
  const notices = {
    ta: [
      '⚠️ கருத்துரு முன்மாதிரி வெள்ளோட்டம் (Evaluation Prototype Demo • உண்மை அரசு தளம் அல்ல): TNeGA இடைமுக பாணியிலான மாதிரி ஆய்வு.',
      'தமிழ்நாடு ஒழுங்குமுறை விற்பனைக் கூடங்கள் (APMC) மற்றும் e-NAM நேரடி சந்தை விலைப்பட்டியல் உடனுக்குடன் புதுப்பிக்கப்படுகிறது.',
      'AI கணினி பார்வை கொண்டு தக்காளி, உருளைக்கிழங்கு, ஆப்பிள் காய்கறி தர ஆய்வு மற்றும் 20% தானியங்கி விலை குறைப்பு வசதி செயல்படுகிறது.',
      'அனைத்து உழவர்களும் தங்களின் கைபேசி எண் அல்லது PM-KISAN அடையாள அட்டை மூலம் இ-சேவை உழவர் பாஸ் பெற்றுக் கொள்ளலாம்.',
      'கிரிப்டோகிராபிக் SHA-256 முறை மூலம் விளைபொருள் மாற்றங்கள் 100% பாதுகாப்பாக பதிவு செய்யப்படுகின்றன.'
    ],
    en: [
      '⚠️ Research & Evaluation Concept Prototype (Proposed for TNeGA • Not an Official Govt Site): Live APMC Mandi Benchmark & AI Quality Inspection.',
      'Tamil Nadu APMC Regulated Markets & e-NAM live benchmark rates are synchronized in real-time.',
      'AI Computer Vision produce defect analysis with automatic 20% quality markdown is active across all Mandis.',
      'Registered farmers can generate digital Mandi passes using Mobile OTP or PM-KISAN ID.',
      'Cryptographic SHA-256 hash-chain ensures 100% tamper-proof supply chain transparency.'
    ],
    hi: [
      '⚠️ अनुसंधान और मूल्यांकन प्रोटोटाइप (TNeGA हेतु प्रस्तावित • वास्तविक सरकारी पोर्टल नहीं): एपीएमसी मंडी दर और एआई गुणवत्ता जांच।',
      'तमिलनाडु एपीएमसी विनियमित मंडी और e-NAM लाइव बेंचमार्क दरें वास्तविक समय में अपडेट की जा रही हैं।',
      'एआई कंप्यूटर विज़न गुणवत्ता जांच और 20% स्वचालित मूल्य कटौती सभी मंडियों में सक्रिय है।',
      'पंजीकृत किसान मोबाइल ओटीपी या पीएम-किसान आईडी के माध्यम से डिजिटल मंडी पास बना सकते हैं।'
    ]
  };

  const list = notices[currentLang] || notices.en;
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div className="tnega-ticker-container" role="region" aria-label="Official Announcements">
      <div className="tnega-ticker-label">
        <span className="ticker-badge-live">
          <Bell className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>{currentLang === 'ta' ? 'அண்மை செய்திகள்' : currentLang === 'hi' ? 'ताज़ा समाचार' : 'LATEST UPDATES'}</span>
        </span>
      </div>
      <div className="tnega-ticker-content">
        <span className="ticker-marquee-text">
          📢 {list.join(' ••• 📢 ')}
        </span>
      </div>
      <div className="tnega-ticker-help">
        <span>{currentLang === 'ta' ? 'உதவி எண்:' : currentLang === 'hi' ? 'हेल्पलाइन:' : 'Helpline:'} <strong>1800 425 6000</strong></span>
      </div>
    </div>
  );
}
