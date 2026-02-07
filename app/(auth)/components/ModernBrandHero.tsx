'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ModernBackground } from './ModernBackground';

export function ModernBrandHero() {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      {/* Abstract Modern Background */}
      {/* Abstract Modern Background */}
      <ModernBackground />

      {/* Quote Content - Remains Centered */}
      <div className="relative z-10 p-12 flex flex-col items-center text-center max-w-lg">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
            className="space-y-6"
        >
            <blockquote className="text-2xl font-light text-neutral-600 dark:text-neutral-300 italic leading-relaxed">
            &quot;Strength does not come from winning. Your struggles develop your strengths.&quot;
            </blockquote>
        </motion.div>
      </div>
    </div>
  );
}
