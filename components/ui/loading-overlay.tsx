"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ show, message = "Signing you in...", className }) => {
  if (!show) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-50 flex items-center justify-center",
        "backdrop-blur-sm bg-black/40 dark:bg-white/40",
        className
      )}
      aria-live="polite"
      role="status"
    >
      <div className="flex flex-col items-center gap-4 px-6 py-5 rounded-2xl border border-white/20 dark:border-black/20 bg-gradient-to-br from-black/30 to-black/10 dark:from-white/30 dark:to-white/10 shadow-xl">
        {/* Spinner */}
        <svg
          className="h-8 w-8 animate-spin text-[#FFD700] dark:text-[#B8860B]"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        <p className="text-sm font-medium text-white/90 dark:text-black/90">{message}</p>
      </div>
    </div>
  );
};
