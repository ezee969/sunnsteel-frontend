'use client';

import React, { ReactNode, useState, useEffect, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Sidebar from '@/features/shell/components/Sidebar';
import Header from '@/features/shell/components/Header';
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
import { preloadAllCriticalComponents } from '@/lib/utils/dynamic-imports';
import { Skeleton } from '@/components/ui/skeleton';
import { TopProgressBar } from '@/components/ui/top-progress-bar';

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
  const [isNavActive, setIsNavActive] = useState(false);

  const isOnSessionPage = pathname.startsWith('/workouts/sessions/');

  // Client-side protection for all routes under (protected)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Update activeNav when pathname changes and stop progress once the route resolves
  useEffect(() => {
    setActiveNav(getActiveNavFromPath(pathname));
    // Finish navigation progress shortly after route resolves
    const done = setTimeout(() => setIsNavActive(false), 300);
    return () => clearTimeout(done);
  }, [pathname]);

  // Preload critical components after initial auth check
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Preload with delay to not interfere with initial render
      const timeoutId = setTimeout(() => {
        preloadAllCriticalComponents().catch(error => {
          console.warn('Failed to preload critical components:', error);
        });
      }, 2000); // 2 second delay
      
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, isLoading]);

  // Remove loading state handling - use loading.tsx files instead

  // While determining/redirecting auth state, render a stable empty shell
  if (isLoading || !isAuthenticated) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <ParchmentOverlay opacity={0.06} />
          <GoldVignetteOverlay intensity={0.06} />
        </div>
      </div>
    );
  }

  const layoutContent = (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-white dark:bg-neutral-950 transition-colors duration-300" />
        {/* Modern Brand Mesh Gradient */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#daa520,transparent_50%)]" />
           <div className="absolute inset-0 bg-[grid_32px_32px_rgba(0,0,0,0.02)] dark:bg-[grid_32px_32px_rgba(255,255,255,0.02)]" />
        </div>
        <ParchmentOverlay opacity={0.04} />
      </div>
      <div className="flex h-screen">
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
          onNavigateStart={() => setIsNavActive(true)}
        />
        {/* Main Content */}
        <div
          className={cn(
            'flex min-h-0 flex-col flex-1 transition-all duration-300',
            isMobile ? 'ml-0 w-full' : isSidebarOpen ? 'ml-64' : 'ml-20'
          )}
        >
          {/* Top progress bar for immediate feedback */}
          <TopProgressBar active={isNavActive} />
          <Header
            title={getTitleFromPath(pathname)}
            isMobile={isMobile}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
          {!isOnSessionPage && activeSession?.id && (
            <div className="px-3 sm:px-6 mt-2">
              <div className="rounded-md border bg-primary/5 p-1 sm:p-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Dumbbell className="h-3 w-3" />
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
        
          {/* Content */}
          <main className="flex-1 overflow-auto p-3 sm:p-6">
            <Suspense
              fallback={
                <div className="w-full max-w-lg space-y-3 p-6">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              }
            > 
              <div className={cn('h-full transition-all duration-300 ease-out')}>
                {children}
              </div>
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
  
  return <InitialLoadAnimation>{layoutContent}</InitialLoadAnimation>;
}
