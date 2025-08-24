'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/app/(protected)/components/Sidebar';
import Header from '@/app/(protected)/components/Header';
import { useAuthProtection } from '@/hooks/use-auth-protection';
import { useSidebar } from '@/hooks/use-sidebar';
import { useUser } from '@/lib/api/hooks/useUser';
import { ClipLoader } from 'react-spinners';
import { cn } from '@/lib/utils';
import { useActiveSession } from '@/lib/api/hooks/useWorkoutSession';
import { Button } from '@/components/ui/button';
import { Dumbbell } from 'lucide-react';
import Link from 'next/link';

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
    if (path.startsWith('/routines')) return 'routines';
    if (path.startsWith('/progress')) return 'progress';
    if (path.startsWith('/exercises')) return 'exercises';
    if (path.startsWith('/schedule')) return 'schedule';
    if (path.startsWith('/achievements')) return 'achievements';
    return 'dashboard'; // fallback
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-background/80">
        <div className="flex flex-col items-center gap-4">
          <ClipLoader color="#3b82f6" size={40} />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background to-background/80">
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
          title="Dashboard"
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
              <Button asChild size="sm" aria-label="Resume active session">
                <Link href={`/workouts/sessions/${activeSession.id}`}>Resume</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-3 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
