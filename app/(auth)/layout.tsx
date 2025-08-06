import type React from 'react';
// import { ThemeToggle } from '@/components/common/theme-toggle';
import { BackgroundOverlay } from './components/BackgroundOverlay';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-black dark:bg-white transition-colors duration-700">
      <BackgroundOverlay />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        {/* <ThemeToggle /> */}
        <div className="animate-fade-in">{children}</div>
      </div>
    </div>
  );
}
