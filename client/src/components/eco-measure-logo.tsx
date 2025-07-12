import React, { useState } from 'react';
import { Camera } from 'lucide-react';

interface LogoProps {
  size?: number;
  showText?: boolean;
}

const EcoMeasureLogo: React.FC<LogoProps> = ({ size = 200, showText = true }) => {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="cursor-pointer transition-transform duration-500 hover:scale-110 select-none flex flex-col items-center"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ minHeight: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="filter drop-shadow-xl brightness-110"
      >
        <circle
          cx="100"
          cy="100"
          r="95"
          fill="url(#bgGradient)"
          className={`transition-opacity duration-700 ${hover ? 'opacity-30' : 'opacity-10'}`}
        />
        <circle
          cx="100"
          cy="100"
          r="85"
          stroke="url(#ringGradient1)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="10 5"
          className={`${hover ? 'animate-spin-slow' : ''}`}
        />
        <circle
          cx="100"
          cy="100"
          r="70"
          stroke="url(#ringGradient2)"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="5 10"
          className={`${hover ? 'animate-spin-reverse' : ''}`}
        />
        <path
          d="M100 40 L120 70 L110 70 L125 90 L115 90 L130 110 L70 110 L85 90 L75 90 L90 70 L80 70 Z"
          fill="url(#treeGradient)"
          className={`transition-transform duration-500 ${hover ? 'translate-y-1' : ''}`}
        />
        {/* Horizontal vegetation bars */}
        <rect x="60" y="120" width="80" height="4" rx="2" fill="url(#barGradient)" opacity="0.9" />
        <rect x="65" y="128" width="70" height="4" rx="2" fill="url(#barGradient)" opacity="0.7" />
        <rect x="70" y="136" width="60" height="4" rx="2" fill="url(#barGradient)" opacity="0.5" />
        {/* Ground dots */}
        <g className={`${hover ? 'opacity-100' : 'opacity-70'} transition-opacity duration-700`}>
          {[...Array(5)].map((_, i) =>
            [...Array(5)].map((_, j) => (
              <circle
                key={`${i}-${j}`}
                cx={65 + j * 17}
                cy={150 + i * 8}
                r="2"
                fill="url(#dotGradient)"
                opacity={0.4 + i * j * 0.02}
              />
            )),
          )}
        </g>
        {/* Center point */}
        <circle cx="100" cy="100" r="5" fill="url(#centerGradient)" />
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#064E3B" />
          </linearGradient>
          <linearGradient id="ringGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <linearGradient id="ringGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="treeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <radialGradient id="dotGradient">
            <stop offset="0%" stopColor="#6EE7B7" />
            <stop offset="100%" stopColor="#10B981" />
          </radialGradient>
          <radialGradient id="centerGradient">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#6EE7B7" />
            <stop offset="100%" stopColor="#10B981" />
          </radialGradient>
        </defs>
      </svg>
      {showText && (
        <div className="text-center mt-4 space-y-1">
          <h1 className="text-3xl font-bold text-white drop-shadow">
            EcoMeasure
          </h1>
          <p className="text-white/90 text-sm tracking-widest uppercase whitespace-nowrap">Precision Field Analytics</p>
        </div>
      )}
    </div>
  );
};

export default EcoMeasureLogo; 