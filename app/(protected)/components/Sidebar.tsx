'use client';

import {
  Activity,
  Calendar,
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
import { useRouter } from 'next/navigation';
// import logo from '@/public/logo.png';
// import Image from 'next/image';
type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  disabled: boolean;
};

const SIDEBAR_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    disabled: false,
  },
  {
    id: 'routines',
    label: 'Routines',
    icon: Activity,
    href: '/routines',
    disabled: false,
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: TrendingUp,
    href: '/progress',
    disabled: true,
  },
  {
    id: 'exercises',
    label: 'Exercises',
    icon: Weight,
    href: '/exercises',
    disabled: true,
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: Calendar,
    href: '/schedule',
    disabled: true,
  },
  {
    id: 'achievements',
    label: 'Achievements',
    icon: Medal,
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
}

export default function Sidebar({
  isMobile,
  isSidebarOpen,
  isMobileMenuOpen,
  activeNav,
  setActiveNav,
  setIsSidebarOpen,
  setIsMobileMenuOpen,
}: SidebarProps) {
  const { user } = useUser();
  const router = useRouter();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div
      className={cn(
        'fixed inset-y-0 z-50 flex flex-col bg-card/80 backdrop-blur-sm border-r shadow-lg transition-all duration-300 ease-in-out',
        isMobile
          ? isMobileMenuOpen
            ? 'left-0 w-[85%] max-w-[300px]'
            : '-left-full'
          : isSidebarOpen
          ? 'left-0 w-64'
          : 'left-0 w-20'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div
          className={cn(
            'flex items-center gap-2 font-semibold transition-all duration-300',
            !isSidebarOpen && !isMobile && 'opacity-0 w-0 overflow-hidden'
          )}
        >
          {/* <Image src={logo} alt="logo" width={56} height={56} /> */}
          <span className="text-xl">SUNNSTEEL</span>
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
            <Button
              key={item.id}
              variant={activeNav === item.id ? 'default' : 'ghost'}
              disabled={item.disabled}
              className={cn(
                'justify-start gap-3 h-12 relative overflow-hidden group transition-all duration-300',
                activeNav === item.id && 'bg-primary text-primary-foreground'
              )}
              onClick={() => {
                // Create a scale animation effect when clicked
                const button = document.activeElement as HTMLElement;
                if (button) button.classList.add('scale-95');
                setTimeout(() => {
                  if (button) button.classList.remove('scale-95');
                  setActiveNav(item.id);
                  // Close mobile sidebar after navigation
                  if (isMobile) {
                    setIsMobileMenuOpen(false);
                  }
                }, 100);
                router.push(item.href);
              }}
            >
              <div
                className={cn(
                  'absolute inset-0 opacity-0 bg-gradient-to-r from-primary/10 to-primary/5 transition-opacity',
                  activeNav === item.id ? 'opacity-100' : 'group-hover:opacity-100'
                )}
              />
              <item.icon
                className={cn(
                  'h-5 w-5 transition-all',
                  activeNav === item.id
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              <span
                className={cn(
                  'transition-all duration-300',
                  !isSidebarOpen && !isMobile && 'opacity-0 w-0 overflow-hidden'
                )}
              >
                {item.label}
              </span>
              {activeNav === item.id && (
                <div className="absolute right-0 top-0 h-full w-1 bg-primary-foreground/20" />
              )}
            </Button>
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
            <AvatarImage src="/placeholder-user.jpg" alt="User" />
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
