"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TopLoadingBarProps {
  show: boolean;
  className?: string;
}

export const TopLoadingBar: React.FC<TopLoadingBarProps> = ({ show, className }) => {
  if (!show) return null;

  return (
    <div className={cn("absolute left-0 right-0 top-0 h-0.5 overflow-hidden", className)} role="status" aria-live="polite">
      <div className="relative w-full h-full bg-transparent">
        <div
          className={cn(
            "absolute left-0 top-0 h-0.5",
            "bg-gradient-to-r from-[#FFD700] via-[#B8860B] to-[#FFD700]",
            "animate-[loadingBar_1.1s_ease-in-out_infinite]",
          )}
          style={{ width: "35%" }}
        />
      </div>
      <style jsx>{`
        @keyframes loadingBar {
          0% { transform: translateX(-50%); opacity: 0.7; }
          50% { transform: translateX(90%); opacity: 1; }
          100% { transform: translateX(150%); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};
