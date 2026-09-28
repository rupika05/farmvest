import React from 'react';

/**
 * Official Government of Tamil Nadu Emblem (தமிழ்நாடு அரசு சின்னம்)
 * Features the iconic Srivilliputhur Andal Gopuram Tower with Ashoka Chakra and Indian Tricolor accents.
 */
export default function TnEmblem({ size = 52, className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Government of Tamil Nadu Official Emblem"
    >
      {/* Outer Golden Circular Crest */}
      <circle cx="50" cy="50" r="48" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="44" fill="#F8FAFC" stroke="#0B3C5D" strokeWidth="1.2" />

      {/* Indian National Tricolor Inner Ring Accent */}
      <circle cx="50" cy="50" r="42" stroke="#FF9933" strokeWidth="0.8" strokeDasharray="3 2" />
      
      {/* Tamil Nadu Gopuram Tower Silhouette (Srivilliputhur Temple) */}
      <path 
        d="M50 16 L52 22 L54 22 L53 30 L55 30 L54 40 L56 40 L55 52 L57 52 L56 64 L62 68 L62 76 L38 76 L38 68 L44 64 L43 52 L45 52 L44 40 L46 40 L45 30 L47 30 L46 22 L48 22 Z" 
        fill="#0B3C5D" 
        stroke="#D4AF37" 
        strokeWidth="0.8"
      />

      {/* Gopuram Kalasam (Top finials) */}
      <circle cx="50" cy="15" r="2" fill="#D4AF37" />
      <line x1="50" y1="13" x2="50" y2="16" stroke="#D4AF37" strokeWidth="1" />

      {/* Temple Tiers / Gopuram Horizontal Carvings */}
      <line x1="46" y1="30" x2="54" y2="30" stroke="#FFFFFF" strokeWidth="0.7" />
      <line x1="44" y1="40" x2="56" y2="40" stroke="#FFFFFF" strokeWidth="0.7" />
      <line x1="43" y1="52" x2="57" y2="52" stroke="#FFFFFF" strokeWidth="0.7" />
      <line x1="42" y1="64" x2="58" y2="64" stroke="#FFFFFF" strokeWidth="0.7" />

      {/* Temple Entrance / Archway */}
      <path d="M47 76 C47 70 53 70 53 76 Z" fill="#D4AF37" />

      {/* Ashoka Wheel / Chakra Accent at Base */}
      <circle cx="50" cy="80" r="4" fill="#FFFFFF" stroke="#0B3C5D" strokeWidth="0.8" />
      <circle cx="50" cy="80" r="1.2" fill="#0B3C5D" />

      {/* Circular Banner Text Arc representation */}
      <path 
        d="M20 72 C12 55 18 30 38 20" 
        stroke="#059669" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />
      <path 
        d="M80 72 C88 55 82 30 62 20" 
        stroke="#059669" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />

      {/* Prototype Ribbon */}
      <rect x="20" y="87" width="60" height="7" rx="3.5" fill="#0B3C5D" stroke="#D4AF37" strokeWidth="0.8" />
      <text x="50" y="92.2" textAnchor="middle" fill="#FDE047" fontSize="3.6" fontWeight="bold" fontFamily="sans-serif">
        கருத்துரு மாதிரி • PROTOTYPE
      </text>
    </svg>
  );
}
