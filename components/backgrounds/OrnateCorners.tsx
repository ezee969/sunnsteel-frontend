"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type OrnateCornersProps = {
  color?: string; // gold
  thickness?: number; // px
  length?: number; // px of each leg
  radius?: number; // px curve radius
  inset?: number; // px distance from edges
  className?: string;
  style?: React.CSSProperties;
};

/**
 * OrnateCorners
 * Renders thin gold L-shaped ornaments in each corner (CSS-only), with subtle curvature.
 * Useful atop cards, headers, or hero sections. Non-interactive overlay.
 */
export const OrnateCorners: React.FC<OrnateCornersProps> = ({
  color = "#E3C26E",
  thickness = 1.5,
  length = 28,
  radius = 6,
  inset = 8,
  className,
  style,
}) => {
  const legCommon: React.CSSProperties = {
    position: "absolute",
    backgroundColor: color,
    borderRadius: radius,
    boxShadow: `0 0 0.5px ${color}66`,
  };

  return (
    <div className={cn("pointer-events-none absolute inset-0", className)} style={style}>
      {/* Top-left */}
      <div aria-hidden style={{ position: "absolute", left: inset, top: inset, width: length, height: length }}>
        <span style={{ ...legCommon, height: thickness, width: length, left: 0, top: 0 }} />
        <span style={{ ...legCommon, width: thickness, height: length, left: 0, top: 0 }} />
      </div>
      {/* Top-right */}
      <div aria-hidden style={{ position: "absolute", right: inset, top: inset, width: length, height: length }}>
        <span style={{ ...legCommon, height: thickness, width: length, right: 0, top: 0, position: "absolute" }} />
        <span style={{ ...legCommon, width: thickness, height: length, right: 0, top: 0, position: "absolute" }} />
      </div>
      {/* Bottom-left */}
      <div aria-hidden style={{ position: "absolute", left: inset, bottom: inset, width: length, height: length }}>
        <span style={{ ...legCommon, height: thickness, width: length, left: 0, bottom: 0, position: "absolute" }} />
        <span style={{ ...legCommon, width: thickness, height: length, left: 0, bottom: 0, position: "absolute" }} />
      </div>
      {/* Bottom-right */}
      <div aria-hidden style={{ position: "absolute", right: inset, bottom: inset, width: length, height: length }}>
        <span style={{ ...legCommon, height: thickness, width: length, right: 0, bottom: 0, position: "absolute" }} />
        <span style={{ ...legCommon, width: thickness, height: length, right: 0, bottom: 0, position: "absolute" }} />
      </div>
    </div>
  );
};

export default OrnateCorners;
