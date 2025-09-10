'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Sidebar from '@/app/(protected)/components/Sidebar';
import Header from '@/app/(protected)/components/Header';
import { useAuthProtection } from '@/hooks/use-auth-protection';
import { useSidebar } from '@/hooks/use-sidebar';
import { useUser } from '@/lib/api/hooks/useUser';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useActiveSession } from '@/lib/api/hooks/useWorkoutSession';
import { Button } from '@/components/ui/button';
import { Dumbbell } from 'lucide-react';
import Link from 'next/link';
import ParchmentOverlay from '@/components/backgrounds/ParchmentOverlay';
import GoldVignetteOverlay from '@/components/backgrounds/GoldVignetteOverlay';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { isLoading: isLoadingAuth } = useAuthProtection();
  const { isLoading: isLoadingUserProfile } = useUser();
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    isMobile,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  } = useSidebar();
  
  // Determine active nav based on current pathname
  const getActiveNavFromPath = (path: string) => {
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/workouts')) return 'workouts';
    if (path.startsWith('/routines')) return 'routines';
    if (path.startsWith('/progress')) return 'progress';
    if (path.startsWith('/exercises')) return 'exercises';
    if (path.startsWith('/schedule')) return 'schedule';
    if (path.startsWith('/achievements')) return 'achievements';
    return 'dashboard'; // fallback
  };

  // Compute header title based on pathname
  const getTitleFromPath = (path: string) => {
    if (path.startsWith('/workouts/sessions')) return 'Active Session';
    if (path.startsWith('/workouts/history')) return 'Workout History';
    if (path.startsWith('/workouts')) return 'Workouts';
    if (path.startsWith('/routines/new')) return 'New Routine';
    if (path.startsWith('/routines/edit')) return 'Edit Routine';
    if (path.startsWith('/routines')) return 'Routines';
    if (path.startsWith('/dashboard')) return 'Dashboard';
    return 'Dashboard';
  };

  const [activeNav, setActiveNav] = useState(() => getActiveNavFromPath(pathname));
  const { data: activeSession } = useActiveSession();

  const isOnSessionPage = pathname.startsWith('/workouts/sessions/');

  // Update activeNav when pathname changes
  useEffect(() => {
    setActiveNav(getActiveNavFromPath(pathname));
  }, [pathname]);

  if (isLoadingAuth || isLoadingUserProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {/* Background during loading */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/backgrounds/marble-light1536-x-1024.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover dark:hidden"
          />
          <Image
            src="/backgrounds/marble-dark-1536-x-1024.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover hidden dark:block"
          />
          <ParchmentOverlay opacity={0.06} />
          <GoldVignetteOverlay intensity={0.06} />
        </div>
        <div className="w-full max-w-lg space-y-3 p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/backgrounds/marble-light1536-x-1024.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover dark:hidden"
          priority={false}
        />
        <Image
          src="/backgrounds/marble-dark-1536-x-1024.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover hidden dark:block"
          priority={false}
        />
        <ParchmentOverlay opacity={0.06} />
        <GoldVignetteOverlay intensity={0.06} />
      </div>

      <div className="flex min-h-screen">
      {/* Mobile Menu Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm touch-none"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        setIsSidebarOpen={setIsSidebarOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <div
        className={cn(
          'flex flex-col flex-1 transition-all duration-300',
          isMobile ? 'ml-0 w-full' : isSidebarOpen ? 'ml-64' : 'ml-20'
        )}
      >
        <Header
          title={getTitleFromPath(pathname)}
          isMobile={isMobile}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* Active Session Banner */}
        {!isOnSessionPage && activeSession?.id && (
          <div className="px-3 sm:px-6">
            <div className="mb-2 rounded-md border bg-primary/5 p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Dumbbell className="h-4 w-4" />
                <span>Active workout session in progress.</span>
              </div>
              <Button asChild size="sm" variant="classical" aria-label="Resume active session">
                <Link href={`/workouts/sessions/${activeSession.id}`}>Resume</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-3 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      </div>
    </div>
  );
}
