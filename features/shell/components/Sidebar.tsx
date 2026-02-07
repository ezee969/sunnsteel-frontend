'use client';

import {
  Activity,
  Calendar,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  Home,
  LucideIcon,
  Medal,
  Settings,
  TrendingUp,
  Weight,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useUser } from '@/lib/api/hooks/useUser';
import { ClassicalIcon, ClassicalIconName } from '@/components/icons/ClassicalIcon';
import Link from 'next/link';
import { useEffect, useCallback } from 'react';
import { useNavigationPrefetch } from '@/hooks/use-navigation-prefetch';

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  classicalName?: ClassicalIconName;
  href: string;
  disabled: boolean;
};

const SIDEBAR_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    classicalName: 'pillar-icon',
    href: '/dashboard',
    disabled: false,
  },
  {
    id: 'workouts',
    label: 'Workouts',
    icon: Dumbbell,
    classicalName: 'dumbbell',
    href: '/workouts',
    disabled: false,
  },
  {
    id: 'routines',
    label: 'Routines',
    icon: Activity,
    classicalName: 'scroll-unfurled',
    href: '/routines',
    disabled: false,
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: TrendingUp,
    classicalName: 'compass',
    href: '/progress',
    disabled: true,
  },
  {
    id: 'exercises',
    label: 'Exercises',
    icon: Weight,
    classicalName: 'two-dumbbells',
    href: '/exercises',
    disabled: true,
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: Calendar,
    classicalName: 'hourglass',
    href: '/schedule',
    disabled: true,
  },
  {
    id: 'achievements',
    label: 'Achievements',
    icon: Medal,
    classicalName: 'laurel-crown',
    href: '/achievements',
    disabled: true,
  },
] as const;

interface SidebarProps {
  isMobile: boolean;
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  activeNav: string;
  setActiveNav: (navItem: string) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  onNavigateStart?: () => void;
}

export default function Sidebar({
  isMobile,
  isSidebarOpen,
  isMobileMenuOpen,
  activeNav,
  setActiveNav,
  setIsSidebarOpen,
  setIsMobileMenuOpen,
  onNavigateStart,
}: SidebarProps) {
  const { user } = useUser();
  const { prefetchPage, prefetchMainNavigation, isReady } = useNavigationPrefetch();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Prefetch main navigation on component mount
  useEffect(() => {
    if (isReady) {
      // Prefetch with a slight delay to not interfere with initial render
      const timeoutId = setTimeout(() => {
        prefetchMainNavigation({ immediate: true, priority: 'high' });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [isReady, prefetchMainNavigation]);

  // Handle hover prefetching for individual routes
  const handleNavHover = useCallback(
    (href: string) => {
      prefetchPage(href, { immediate: true, priority: 'high' });
    },
    [prefetchPage]
  );

  return (
    <div
      className={cn(
        'fixed inset-y-0 z-50 flex flex-col backdrop-blur-sm border-r shadow-lg transition-all duration-300 ease-in-out',
        // Classical marble background + subtle border in gold tones
        'bg-marble-light dark:bg-marble-light border-[rgba(218,165,32,0.2)] dark:border-[rgba(255,215,0,0.18)]',
        // Ensure consistent background across mobile and desktop
        'bg-sidebar/95 dark:bg-sidebar/95',
        isMobile
          ? isMobileMenuOpen
            ? 'left-0 w-[85%] max-w-[300px]'
            : '-left-full'
          : isSidebarOpen
          ? 'left-0 w-64'
          : 'left-0 w-20'
      )}
    >
      {/* Golden vertical accent line */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-[2px] bg-gradient-to-b from-[rgba(255,215,0,0.2)] via-[rgba(218,165,32,0.35)] to-[rgba(255,215,0,0.2)]" />
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div
          className={cn(
            'flex items-center gap-2 font-semibold transition-all duration-300',
            !isSidebarOpen && !isMobile && 'opacity-0 w-0 overflow-hidden'
          )}
        >
          <span
            className="text-xl font-black tracking-wider text-black dark:text-white"
            style={{
              fontFamily: '"Cinzel", "Times New Roman", serif',
              letterSpacing: '0.05em',
              fontWeight: '900',
            }}
          >
            SUNNSTEEL
          </span>
        </div>
        {isSidebarOpen && isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn('rounded-full', !isSidebarOpen && 'ml-auto')}
          >
            {isSidebarOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid gap-2 px-2">
          {SIDEBAR_NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.disabled ? '#' : item.href}
              prefetch={!item.disabled}
              onMouseEnter={() => !item.disabled && handleNavHover(item.href)}
              onClick={(e) => {
                if (item.disabled) {
                  e.preventDefault();
                  return;
                }
                // Set active nav immediately for consistent visual state
                setActiveNav(item.id);
                // Close mobile sidebar after navigation
                if (isMobile) {
                  setIsMobileMenuOpen(false);
                }
                // Signal navigation start for global feedback
                onNavigateStart && onNavigateStart();
              }}
            >
              <Button
                variant={activeNav === item.id ? 'default' : 'ghost'}
                disabled={item.disabled}
                className={cn(
                  'gap-3 h-12 relative overflow-hidden group transition-all duration-300 w-full',
                  isSidebarOpen || isMobile ? 'justify-start' : 'justify-center',
                  activeNav === item.id 
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 border-l-2 border-amber-600 dark:border-amber-400' 
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 border-l-2 border-transparent hover:border-neutral-300 dark:hover:border-neutral-700'
                )}
                asChild={false}
              >
                <div
                  className={cn(
                    'absolute inset-0 opacity-0 bg-gradient-to-r from-amber-600/5 dark:from-amber-400/5 to-transparent transition-opacity',
                    activeNav === item.id ? 'opacity-100' : 'group-hover:opacity-100'
                  )}
                />
                {item.classicalName ? (
                  <ClassicalIcon
                    name={item.classicalName}
                    aria-hidden
                    className={cn(
                      'h-5 w-5 transition-all',
                      activeNav === item.id
                        ? 'text-amber-500 dark:text-amber-400'
                        : 'text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-neutral-100'
                    )}
                  />
                ) : (
                  <item.icon
                    className={cn(
                      'h-5 w-5 transition-all',
                      activeNav === item.id
                        ? 'text-amber-500 dark:text-amber-400'
                        : 'text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-neutral-100'
                    )}
                  />
                )}
                <span
                  className={cn(
                    'transition-all duration-300 font-medium',
                    !isSidebarOpen && !isMobile && 'opacity-0 w-0 overflow-hidden',
                    activeNav === item.id ? 'translate-x-1' : 'group-hover:translate-x-1'
                  )}
                >
                  {item.label}
                </span>
              </Button>
            </Link>
          ))}
          <Separator className="my-4" />
          <Button
            disabled={true}
            variant="ghost"
            className={cn(
              'justify-start gap-3 h-12 transition-all duration-300',
              !isSidebarOpen && !isMobile && 'justify-center'
            )}
            onClick={() => {
              const button = document.activeElement as HTMLElement;
              if (button) button.classList.add('scale-95');
              setTimeout(() => {
                if (button) button.classList.remove('scale-95');
              }, 100);
            }}
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
            <span
              className={cn(
                'transition-all duration-300',
                !isSidebarOpen && !isMobile && 'opacity-0 w-0 overflow-hidden'
              )}
            >
              Settings
            </span>
          </Button>
        </nav>
      </ScrollArea>
      <div className="border-t p-4">
        <div
          className={cn(
            'flex items-center gap-3',
            !isSidebarOpen && !isMobile && 'justify-center'
          )}
        >
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src="/logo.png" alt="User" />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div
            className={cn(
              'flex flex-col transition-all duration-300',
              !isSidebarOpen && !isMobile && 'opacity-0 w-0 overflow-hidden'
            )}
          >
            <span className="text-sm font-medium">{user?.name}</span>
            <span className="text-xs text-muted-foreground">Premium Member</span>
          </div>
        </div>
      </div>
    </div>
  );
}
