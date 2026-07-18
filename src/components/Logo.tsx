/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark'; // 'light' for dark background (like footer), 'dark' for light background (like navbar)
}

const LOGO_PATHS = [
  '/assets/Bvlogo.png',
];

export const Logo: React.FC<LogoProps> = ({ className = '', variant = 'dark' }) => {
  const isDark = variant === 'dark';
  const [pathIndex, setPathIndex] = useState(0);
  const [useFallback, setUseFallback] = useState(false);

  const handleImgError = () => {
    if (pathIndex < LOGO_PATHS.length - 1) {
      setPathIndex(prev => prev + 1);
    } else {
      setUseFallback(true);
    }
  };

  if (!useFallback) {
    return (
      <div className={`inline-flex items-center gap-2 ${isDark ? '' : 'bg-white px-1 py-1 sm:px-2 sm:py-1 rounded-4xl shadow-md border border-brand-gold-500/10'} ${className}`}>
        <img
          src={LOGO_PATHS[pathIndex]}
          alt="Bv Life Logo"
          onError={handleImgError}
          className="h-14 sm:h-20 w-auto object-contain max-w-[190px] sm:max-w-[260px]"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Fallback to beautiful default SVG + text logo
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Herb/Leaf SVG Motif */}
      <svg
        className="w-12 h-12 sm:w-16 sm:h-16 shrink-0"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="20"
          cy="20"
          r="18"
          className={isDark ? 'fill-brand-green-700/10' : 'fill-white/10'}
        />
        {/* Modern Stylized Leaf Design */}
        <path
          d="M20 9C20 9 26 14 26 21C26 27.0751 20.9249 29 18 29C15.0751 29 14 26 14 21C14 14 20 9 20 9Z"
          className={isDark ? 'fill-brand-green-700' : 'fill-brand-gold-500'}
        />
        <path
          d="M20 9C20 9 16 13 16 19C16 23 18.5 25 21 25C23.5 25 24 22 24 19C24 13 20 9 20 9Z"
          className={isDark ? 'fill-brand-gold-600/90' : 'fill-brand-cream-50/90'}
        />
        <path
          d="M20 9V29"
          className={isDark ? 'stroke-brand-cream-50' : 'stroke-brand-green-900'}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Typography */}
      <div className="min-w-0">
        <h1 className="font-serif text-xl sm:text-3xl font-bold tracking-tight leading-none">
          <span className={isDark ? 'text-brand-green-800' : 'text-brand-cream-100'}>Bv</span>
          <span className="text-brand-gold-600 font-sans font-normal italic text-base sm:text-xl ml-1">Life</span>
        </h1>
        <p className={`text-[9px] sm:text-[11px] uppercase tracking-widest font-semibold mt-0.5 sm:-mt-0.5 truncate ${
          isDark ? 'text-brand-green-600/90' : 'text-brand-cream-300/80'
        }`}>
          Organic Wellbeing
        </p>
      </div>
    </div>
  );
};
