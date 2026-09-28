import React from 'react';

export default function LeafFloatingEffect() {
  // 6 delicate, ambient floating green leaves with subtle physics
  const leaves = [
    { top: '12%', left: '4%', delay: '0s', duration: '18s', size: 'w-6 h-6', rot: 'rotate-12' },
    { top: '35%', right: '5%', delay: '4s', duration: '22s', size: 'w-8 h-8', rot: '-rotate-45' },
    { top: '65%', left: '7%', delay: '2s', duration: '19s', size: 'w-5 h-5', rot: 'rotate-90' },
    { top: '82%', right: '10%', delay: '7s', duration: '24s', size: 'w-7 h-7', rot: '-rotate-12' },
    { top: '22%', left: '88%', delay: '5s', duration: '20s', size: 'w-6 h-6', rot: 'rotate-45' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
      {leaves.map((leaf, i) => (
        <div
          key={i}
          className={`absolute text-[#7DA972] animate-float ${leaf.rot} transition-opacity duration-1000`}
          style={{
            top: leaf.top,
            left: leaf.left,
            right: leaf.right,
            animationDelay: leaf.delay,
            animationDuration: leaf.duration
          }}
        >
          <svg className={leaf.size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
          </svg>
        </div>
      ))}
    </div>
  );
}
