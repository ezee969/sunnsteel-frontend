'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Sidebar from '@/app/(protected)/components/Sidebar';
import Header from '@/app/(protected)/components/Header';
import { useSidebar } from '@/hooks/use-sidebar';
import { cn } from '@/lib/utils';
import { useActiveSession } from '@/lib/api/hooks/useWorkoutSession';
import { Button } from '@/components/ui/button';
import { Dumbbell } from 'lucide-react';
import Link from 'next/link';
import ParchmentOverlay from '@/components/backgrounds/ParchmentOverlay';
import GoldVignetteOverlay from '@/components/backgrounds/GoldVignetteOverlay';
import { useSupabaseAuth } from '@/providers/supabase-auth-provider';
import { InitialLoadAnimation } from '@/components/InitialLoadAnimation';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useSupabaseAuth();
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
  const [isTransitioning, setIsTransitioning] = useState(false);

  const isOnSessionPage = pathname.startsWith('/workouts/sessions/');

  // Client-side protection for all routes under (protected)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Update activeNav when pathname changes
  useEffect(() => {
    setActiveNav(getActiveNavFromPath(pathname));
    // Trigger transition animation
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 50);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Remove loading state handling - use loading.tsx files instead

  // While determining/redirecting auth state, render a stable empty shell
  if (isLoading || !isAuthenticated) {
    return (
      <div className="relative min-h-screen">
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
      </div>
    );
  }

  return (
    <InitialLoadAnimation>
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
                  <Button
                    asChild
                    size="sm"
                    variant="classical"
                    aria-label="Resume active session"
                  >
                    <Link href={`/workouts/sessions/${activeSession.id}`}>
                      Resume
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Dashboard Content */}
            <main className="flex-1 overflow-auto p-3 sm:p-6">
              <div
                className={cn(
                  'min-h-full transition-all duration-300 ease-out',
                  isTransitioning
                    ? 'opacity-0 translate-y-2'
                    : 'opacity-100 translate-y-0'
                )}
              >
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </InitialLoadAnimation>
  );
}
