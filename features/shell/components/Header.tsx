'use client'

import { ChevronLeft, Menu, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

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
	const t = useTranslations('shell.header')
	return (
		// §11.10: 56 mobile / 64 desktop, ground-coloured, one rule below. Opaque,
		// not blurred - nothing in v1.0 is translucent. The framing OrnateCorners
		// are retired; the brackets now sit on the page inscription instead, one
		// pair per screen (§11.11).
		// v1.1 §26.6: below `sm` the row spends its width on the search field
		// rather than on gaps -- 64px of them clipped the field's own
		// placeholder at 390. Every control keeps its 44px target.
		<header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-rule bg-background px-4 sm:gap-4 md:h-16">
			{isMobile ? (
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setIsMobileMenuOpen(true)}
					className="-ml-2 size-11 sm:mr-1 md:size-10"
				>
					<Menu className="h-5 w-5" aria-hidden />
					<span className="sr-only">{t('toggleMenu')}</span>
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
					aria-label={isSidebarOpen ? t('collapseSidebar') : t('expandSidebar')}
					aria-expanded={isSidebarOpen}
					className="mr-1"
				>
					{/* Motion spec §2.3: one chevron rotated, not two glyphs swapped. */}
					<ChevronLeft
						aria-hidden
						className={cn(
							'h-5 w-5 transition-transform duration-[var(--motion-base)] ease-standard',
							!isSidebarOpen && 'rotate-180',
						)}
					/>
				</Button>
			)}
			<div className="flex min-w-0 flex-1 items-center justify-between sm:mr-4">
				{/* Sized to content, not to a fixed 192px: that width was set for
				    Bebas, and Cinzel at the same size is wider - it truncated even
				    "Routines". Capped, but still shrinkable - pinning it with
				    `shrink-0` overflowed the header row at 768.

				    No corner brackets here. `truncate` is `overflow: hidden`, which
				    clips the pseudo-elements, so they rendered as nothing at all -
				    and §11.11 allows one pair per screen, which the page masthead
				    already carries. */}
				{/* v1.1 §26.2: a running head, as a printed book carries its chapter
				    at the top of the page -- quiet, in the page's own case. It was a third Cinzel inscription above
				    the page's own masthead, usually the same word (§5.3 allows two). */}
				<p className="type-panel mr-4 hidden min-w-0 max-w-[18rem] truncate text-ink-2 sm:block">
					{title}
				</p>
				<div className="min-w-0 flex-1 sm:ml-0 sm:max-w-sm">
					<SearchBar />
				</div>
			</div>
			<div className="-mr-2 flex shrink-0 items-center sm:mr-0 sm:gap-2">
				<NotificationBell menu={!isMobile} />
				<ModeToggle />
				<UserDropdown />
			</div>
		</header>
	)
}

function UserDropdown() {
	const t = useTranslations('shell.header')
	const { user } = useUser()
	const { push } = useToast()
	const { mutate: logout, isPending } = useSupabaseLogout()
	const handleLogout = () => {
		logout(undefined, {
			onError: () => {
				push({
					title: t('signOutFailedTitle'),
					description: t('signOutFailedBody'),
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
					aria-label={t('accountMenu')}
					className="size-11 rounded-full md:size-10"
				>
					<Avatar className="h-8 w-8 border border-rule">
						<AvatarImage
							src={user?.avatarUrl || ''}
							alt={t('userAvatar')}
							className="object-cover"
						/>
						<AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>{t('myAccount')}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href="/profile" className="cursor-pointer">
						<User className="mr-2 h-4 w-4" aria-hidden />
						{t('profile')}
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link href="/settings" className="cursor-pointer">
						<Settings className="mr-2 h-4 w-4" aria-hidden />
						{t('settings')}
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleLogout} disabled={isPending}>
					{isPending ? t('signingOut') : t('logOut')}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
