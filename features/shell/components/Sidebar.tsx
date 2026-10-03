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
import { useTranslations } from 'next-intl'
import { type CSSProperties, useEffect, useRef } from 'react'

import { useTodaysWorkouts } from '@/app/[locale]/(protected)/dashboard/hooks/useTodaysWorkouts'
import {
	SunnsteelLockup,
	SunnsteelMark,
} from '@/components/brand/sunnsteel-lockup'
import {
	ClassicalIcon,
	ClassicalIconName,
} from '@/components/icons/ClassicalIcon'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/toast'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { useNotifications } from '@/lib/api/hooks/useNotifications'
import { useUser } from '@/lib/api/hooks/useUser'
import { cn } from '@/lib/utils'
import { orderByGroup } from '@/lib/utils/nav-groups'
import { buildNavigationIndicators } from '@/lib/utils/navigation-indicators'

type NavLabelKey =
	| 'dashboard'
	| 'workouts'
	| 'routines'
	| 'discover'
	| 'history'
	| 'progress'
	| 'exercises'
	| 'schedule'
	| 'achievements'
	| 'activity'
	| 'notifications'
	| 'moderation'

type NavItemBase = {
	id: string
	/** I18N-01: a key under `shell.nav`, never the English label itself. */
	labelKey: NavLabelKey
	icon: LucideIcon
	classicalName?: ClassicalIconName
}

type NavItem = NavItemBase &
	({ disabled: true; href?: never } | { disabled: false; href: string })

const SIDEBAR_NAV_ITEMS: NavItem[] = [
	{
		id: 'dashboard',
		labelKey: 'dashboard',
		icon: Home,
		classicalName: 'pillar-icon',
		href: '/dashboard',
		disabled: false,
	},
	{
		id: 'workouts',
		labelKey: 'workouts',
		icon: Dumbbell,
		classicalName: 'dumbbell',
		href: '/workouts',
		disabled: false,
	},
	{
		id: 'routines',
		labelKey: 'routines',
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
		labelKey: 'discover',
		icon: Compass,
		href: '/routines/discover',
		disabled: false,
	},
	// History needs its own entry: `/workouts` redirects into the live session
	// whenever one is running, so the "View History" link on that page is
	// unreachable for exactly as long as the user has something to review.
	{
		id: 'history',
		labelKey: 'history',
		icon: History,
		href: '/workouts/history',
		disabled: false,
	},
	{
		id: 'progress',
		labelKey: 'progress',
		icon: TrendingUp,
		classicalName: 'compass',
		href: '/progress',
		disabled: false,
	},
	{
		id: 'exercises',
		labelKey: 'exercises',
		icon: Weight,
		classicalName: 'two-dumbbells',
		href: '/exercises',
		disabled: false,
	},
	{
		id: 'schedule',
		labelKey: 'schedule',
		icon: Calendar,
		classicalName: 'hourglass',
		href: '/schedule',
		disabled: false,
	},
	{
		id: 'achievements',
		labelKey: 'achievements',
		icon: Medal,
		classicalName: 'laurel-crown',
		href: '/achievements',
		disabled: false,
	},
	// SOC-03: what the members you follow did, and who sees what you did. It is
	// not Notifications, which is about you; this is about the people you follow.
	{
		id: 'activity',
		labelKey: 'activity',
		icon: Rss,
		href: '/activity',
		disabled: false,
	},
	{
		id: 'notifications',
		labelKey: 'notifications',
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
	labelKey: 'moderation',
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
	const t = useTranslations('shell.nav')
	const tIndicators = useTranslations('shell.indicators')
	// The active marker is positioned from this list's own index, so the
	// moderation row has to be part of the list the rows render from rather
	// than spliced in afterwards.
	// UX-22 (§23.8): in the bottom bar's four groups, each after its heading.
	const rows = orderByGroup(
		user?.isModerator
			? [...SIDEBAR_NAV_ITEMS, MODERATION_NAV_ITEM]
			: SIDEBAR_NAV_ITEMS,
	)
	const navItems = rows.map(row => row.item)
	const tGroups = useTranslations('shell.nav.groups')
	const indicators = buildNavigationIndicators(
		{
			unreadNotifications: notifications.data?.unreadCount,
			plannedToday: today.entries.length,
			hasActiveSession: today.active?.status === 'IN_PROGRESS',
		},
		tIndicators,
	)

	// -1 when the active route is not in this list (Settings), which hides the
	// marker rather than parking it on the wrong row.
	const activeIndex = navItems.findIndex(item => item.id === activeNav)
	// Every group but the first opens with a heading row of its own height, so
	// the marker counts the headings above the active row as well.
	const headingsAbove =
		activeIndex < 0
			? 0
			: rows
					.slice(0, activeIndex + 1)
					.filter(row => row.firstInGroup && row.group !== 'today').length

	const handleDisabledClick = (label: string) => {
		push({
			title: t('comingSoonTitle', { label }),
			description: t('comingSoonBody'),
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

	// Desktop collapse animates on `transform` too, since `width` is on the
	// never-animate list (motion spec 1.2). The rail always occupies the open
	// w-64 box and slides 11rem (w-64 - w-20) off the left edge, while its
	// content slides the same 11rem back the other way with the same timing.
	// The content holds still and the moving edge clips it. Both elements
	// must share this timing, or the content drifts mid-slide.
	const railMotion = cn(
		'transition-transform motion-reduce:transition-none',
		isSidebarOpen
			? 'duration-[var(--motion-slow)] ease-standard'
			: 'duration-[var(--motion-base)] ease-exit',
	)

	return (
		<div
			inert={isMobile && !isMobileMenuOpen}
			className={cn(
				// v1.0 §11.10: an index column, not a panel. Ground-coloured with a
				// single rule on its right edge - no marble wash, no gold hex border,
				// no blur, no shadow. Elevation in this system is tonal (§8).
				'fixed inset-y-0 left-0 z-50 overflow-hidden border-r border-rule bg-background',
				// Motion spec 2.3: the drawer slides on `transform`. `left` and
				// `width` are on the never-animate list (1.2), so the drawer always
				// occupies its open box and is pushed off-screen by a translate -
				// `-left-full` could not be animated at all.
				isMobile
					? cn(
							'w-[85%] max-w-[300px] transition-transform',
							isMobileMenuOpen
								? 'translate-x-0 duration-[var(--motion-slow)] ease-standard'
								: '-translate-x-full duration-[var(--motion-base)] ease-exit',
						)
					: cn('w-64', railMotion, !isSidebarOpen && '-translate-x-44'),
			)}
		>
			<div
				className={cn(
					'flex h-full flex-col',
					isMobile
						? 'w-full'
						: cn(railMotion, isSidebarOpen ? 'w-full' : 'w-20 translate-x-44'),
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
							aria-label={t('closeNavigation')}
							className="size-11"
							onClick={() => setIsMobileMenuOpen(false)}
						>
							<X className="h-5 w-5" />
						</Button>
					)}
				</div>
				{/* One navigation landmark holds the scrolling list and the pinned
			    Settings below it. */}
				<nav className="flex min-h-0 flex-1 flex-col">
					<ScrollArea className="min-h-0 flex-1 py-4">
						<div
							className={cn('relative grid px-2', isMobile ? 'gap-1' : 'gap-2')}
							style={
								{
									// The drawer's rows sit 4px apart rather than 8 and its
									// headings are h-6, so the group headings (UX-22) still
									// leave Settings on screen without scrolling.
									'--nav-pitch': isMobile ? '3rem' : '2.75rem',
									// A heading row is its height plus the grid's gap.
									'--nav-heading-pitch': isMobile ? '1.75rem' : '2.25rem',
								} as CSSProperties
							}
						>
							{/* Motion spec §2.3: ONE marker, translated. Rows are a uniform
					    pitch (item height + the grid gap), so the offset is exact
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
										transform: `translateY(calc(${activeIndex} * var(--nav-pitch) + ${headingsAbove} * var(--nav-heading-pitch)))`,
									}}
								/>
							)}
							{rows.map(({ item, group, firstInGroup }) => {
								const label = t(item.labelKey)
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
											{label}
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
												{t('soon')}
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
										onClick={() => handleDisabledClick(label)}
									>
										{inner}
									</Button>
								) : (
									<Button asChild variant="ghost" className={itemClassName}>
										<Link
											href={item.href}
											aria-label={indicator?.accessibleLabel ?? label}
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

								const heading =
									firstInGroup && group !== 'today' ? (
										isCollapsed ? (
											<div
												key={`${group}-heading`}
												aria-hidden
												className="flex h-7 items-end justify-center pb-1"
											>
												<span className="h-px w-6 bg-rule" />
											</div>
										) : (
											<p
												key={`${group}-heading`}
												className={cn(
													'type-label flex items-end px-3 pb-1 text-ink-3',
													isMobile ? 'h-6' : 'h-7',
												)}
											>
												{tGroups(group)}
											</p>
										)
									) : null

								return [
									heading,
									<div key={item.id}>
										{showTooltip ? (
											<Tooltip>
												<TooltipTrigger asChild>{control}</TooltipTrigger>
												<TooltipContent side="right" sideOffset={8}>
													{label}
												</TooltipContent>
											</Tooltip>
										) : (
											control
										)}
									</div>,
								]
							})}
						</div>
					</ScrollArea>
					{/* Settings is pinned under the list rather than at its end, so a
			    short window (a small notebook, a phone in landscape) scrolls the
			    pages and never pushes Settings out of reach. The profile row that
			    sat here went: it linked to Settings too, and the header avatar
			    already opens the profile menu. */}
					<div className="border-t border-rule px-2 py-2">
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
									{t('settings')}
								</span>
							</Link>
						</Button>
					</div>
				</nav>
			</div>
		</div>
	)
}
