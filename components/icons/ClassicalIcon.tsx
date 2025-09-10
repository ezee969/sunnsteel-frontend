"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type ClassicalIconName =
  | "bicep-flexing"
  | "coin"
  | "compass"
  | "crown"
  | "crested-helmet"
  | "dumbbell"
  | "two-dumbbells"
  | "eight-pointed-star"
  | "hourglass"
  | "laurel-crown"
  | "laurel-wreath"
  | "lyre"
  | "olive"
  | "pillar-icon"
  | "scroll-unfurled"
  | "shield"
  | "torch"
  | "vertical-banner";

export type ClassicalIconProps = {
  name: ClassicalIconName;
  className?: string;
  title?: string;
  "aria-hidden"?: boolean | "true" | "false";
};

/**
 * ClassicalIcon
 * Renders a monochrome SVG icon via CSS mask, so it inherits currentColor.
 * No SVGR required; file must exist under /public/icons/classical/<name>.svg
 */
export const ClassicalIcon: React.FC<ClassicalIconProps> = ({ name, className, title, ...rest }) => {
  const style: React.CSSProperties = {
    WebkitMaskImage: `url(/icons/classical/${name}.svg)`,
    maskImage: `url(/icons/classical/${name}.svg)`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    backgroundColor: "currentColor",
    display: "inline-block",
  };

  return (
    <span
      role={title ? "img" : undefined}
      aria-label={title}
      {...rest}
      className={cn("inline-block align-middle", className)}
      style={style}
      title={title}
    />
  );
};

export default ClassicalIcon;
