import React from 'react';

export default function FarmVestLogo({ 
  size = 'md', 
  showTagline = true, 
  variant = 'dark', // 'dark' (default on light bg) or 'light' (for dark headers)
  className = '' 
}) {
  const iconSizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const titleSizes = {
    xs: 'text-base',
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  };

  const taglineSizes = {
    xs: 'text-[9px] tracking-wider',
    sm: 'text-[11px] tracking-wider',
    md: 'text-xs tracking-wider',
    lg: 'text-sm tracking-wide',
    xl: 'text-lg tracking-wide',
  };

  const isLight = variant === 'light';

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Exact FarmVest Official Shield + Circuit Sprout Mark */}
      <div className={`relative flex-shrink-0 ${iconSizes[size] || iconSizes.md} transition-transform duration-300 hover:scale-105`}>
        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full drop-shadow-sm">
          {/* Shield Outer */}
          <path 
            d="M100 20 C144 20, 172 36, 172 76 C172 132, 130 166, 100 182 C70 166, 28 132, 28 76 C28 36, 56 20, 100 20 Z" 
            fill={isLight ? '#1B361C' : '#FFFFFF'} 
            stroke={isLight ? '#8EC596' : '#1D4A27'} 
            strokeWidth="9" 
            strokeLinejoin="round" 
          />
          
          {/* Subtle Shield Inner facets */}
          <path 
            d="M100 34 C134 34, 158 46, 158 78 C158 124, 122 154, 100 168 C78 154, 42 124, 42 78 C42 46, 66 34, 100 34 Z" 
            fill={isLight ? 'rgba(255,255,255,0.06)' : '#EAF4ED'} 
          />
          <path d="M100 34 L158 78 L100 120 L42 78 Z" fill={isLight ? 'rgba(255,255,255,0.05)' : '#D7EBDC'} opacity="0.7"/>
          <path d="M100 120 L158 78 L100 168 L42 78 Z" fill={isLight ? 'rgba(255,255,255,0.03)' : '#C4E2CB'} opacity="0.5"/>

          {/* Plant Central Shoot & Nodes */}
          <path d="M100 140 L100 64" stroke={isLight ? '#A5D6A7' : '#1D4A27'} strokeWidth="5.5" strokeLinecap="round"/>
          <circle cx="100" cy="62" r="4.5" fill={isLight ? '#A5D6A7' : '#1D4A27'}/>

          {/* Left Leaf with Circuit Line & Circular Node */}
          <path 
            d="M96 112 C72 112, 52 92, 50 70 C72 70, 94 88, 96 112 Z" 
            fill="#4EA858" 
            stroke={isLight ? '#8EC596' : '#1D4A27'} 
            strokeWidth="4.5" 
            strokeLinejoin="round" 
          />
          <path d="M84 100 C72 92, 66 82, 66 76" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="66" cy="76" r="4" fill="#FFFFFF" stroke={isLight ? '#8EC596' : '#1D4A27'} strokeWidth="2"/>

          {/* Right Leaf with Circuit Line & Circular Node */}
          <path 
            d="M104 104 C130 96, 150 76, 150 48 C124 50, 106 72, 104 104 Z" 
            fill="#348C3F" 
            stroke={isLight ? '#8EC596' : '#1D4A27'} 
            strokeWidth="4.5" 
            strokeLinejoin="round" 
          />
          <path d="M114 90 C126 78, 136 68, 136 58" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="136" cy="58" r="4" fill="#FFFFFF" stroke={isLight ? '#8EC596' : '#1D4A27'} strokeWidth="2"/>

          {/* Root Circuit Branches with terminal dots */}
          <path d="M92 134 L72 142 L64 142" stroke={isLight ? '#A5D6A7' : '#1D4A27'} strokeWidth="4" strokeLinecap="round"/>
          <circle cx="62" cy="142" r="3.5" fill={isLight ? '#A5D6A7' : '#1D4A27'}/>

          <path d="M108 128 L122 136 L122 146" stroke={isLight ? '#A5D6A7' : '#1D4A27'} strokeWidth="4" strokeLinecap="round"/>
          <circle cx="122" cy="148" r="3.5" fill={isLight ? '#A5D6A7' : '#1D4A27'}/>

          <path d="M100 140 L100 158" stroke={isLight ? '#A5D6A7' : '#1D4A27'} strokeWidth="4" strokeLinecap="round"/>
          <circle cx="100" cy="160" r="3.5" fill={isLight ? '#A5D6A7' : '#1D4A27'}/>
        </svg>
      </div>

      {/* Brand Typography matching official logo */}
      <div className="flex flex-col justify-center leading-none">
        <span 
          className={`font-display font-extrabold tracking-tight ${titleSizes[size] || titleSizes.md} ${
            isLight ? 'text-white' : 'text-[#1B4826]'
          }`}
        >
          FarmVest
        </span>
        {showTagline && (
          <span 
            className={`font-medium mt-0.5 ${taglineSizes[size] || taglineSizes.md} ${
              isLight ? 'text-[#A2C498]' : 'text-[#2E693F]'
            }`}
          >
            Cultivating Fair Trade
          </span>
        )}
      </div>
    </div>
  );
}
