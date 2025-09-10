"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type ParchmentOverlayProps = {
  opacity?: number; // 0..1
  tint?: string; // CSS color
  grain?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * ParchmentOverlay
 * A subtle, CSS‑only parchment texture overlay using layered gradients.
 * No image assets required. Designed to sit above a base background (e.g., marble).
 */
export const ParchmentOverlay: React.FC<ParchmentOverlayProps> = ({
  opacity = 0.18,
  tint = "#E5D6B8",
  grain = true,
  className,
  style,
}) => {
  // Layered gradients: warm tint, faint vertical fibers, diagonal fibers, and optional grain dots
  const layers: string[] = [
    // Base warm tint
    `linear-gradient(0deg, ${tint}, ${tint})`,
    // Vertical fibers
    "repeating-linear-gradient( 90deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 6px )",
    // Diagonal fibers
    "repeating-linear-gradient( 25deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 7px )",
  ];

  if (grain) {
    // Very subtle speckled grain
    layers.push(
      "radial-gradient(circle at 20% 30%, rgba(0,0,0,0.025), rgba(0,0,0,0) 40%)," +
        "radial-gradient(circle at 70% 60%, rgba(0,0,0,0.025), rgba(0,0,0,0) 35%)"
    );
  }

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage: layers.join(","),
        backgroundBlendMode: "multiply, normal, normal, normal",
        opacity,
        ...style,
      }}
    />
  );
};

export default ParchmentOverlay;
