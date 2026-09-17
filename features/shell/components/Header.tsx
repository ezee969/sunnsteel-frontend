'use client'

import { ChevronLeft, Menu, Settings, User } from 'lucide-react'
import Link from 'next/link'

import { ModeToggle } from '@/components/mode-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SearchBar } from '@/components/ui/search-bar'
import { useToast } from '@/components/ui/toast'
import { NotificationBell } from '@/features/notifications/notification-bell'
import { useSupabaseLogout } from '@/lib/api/hooks/useSupabaseEmailAuth'
import { useUser } from '@/lib/api/hooks/useUser'
import { cn } from '@/lib/utils'

interface HeaderProps {
	title: string
	isMobile: boolean
	isSidebarOpen: boolean
	setIsMobileMenuOpen: (isOpen: boolean) => void
	onToggleSidebar: () => void
}

export default function Header({
	title,
	isMobile,
	isSidebarOpen,
	setIsMobileMenuOpen,
	onToggleSidebar,
}: HeaderProps) {
	return (
		// §11.10: 56 mobile / 64 desktop, ground-coloured, one rule below. Opaque,
		// not blurred - nothing in v1.0 is translucent. The framing OrnateCorners
		// are retired; the brackets now sit on the page inscription instead, one
		// pair per screen (§11.11).
		<header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-rule bg-background px-4 md:h-16">
			{isMobile ? (
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setIsMobileMenuOpen(true)}
					className="mr-1 size-11 md:size-10"
				>
					<Menu className="h-5 w-5" />
					<span className="sr-only">Toggle Menu</span>
				</Button>
			) : (
				/* The sidebar collapse control, where motion spec §2.3 already placed
				   it ("Sidebar collapse chevron (topbar)"). It moved out of the sidebar
				   header so the rail's crown could carry the brand mark at `w-20`,
				   where 48px of content width could not hold both. It takes the slot
				   the mobile menu button occupies, so the two never coexist. */
				<Button
					variant="ghost"
					size="icon"
					onClick={onToggleSidebar}
					aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
					aria-expanded={isSidebarOpen}
					className="mr-1"
				>
					{/* Motion spec §2.3: one chevron rotated, not two glyphs swapped. */}
					<ChevronLeft
						className={cn(
							'h-5 w-5 transition-transform duration-[var(--motion-base)] ease-standard',
							!isSidebarOpen && 'rotate-180',
						)}
					/>
				</Button>
			)}
			<div className="flex-1 min-w-0 mr-4 flex items-center justify-between">
				{/* Sized to content, not to a fixed 192px: that width was set for
				    Bebas, and Cinzel at the same size is wider - it truncated even
				    "Routines". Capped, but still shrinkable - pinning it with
				    `shrink-0` overflowed the header row at 768.

				    No corner brackets here. `truncate` is `overflow: hidden`, which
				    clips the pseudo-elements, so they rendered as nothing at all -
				    and §11.11 allows one pair per screen, which the page masthead
				    already carries. */}
				<p className="type-section mr-4 hidden min-w-0 max-w-[18rem] truncate text-foreground sm:block">
					{title}
				</p>
				<div className="flex-1 max-w-sm ml-auto sm:ml-0">
					<SearchBar />
				</div>
			</div>
			<div className="flex items-center gap-2 shrink-0">
				<NotificationBell />
				<ModeToggle />
				<UserDropdown />
			</div>
		</header>
	)
}

function UserDropdown() {
	const { user } = useUser()
	const { push } = useToast()
	const { mutate: logout, isPending } = useSupabaseLogout()
	const handleLogout = () => {
		logout(undefined, {
			onError: () => {
				push({
					title: 'Could not sign out',
					description: 'Check your connection and try again.',
					variant: 'destructive',
				})
			},
		})
	}
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					aria-label="Account menu"
					className="size-11 rounded-full md:size-10"
				>
					<Avatar className="h-8 w-8 border border-rule">
						<AvatarImage
							src={user?.avatarUrl || ''}
							alt="User"
							className="object-cover"
						/>
						<AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
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
				<DropdownMenuItem onClick={handleLogout} disabled={isPending}>
					{isPending ? 'Signing out…' : 'Log out'}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
