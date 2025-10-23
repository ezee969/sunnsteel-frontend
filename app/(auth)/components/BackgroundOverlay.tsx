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
      <HeroBackdrop
        blurPx={14}
        overlayGradient={
          isDark
            ? 'linear-gradient(to bottom, rgba(10,10,10,0.7), rgba(15,15,15,0.8) 50%, rgba(10,10,10,0.85))'
            : 'linear-gradient(to bottom, rgba(255,255,255,0.3), rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.5))'
        }
        darkFilter="brightness(0.4) saturate(0.8)"
        className="absolute inset-0"
      />
      {/* Subtle parchment texture and gold vignette */}
      <ParchmentOverlay opacity={isDark ? 0.12 : 0.08} />
      <GoldVignetteOverlay intensity={isDark ? 0.2 : 0.1} />
    </div>
  );
}
