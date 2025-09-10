'use client';

import type React from 'react';
import { motion } from 'framer-motion';
import { BackgroundOverlay } from './components/BackgroundOverlay';
import { ModeToggle } from '@/components/mode-toggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-white dark:bg-black transition-colors duration-300">
      <BackgroundOverlay />

      {/* Top-right theme toggle */}
      <div className="relative z-20">
        <div className="absolute right-4 top-4">
          <ModeToggle />
        </div>
      </div>

      {/* Subtle gold top border accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent dark:via-amber-300/60" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
