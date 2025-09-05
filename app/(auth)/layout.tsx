'use client';

import type React from 'react';
import { motion } from 'framer-motion';
import { BackgroundOverlay } from './components/BackgroundOverlay';
import { ModeToggle } from '@/components/mode-toggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-black dark:bg-white transition-colors duration-300">
      <BackgroundOverlay />
      <div className="absolute right-4 top-4 z-20">
        <ModeToggle />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
