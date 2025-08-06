'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import Sidebar from '@/app/(protected)/components/Sidebar';
import Header from '@/app/(protected)/components/Header';
import { useAuthProtection } from '@/hooks/use-auth-protection';
import { useSidebar } from '@/hooks/use-sidebar';
import { Loading } from '@/components/layout/loading';
import { useUser } from '@/lib/api/hooks/useUser';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isLoading: isLoadingAuth } = useAuthProtection();
  const { isLoading: isLoadingUserProfile } = useUser();
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    isMobile,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  } = useSidebar();
  const [activeNav, setActiveNav] = useState('dashboard');

  if (isLoadingAuth || isLoadingUserProfile) {
    return <Loading />;
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

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-3 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
