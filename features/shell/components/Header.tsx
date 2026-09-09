'use client'

import { Menu, Settings, User } from 'lucide-react'
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
import { useSupabaseLogout } from '@/lib/api/hooks/useSupabaseEmailAuth'
import { useUser } from '@/lib/api/hooks/useUser'

interface HeaderProps {
	title: string
	isMobile: boolean
	setIsMobileMenuOpen: (isOpen: boolean) => void
}

export default function Header({
	title,
	isMobile,
	setIsMobileMenuOpen,
}: HeaderProps) {
	return (
		// §11.10: 56 mobile / 64 desktop, ground-coloured, one rule below. Opaque,
		// not blurred - nothing in v1.0 is translucent. The framing OrnateCorners
		// are retired; the brackets now sit on the page inscription instead, one
		// pair per screen (§11.11).
		<header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-rule bg-background px-4 md:h-16">
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
				{/* Sized to content, not to a fixed 192px: that width was set for
				    Bebas, and Cinzel at the same size is wider - it truncated even
				    "Routines". Capped, but still shrinkable - pinning it with
				    `shrink-0` overflowed the header row at 768.

				    No corner brackets here. `truncate` is `overflow: hidden`, which
				    clips the pseudo-elements, so they rendered as nothing at all -
				    and §11.11 allows one pair per screen, which the page masthead
				    already carries. */}
				<h1 className="type-section mr-4 hidden min-w-0 max-w-[18rem] truncate text-foreground sm:block">
					{title}
				</h1>
				<div className="flex-1 max-w-sm ml-auto sm:ml-0">
					<SearchBar />
				</div>
			</div>
			<div className="flex items-center gap-2 shrink-0">
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
				<Button variant="ghost" size="icon" className="rounded-full">
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
