'use client';

import {
  Bell,
  Menu,
  User,
  Settings,
  Medal,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSupabaseLogout } from '@/lib/api/hooks/useSupabaseEmailAuth';
import { useUser } from '@/lib/api/hooks/useUser';
import { ModeToggle } from '@/components/mode-toggle';
import OrnateCorners from '@/components/backgrounds/OrnateCorners';
import Link from 'next/link';

interface HeaderProps {
  title: string;
  isMobile: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

export default function Header({
  title,
  isMobile,
  setIsMobileMenuOpen,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4">
      <OrnateCorners inset={6} length={20} thickness={1} />
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(true)}
          className="mr-1"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      )}
      <div className="flex-1">
        <h1 className="text-xl font-semibold truncate heading-classical">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <ModeToggle />
        <NotificationsDropdown />
        <UserDropdown />
      </div>
    </header>
  );
}

function NotificationsDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative rounded-full h-9 w-9"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
            3
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="grid gap-2 p-2">
          <NotificationItem
            icon={Medal}
            title="New Achievement Unlocked!"
            description="You've completed 10 workouts this month."
            time="2 hours ago"
          />
          <NotificationItem
            icon={Activity}
            title="Workout Reminder"
            description="Your scheduled chest workout is in 30 minutes."
            time="30 minutes ago"
          />
          <NotificationItem
            icon={TrendingUp}
            title="New Personal Record!"
            description="You've set a new PR on Bench Press: 225 lbs."
            time="Yesterday"
          />
        </div>
        <DropdownMenuSeparator />
        <div className="p-2">
          <Button variant="outline" size="sm" className="w-full">
            View All Notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NotificationItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  time: string;
}

function NotificationItem({
  icon: Icon,
  title,
  description,
  time,
}: NotificationItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="grid gap-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

function UserDropdown() {
  const { user } = useUser();
  const { mutate: logout } = useSupabaseLogout();
  const handleLogout = () => {
    logout();
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8 border-2 border-primary/20">
            <AvatarImage src={user?.avatarUrl || ''} alt="User" className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
