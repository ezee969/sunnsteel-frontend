'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

export type HeroBackdropProps = {
  src?: string; // /backgrounds/hero-desktop.webp
  darkSrc?: string; // optional dark variant image
  blurPx?: number; // intensity of blur
  overlayColor?: string; // e.g., 'rgba(0,0,0,0.25)'
  overlayGradient?: string; // optional gradient CSS
  className?: string;
  style?: React.CSSProperties;
  darkFilter?: string; // optional extra CSS filter in dark mode
  children?: React.ReactNode;
};

/**
 * HeroBackdrop
 * Renders a blurred background image with an optional dark overlay, ready for hero sections.
 * Supports theme-aware background via darkSrc and darkFilter.
 */
export const HeroBackdrop: React.FC<HeroBackdropProps> = ({
  src,
  darkSrc,
  blurPx = 18,
  overlayColor = 'rgba(0,0,0,0.25)',
  overlayGradient,
  className,
  style,
  darkFilter = 'brightness(0.5) saturate(0.95)',
  children,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Prefer dark image when mounted and theme is dark
  const activeSrc = mounted && isDark && darkSrc ? darkSrc : src || '';
  const filter = [`blur(${blurPx}px)`, mounted && isDark ? darkFilter : undefined]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cn('relative overflow-hidden', className)} style={style}>
      {/* Blurred image background */}
      <Image
        key={activeSrc}
        src={activeSrc}
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        priority={false}
        className="absolute inset-0 object-cover select-none"
        style={{
          filter,
          transform: 'scale(1.06)', // prevent edge cropping from blur
          transformOrigin: 'center',
        }}
        draggable={false}
      />
      {/* Overlay (solid or gradient) */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: overlayGradient || overlayColor,
          // In dark mode, slightly multiply to deepen tones even if source is bright
          mixBlendMode: mounted && isDark ? 'multiply' : 'normal',
          pointerEvents: 'none',
        }}
      />
      {/* Foreground content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default HeroBackdrop;
