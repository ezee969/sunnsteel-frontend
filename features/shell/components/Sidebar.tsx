'use client'

import {
	Activity,
	Bell,
	BellDot,
	Calendar,
	Compass,
	Dumbbell,
	History,
	Home,
	LucideIcon,
	Medal,
	Rss,
	Settings,
	ShieldCheck,
	TrendingUp,
	Weight,
	X,
} from 'lucide-react'
import Link from 'next/link'
import { type CSSProperties, useEffect, useRef } from 'react'

import { useTodaysWorkouts } from '@/app/(protected)/dashboard/hooks/useTodaysWorkouts'
import {
	SunnsteelLockup,
	SunnsteelMark,
} from '@/components/brand/sunnsteel-lockup'
import {
	ClassicalIcon,
	ClassicalIconName,
} from '@/components/icons/ClassicalIcon'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/toast'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { useNotifications } from '@/lib/api/hooks/useNotifications'
import { useUser } from '@/lib/api/hooks/useUser'
import { cn } from '@/lib/utils'
import { buildNavigationIndicators } from '@/lib/utils/navigation-indicators'

type NavItemBase = {
	id: string
	label: string
	icon: LucideIcon
	classicalName?: ClassicalIconName
}

type NavItem = NavItemBase &
	({ disabled: true; href?: never } | { disabled: false; href: string })

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
	// ROUT-07: discovery is a separate destination from your own routines. It
	// lists other members' shared programmes, which the Routines page never
	// shows, so folding it in would hide it behind a page about your own.
	{
		id: 'discover-routines',
		label: 'Discover',
		icon: Compass,
		href: '/routines/discover',
		disabled: false,
	},
	// History needs its own entry: `/workouts` redirects into the live session
	// whenever one is running, so the "View History" link on that page is
	// unreachable for exactly as long as the user has something to review.
	{
		id: 'history',
		label: 'History',
		icon: History,
		href: '/workouts/history',
		disabled: false,
	},
	{
		id: 'progress',
		label: 'Progress',
		icon: TrendingUp,
		classicalName: 'compass',
		href: '/progress',
		disabled: false,
	},
	{
		id: 'exercises',
		label: 'Exercises',
		icon: Weight,
		classicalName: 'two-dumbbells',
		href: '/exercises',
		disabled: false,
	},
	{
		id: 'schedule',
		label: 'Schedule',
		icon: Calendar,
		classicalName: 'hourglass',
		href: '/schedule',
		disabled: false,
	},
	{
		id: 'achievements',
		label: 'Achievements',
		icon: Medal,
		classicalName: 'laurel-crown',
		href: '/achievements',
		disabled: false,
	},
	// SOC-03: what the members you follow did, and who sees what you did. It is
	// not Notifications, which is about you; this is about the people you follow.
	{
		id: 'activity',
		label: 'Activity',
		icon: Rss,
		href: '/activity',
		disabled: false,
	},
	{
		id: 'notifications',
		label: 'Notifications',
		icon: Bell,
		href: '/notifications',
		disabled: false,
	},
] satisfies NavItem[]

// TRUST-04: the review queue, appended only for an account that holds the
// moderator flag. It is a real destination rather than a Settings card because
// it is a working surface with its own paging and its own record, and the flag
// is on the owner's own profile read -- the server answers 404 on every
// moderation route regardless, so hiding the row is presentation, not control.
const MODERATION_NAV_ITEM: NavItem = {
	id: 'moderation',
	label: 'Moderation',
	icon: ShieldCheck,
	href: '/moderation',
	disabled: false,
}

interface SidebarProps {
	isMobile: boolean
	isSidebarOpen: boolean
	isMobileMenuOpen: boolean
	activeNav: string
	setActiveNav: (navItem: string) => void
	setIsMobileMenuOpen: (isOpen: boolean) => void
	onNavigateStart?: () => void
}

export default function Sidebar({
	isMobile,
	isSidebarOpen,
	isMobileMenuOpen,
	activeNav,
	setActiveNav,
	setIsMobileMenuOpen,
	onNavigateStart,
}: SidebarProps) {
	const { user } = useUser()
	const notifications = useNotifications()
	const today = useTodaysWorkouts()
	const { push } = useToast()
	// The active marker is positioned from this list's own index, so the
	// moderation row has to be part of the list the rows render from rather
	// than spliced in afterwards.
	const navItems = user?.isModerator
		? [...SIDEBAR_NAV_ITEMS, MODERATION_NAV_ITEM]
		: SIDEBAR_NAV_ITEMS
	const indicators = buildNavigationIndicators({
		unreadNotifications: notifications.data?.unreadCount,
		plannedToday: today.entries.length,
		hasActiveSession: today.active?.status === 'IN_PROGRESS',
	})

	// -1 when the active route is not in this list (Settings), which hides the
	// marker rather than parking it on the wrong row.
	const activeIndex = navItems.findIndex(item => item.id === activeNav)

	const handleDisabledClick = (label: string) => {
		push({
			title: `${label} - Coming Soon`,
			description:
				'We are working hard on bringing this feature to Sunnsteel. Stay tuned!',
		})
	}

	const closeButtonRef = useRef<HTMLButtonElement>(null)
	const isDrawerOpen = isMobile && isMobileMenuOpen

	// TD-36: below 768 the open drawer behaves as a modal. Focus moves into it,
	// Escape closes it, and focus goes back to whatever opened it - the header's
	// menu button. The layout makes the rest of the page inert meanwhile, and the
	// closed drawer is inert below, so its off-screen links leave the tab order.
	useEffect(() => {
		if (!isDrawerOpen) return
		const opener = document.activeElement
		closeButtonRef.current?.focus()
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setIsMobileMenuOpen(false)
		}
		document.addEventListener('keydown', closeOnEscape)
		return () => {
			document.removeEventListener('keydown', closeOnEscape)
			if (opener instanceof HTMLElement) opener.focus()
		}
	}, [isDrawerOpen, setIsMobileMenuOpen])

	// Route prefetching is handled by next/link, which prefetches these nav
	// targets automatically (they are all statically prerendered).

	return (
		<div
			inert={isMobile && !isMobileMenuOpen}
			className={cn(
				// v1.0 §11.10: an index column, not a panel. Ground-coloured with a
				// single rule on its right edge - no marble wash, no gold hex border,
				// no blur, no shadow. Elevation in this system is tonal (§8).
				'fixed inset-y-0 z-50 flex flex-col border-r border-rule bg-background',
				// Motion spec 2.3: the drawer slides on `transform`. `left` and
				// `width` are on the never-animate list (1.2), so the drawer always
				// occupies its open box and is pushed off-screen by a translate -
				// `-left-full` could not be animated at all. Desktop collapse stays
				// instant for the same reason: width is layout, not message.
				isMobile
					? cn(
							'left-0 w-[85%] max-w-[300px] transition-transform',
							isMobileMenuOpen
								? 'translate-x-0 duration-[var(--motion-slow)] ease-standard'
								: '-translate-x-full duration-[var(--motion-base)] ease-exit',
						)
					: isSidebarOpen
						? 'left-0 w-64'
						: 'left-0 w-20',
			)}
		>
			{/* Brand only. The collapse chevron used to share this row, which left
			    48px of content at `w-20` - the 40px button filled it and the mark had
			    nowhere to go. It now lives in the topbar, where motion spec §2.3
			    already named it ("Sidebar collapse chevron (topbar)"), so the rail's
			    crown carries the identity in both states: the full lockup expanded,
			    the mark alone collapsed. The row keeps its 56/64 height either way,
			    so its rule stays aligned with the topbar's. */}
			<div
				className={cn(
					'flex h-14 items-center border-b border-rule px-4 md:h-16',
					!isSidebarOpen && !isMobile ? 'justify-center' : 'justify-between',
				)}
			>
				{!isSidebarOpen && !isMobile ? (
					<SunnsteelMark className="size-7 text-foreground" />
				) : (
					<SunnsteelLockup className="text-xl text-foreground" />
				)}
				{isMobile && (
					<Button
						ref={closeButtonRef}
						variant="ghost"
						size="icon"
						aria-label="Close navigation"
						className="size-11"
						onClick={() => setIsMobileMenuOpen(false)}
					>
						<X className="h-5 w-5" />
					</Button>
				)}
			</div>
			<ScrollArea className="flex-1 py-4">
				<nav
					className="relative grid gap-2 px-2"
					style={
						{
							'--nav-pitch': isMobile ? '3.25rem' : '2.75rem',
						} as CSSProperties
					}
				>
					{/* Motion spec §2.3: ONE marker, translated. Rows are a uniform
					    pitch (item height + the 8px grid gap), so the offset is exact
					    and needs no measurement. Hidden when the active route is not
					    in this list - Settings lives in the footer and keeps its own
					    mark. `aria-hidden`: the active item is already conveyed by
					    `aria-current` on the link. */}
					{activeIndex >= 0 && (
						<span
							aria-hidden
							className={cn(
								'pointer-events-none absolute left-2 z-10 w-[3px] bg-honour-strong',
								'transition-transform duration-[var(--motion-base)] ease-standard',
								isMobile ? 'h-11' : 'h-9',
							)}
							style={{
								transform: `translateY(calc(${activeIndex} * var(--nav-pitch)))`,
							}}
						/>
					)}
					{navItems.map(item => {
						const isCollapsed = !isSidebarOpen && !isMobile
						const showTooltip = isCollapsed
						const isActive = activeNav === item.id
						const indicator =
							item.id === 'notifications'
								? indicators.notifications
								: item.id === 'schedule'
									? indicators.schedule
									: null
						const ItemIcon =
							item.id === 'notifications' && indicator ? BellDot : item.icon
						const itemClassName = cn(
							// §11.10: active is a 3px honour mark plus ink text, never
							// a filled slab - that inversion was the heaviest object
							// on every screen. Hover and active differ by colour, not
							// geometry, so both carry the same 3px left border.
							'mark group relative w-full gap-3 rounded-none text-sm font-medium normal-case tracking-normal no-underline transition-colors duration-[var(--motion-fast)] ease-standard hover:no-underline',
							isMobile ? 'h-11' : 'h-9',
							isCollapsed ? 'justify-center' : 'justify-start',
							isActive
								? 'bg-surface font-semibold text-foreground'
								: 'text-ink-2 hover:bg-surface hover:text-foreground',
							item.disabled &&
								'cursor-not-allowed text-ink-3 hover:bg-transparent hover:text-ink-3',
						)
						const iconClassName = cn(
							'size-5 shrink-0 transition-colors',
							isActive
								? 'text-honour-strong'
								: 'text-ink-3 group-hover:text-foreground',
						)
						const icon = item.classicalName ? (
							<ClassicalIcon
								name={item.classicalName}
								aria-hidden
								className={iconClassName}
							/>
						) : (
							<ItemIcon className={iconClassName} aria-hidden />
						)
						const inner = (
							<>
								{/* Collapsed, the count belongs to the glyph: pinned to the
								    icon's top-right as a superscript. It used to be
								    `absolute right-1`, which parked it against the column's
								    right rule with nothing to attach it to - it read as a
								    stray character rather than as this item's count. The
								    exact number stays in the link's `aria-label`. */}
								{indicator && isCollapsed ? (
									<span className="relative flex shrink-0 items-center justify-center">
										{icon}
										<span
											aria-hidden
											className="type-data pointer-events-none absolute -right-3 -top-1.5 text-[11px] leading-none text-ink-2"
										>
											{indicator.compactText}
										</span>
									</span>
								) : (
									icon
								)}
								<span
									className={cn(
										'truncate',
										isCollapsed && 'w-0 overflow-hidden opacity-0',
									)}
								>
									{item.label}
								</span>
								{indicator && !isCollapsed && (
									<span
										aria-hidden
										className="type-data ml-auto shrink-0 text-ink-2"
									>
										{indicator.compactText}
									</span>
								)}
								{item.disabled && !isCollapsed && (
									<span className="type-label ml-auto shrink-0 text-[10px] text-ink-3">
										Soon
									</span>
								)}
							</>
						)

						// a11y review 2: an enabled item is ONE anchor (Button asChild ->
						// Link) with `aria-current` on the active one. It used to be a
						// real <button> nested inside the <a>, two tab stops for one
						// destination. Disabled items stay a button that explains itself
						// with a toast - same handler, now on the control rather than on a
						// wrapping div.
						const control = item.disabled ? (
							<Button
								type="button"
								variant="ghost"
								aria-disabled
								className={itemClassName}
								onClick={() => handleDisabledClick(item.label)}
							>
								{inner}
							</Button>
						) : (
							<Button asChild variant="ghost" className={itemClassName}>
								<Link
									href={item.href}
									aria-label={indicator?.accessibleLabel ?? item.label}
									aria-current={isActive ? 'page' : undefined}
									onClick={() => {
										// Set active nav immediately for consistent visual state
										setActiveNav(item.id)
										// Close mobile sidebar after navigation
										if (isMobile) {
											setIsMobileMenuOpen(false)
										}
										// Signal navigation start for global feedback
										onNavigateStart?.()
									}}
								>
									{inner}
								</Link>
							</Button>
						)

						return (
							<div key={item.id}>
								{showTooltip ? (
									<Tooltip>
										<TooltipTrigger asChild>{control}</TooltipTrigger>
										<TooltipContent side="right" sideOffset={8}>
											{item.label}
										</TooltipContent>
									</Tooltip>
								) : (
									control
								)}
							</div>
						)
					})}
					<Separator className="my-4" />
					<Button
						asChild
						variant="ghost"
						className={cn(
							'mark group w-full justify-start gap-3 rounded-none text-sm font-medium normal-case tracking-normal no-underline transition-colors duration-[var(--motion-fast)] ease-standard hover:no-underline',
							isMobile ? 'h-11' : 'h-9',
							!isSidebarOpen && !isMobile ? 'justify-center' : '',
							activeNav === 'settings'
								? 'mark-honour bg-surface font-semibold text-foreground'
								: 'text-ink-2 hover:bg-surface hover:text-foreground',
						)}
						onClick={() => {
							if (isMobile) {
								setIsMobileMenuOpen(false)
							}
						}}
					>
						<Link
							href="/settings"
							aria-current={activeNav === 'settings' ? 'page' : undefined}
							onClick={() => setActiveNav('settings')}
						>
							<Settings
								className={cn(
									'size-5 shrink-0 transition-colors',
									activeNav === 'settings'
										? 'text-honour-strong'
										: 'text-ink-3 group-hover:text-foreground',
								)}
							/>
							<span
								className={cn(
									'truncate',
									!isSidebarOpen &&
										!isMobile &&
										'w-0 overflow-hidden opacity-0',
								)}
							>
								Settings
							</span>
						</Link>
					</Button>
				</nav>
			</ScrollArea>
			<div className="border-t border-rule p-4">
				<Link
					href="/settings"
					onClick={() => {
						if (isMobile) {
							setIsMobileMenuOpen(false)
						}
					}}
				>
					<div
						className={cn(
							'flex cursor-pointer items-center gap-3 rounded-sm p-2 transition-colors duration-[var(--motion-fast)] ease-standard hover:bg-surface',
							!isSidebarOpen && !isMobile && 'justify-center',
						)}
					>
						<Avatar className="h-10 w-10 border border-rule">
							<AvatarImage
								src={user?.avatarUrl || ''}
								alt="User avatar"
								className="object-cover"
							/>
							<AvatarFallback>
								{user?.name
									?.split(' ')
									.map(n => n.charAt(0))
									.join('')
									.slice(0, 2)
									.toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div
							className={cn(
								'flex flex-col',
								!isSidebarOpen && !isMobile && 'opacity-0 w-0 overflow-hidden',
							)}
						>
							<span className="truncate text-sm font-medium text-foreground">
								{user?.name} {user?.lastName}
							</span>
							<span className="max-w-[10rem] truncate text-xs text-ink-3">
								{user?.username ? `@${user.username}` : ''}
							</span>
						</div>
					</div>
				</Link>
			</div>
		</div>
	)
}
