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
      <div className={`inline-flex items-center gap-2 ${isDark ? '' : 'bg-white px-4 py-2 sm:px-5 sm:py-3 rounded-2xl shadow-md border border-brand-gold-500/10'} ${className}`}>
        <img
          src={LOGO_PATHS[pathIndex]}
          alt="Grams Life Logo"
          onError={handleImgError}
          className={isDark ? "h-13 sm:h-14 w-auto object-contain max-w-[170px] sm:max-w-[200px]" : "h-16 sm:h-22 w-auto object-contain max-w-[210px] sm:max-w-[280px]"}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

}
