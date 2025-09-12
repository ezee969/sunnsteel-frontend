'use client';

import React from 'react';
import HeroBackdrop from '@/components/backgrounds/HeroBackdrop';
import ParchmentOverlay from '@/components/backgrounds/ParchmentOverlay';
import GoldVignetteOverlay from '@/components/backgrounds/GoldVignetteOverlay';
import { useTheme } from 'next-themes';

export function BackgroundOverlay() {
  const { resolvedTheme } = useTheme();
  // Prevent hydration mismatch by deferring theme-based differences until mounted
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isDark = mounted ? resolvedTheme === 'dark' : false;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Theme-aware marble background with blur + overlay */}
      <HeroBackdrop
        src="/backgrounds/marble-light1536-x-1024.webp"
        darkSrc="/backgrounds/marble-dark-1536-x-1024.webp"
        blurPx={14}
        overlayGradient={
          isDark
            ? 'linear-gradient(to top, rgba(0,0,0,0.0), rgba(0,0,0,0.0) 45%, rgba(0,0,0,0.0) 80%)'
            : 'linear-gradient(to top, rgba(255,255,255,0.0), rgba(255,255,255,0.0) 45%, rgba(255,255,255,0.0) 80%)'
        }
        darkFilter=""
        className="absolute inset-0"
      />
      {/* Subtle parchment texture and gold vignette */}
      <ParchmentOverlay opacity={isDark ? 0.1 : 0.08} />
      <GoldVignetteOverlay intensity={isDark ? 0.16 : 0.1} />
    </div>
  );
}
