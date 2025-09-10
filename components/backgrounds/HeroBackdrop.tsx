"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type HeroBackdropProps = {
  src: string; // /backgrounds/hero-desktop.webp
  blurPx?: number; // intensity of blur
  overlayColor?: string; // e.g., 'rgba(0,0,0,0.25)'
  overlayGradient?: string; // optional gradient CSS
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

/**
 * HeroBackdrop
 * Renders a blurred background image with an optional dark overlay, ready for hero sections.
 * Place children inside to layer content over the blurred image.
 */
export const HeroBackdrop: React.FC<HeroBackdropProps> = ({
  src,
  blurPx = 18,
  overlayColor = "rgba(0,0,0,0.25)",
  overlayGradient,
  className,
  style,
  children,
}) => {
  return (
    <div className={cn("relative overflow-hidden", className)} style={style}>
      {/* Blurred image background */}
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        priority={false}
        className="absolute inset-0 object-cover select-none"
        style={{
          filter: `blur(${blurPx}px)`,
          transform: "scale(1.06)", // prevent edge cropping from blur
          transformOrigin: "center",
        }}
        draggable={false}
      />
      {/* Overlay (solid or gradient) */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: overlayGradient || overlayColor,
          pointerEvents: "none",
        }}
      />
      {/* Foreground content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default HeroBackdrop;
