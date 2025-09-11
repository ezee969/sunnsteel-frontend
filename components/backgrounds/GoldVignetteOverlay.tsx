"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export type GoldVignetteOverlayProps = {
  color?: string; // gold tint color
  intensity?: number; // 0..1 overall opacity multiplier
  feather?: string; // vignette radius as CSS length/percentage (e.g., '60%')
  className?: string;
  style?: React.CSSProperties;
};

/**
 * GoldVignetteOverlay
 * Subtle corner/edge vignette using layered radial-gradients with a warm gold tint.
 * Pure CSS—no image assets. Designed to sit above background imagery.
 */
export const GoldVignetteOverlay: React.FC<GoldVignetteOverlayProps> = ({
  color = "#D4AF37",
  intensity = 0.12,
  feather = "60%",
  className,
  style,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const baseColor = isDark ? "#C8A83A" : color; // slightly cooler gold in dark mode
  const effIntensity = isDark ? Math.min(intensity * 1.25, 0.25) : intensity;

  const c = baseColor;
  const a = (alpha: number) => `rgba(${hexToRgb(c)}, ${alpha * effIntensity})`;

  // Four corner radial gradients + a large center falloff to unify
  const layers: string[] = [
    `radial-gradient(${feather} ${feather} at 0% 0%, ${a(0.5)}, ${a(0.18)} 35%, ${a(0)} 70%)`,
    `radial-gradient(${feather} ${feather} at 100% 0%, ${a(0.5)}, ${a(0.18)} 35%, ${a(0)} 70%)`,
    `radial-gradient(${feather} ${feather} at 0% 100%, ${a(0.5)}, ${a(0.18)} 35%, ${a(0)} 70%)`,
    `radial-gradient(${feather} ${feather} at 100% 100%, ${a(0.5)}, ${a(0.18)} 35%, ${a(0)} 70%)`,
    `radial-gradient(120% 120% at 50% 50%, ${a(0.12)}, ${a(0)} 65%)`,
  ];

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage: layers.join(","),
        mixBlendMode: "multiply",
        ...style,
      }}
    />
  );
};

// helper: hex -> r,g,b
function hexToRgb(hex: string): string {
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

export default GoldVignetteOverlay;
