'use client';

import { Menu, User, Settings } from 'lucide-react';
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
import { SearchBar } from '@/components/ui/search-bar';

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
      <div className="flex-1 min-w-0 mr-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold truncate heading-classical hidden sm:block mr-4 w-48">{title}</h1>
        <div className="flex-1 max-w-sm ml-auto sm:ml-0">
          <SearchBar />
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <ModeToggle />
        <UserDropdown />
      </div>
    </header>
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
