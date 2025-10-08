'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClassicalIcon } from '@/components/icons/ClassicalIcon';
import Image from 'next/image';

interface InitialLoadAnimationProps {
  children: React.ReactNode;
}

export const InitialLoadAnimation = ({ children }: InitialLoadAnimationProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Only show animation on mobile
    if (window.innerWidth >= 1024) {
      // Desktop: skip animation entirely
      setShowContent(true);
      setIsLoading(false);
    } else {
      // Mobile: show animation
      const contentTimer = setTimeout(() => {
        setShowContent(true);
      }, 3200);

      const exitTimer = setTimeout(() => {
        setIsLoading(false);
      }, 3500);

      return () => {
        clearTimeout(contentTimer);
        clearTimeout(exitTimer);
        window.removeEventListener('resize', checkMobile);
      };
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.8, ease: 'easeInOut' },
            }}
          >
            {/* Mobile-only Background */}
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.0, ease: 'easeOut' }}
            >
              {/* Primary background */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black" />

              {/* Mobile: Use the angel image */}
              <div className="absolute inset-0">
                <Image
                  src="/backgrounds/angel-david-w-sword.webp"
                  alt="Classical Angel Warrior"
                  fill
                  className="object-cover object-center opacity-70"
                  priority
                />
              </div>

              {/* Gradient overlays for better text readability and edge blending */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

              {/* Vignette effect for edge darkening */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.8) 100%)',
                }}
              />
            </motion.div>

            {/* Ornate frame overlay - Mobile Responsive */}
            <div className="absolute inset-2 sm:inset-4 border border-amber-400/30 rounded-lg" />
            <div className="absolute inset-3 sm:inset-6 border border-amber-600/20 rounded-lg" />

            {/* Main Content Container - Mobile Responsive */}
            <motion.div
              className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Gothic Title with dramatic entrance */}
              <motion.div
                className="mb-8 sm:mb-12"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.8,
                  delay: 0.5,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <motion.h1
                  className="text-4xl sm:text-6xl lg:text-8xl font-black tracking-wider mb-2 sm:mb-4"
                  style={{
                    color: '#DAA520',
                    fontFamily: '"Cinzel", "Times New Roman", serif',
                    textShadow:
                      '0 0 20px rgba(218, 165, 32, 0.5), 0 0 40px rgba(218, 165, 32, 0.3), 2px 2px 4px rgba(0,0,0,0.8)',
                    letterSpacing: '0.05em',
                    fontWeight: '900',
                  }}
                >
                  SUNNSTEEL
                </motion.h1>

                {/* Ornate divider - Responsive */}
                <motion.div
                  className="flex items-center justify-center mb-4 sm:mb-6"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.9, ease: 'easeOut' }}
                >
                  <div className="w-8 sm:w-12 lg:w-16 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                  <ClassicalIcon
                    name="laurel-crown"
                    className="w-6 h-6 sm:w-8 sm:h-8 mx-3 sm:mx-6"
                    style={{ color: '#DAA520' }}
                  />
                  <div className="w-8 sm:w-12 lg:w-16 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                </motion.div>

                {/* Gothic subtitle - Mobile optimized */}
                <motion.p
                  className="text-lg sm:text-xl lg:text-2xl font-medium tracking-widest uppercase"
                  style={{
                    color: '#B8860B',
                    fontFamily: '"Cinzel", "Times New Roman", serif',
                    textShadow:
                      '0 0 10px rgba(184, 134, 11, 0.6), 1px 1px 2px rgba(0,0,0,0.8)',
                    letterSpacing: '0.1em',
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                >
                  Forge Your Path
                </motion.p>
              </motion.div>

              {/* Strength symbols with gothic styling - Mobile Responsive */}
              <motion.div
                className="flex justify-center items-center space-x-4 sm:space-x-8 lg:space-x-12 mb-8 sm:mb-12"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.5 }}
              >
                {[
                  { name: 'shield', label: 'PROTECTION' },
                  { name: 'torch', label: 'GUIDANCE' },
                  { name: 'laurel-crown', label: 'VICTORY' },
                ].map((item, index) => (
                  <motion.div
                    key={item.name}
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 1.6 + index * 0.12,
                      duration: 0.4,
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                    }}
                  >
                    <ClassicalIcon
                      name={item.name as 'shield' | 'torch' | 'laurel-crown'}
                      className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mb-1 sm:mb-2"
                      style={{
                        color: '#DAA520',
                        filter: 'drop-shadow(0 0 8px rgba(218, 165, 32, 0.4))',
                      }}
                    />
                    <span
                      className="text-xs sm:text-xs font-medium tracking-widest uppercase"
                      style={{
                        color: '#B8860B',
                        fontFamily: '"Cinzel", "Times New Roman", serif',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                      }}
                    >
                      {item.label}
                    </span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Gothic loading indicator - Mobile Responsive */}
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.9, duration: 0.4 }}
              >
                <motion.p
                  className="text-sm sm:text-base lg:text-lg font-medium tracking-widest uppercase mb-3 sm:mb-4"
                  style={{
                    color: '#DAA520',
                    fontFamily: '"Cinzel", "Times New Roman", serif',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  }}
                >
                  Preparing Your Training
                </motion.p>

                {/* Ornate progress bar - Responsive */}
                <div className="w-48 sm:w-56 lg:w-64 h-1 bg-amber-900/30 rounded-full overflow-hidden border border-amber-700/20">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full shadow-lg"
                    style={{
                      boxShadow: '0 0 8px rgba(218, 165, 32, 0.5)',
                    }}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{
                      duration: 1.0,
                      delay: 2.1,
                      ease: 'easeOut',
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clean content entrance */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: 0.6, ease: 'easeInOut' },
            }}
            className="min-h-screen"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
