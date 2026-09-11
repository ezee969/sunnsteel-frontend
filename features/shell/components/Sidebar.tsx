'use client'

import {
	Activity,
	Calendar,
	ChevronLeft,
	ChevronRight,
	Dumbbell,
	History,
	Home,
	LucideIcon,
	Medal,
	Settings,
	TrendingUp,
	Weight,
	X,
} from 'lucide-react'
import Link from 'next/link'
import type { CSSProperties } from 'react'

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
import { useUser } from '@/lib/api/hooks/useUser'
import { cn } from '@/lib/utils'

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
		disabled: true,
	},
	{
		id: 'schedule',
		label: 'Schedule',
		icon: Calendar,
		classicalName: 'hourglass',
		disabled: true,
	},
	{
		id: 'achievements',
		label: 'Achievements',
		icon: Medal,
		classicalName: 'laurel-crown',
		disabled: true,
	},
] satisfies NavItem[]

interface SidebarProps {
	isMobile: boolean
	isSidebarOpen: boolean
	isMobileMenuOpen: boolean
	activeNav: string
	setActiveNav: (navItem: string) => void
	setIsSidebarOpen: (isOpen: boolean) => void
	setIsMobileMenuOpen: (isOpen: boolean) => void
	onNavigateStart?: () => void
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
	const { user } = useUser()
	const { push } = useToast()

	// -1 when the active route is not in this list (Settings), which hides the
	// marker rather than parking it on the wrong row.
	const activeIndex = SIDEBAR_NAV_ITEMS.findIndex(item => item.id === activeNav)

	const handleDisabledClick = (label: string) => {
		push({
			title: `${label} - Coming Soon`,
			description:
				'We are working hard on bringing this feature to Sunnsteel. Stay tuned!',
		})
	}

	const toggleSidebar = () => {
		setIsSidebarOpen(!isSidebarOpen)
	}

	// Route prefetching is handled by next/link, which prefetches these nav
	// targets automatically (they are all statically prerendered).

	return (
		<div
			className={cn(
				// v1.0 §11.10: an index column, not a panel. Ground-coloured with a
				// single rule on its right edge - no marble wash, no gold hex border,
				// no blur, no shadow. Elevation in this system is tonal (§8).
				'fixed inset-y-0 z-50 flex flex-col border-r border-rule bg-background',
				isMobile
					? isMobileMenuOpen
						? 'left-0 w-[85%] max-w-[300px]'
						: '-left-full'
					: isSidebarOpen
						? 'left-0 w-64'
						: 'left-0 w-20',
			)}
		>
			<div className="flex h-14 items-center justify-between border-b border-rule px-4 md:h-16">
				<div
					className={cn(
						'flex items-center gap-2 font-semibold',
						!isSidebarOpen && !isMobile && 'opacity-0 w-0 overflow-hidden',
					)}
				>
					<span className="type-wordmark text-xl text-foreground">
						SUNNSTEEL
					</span>
				</div>
				{isSidebarOpen && isMobile && (
					<Button
						variant="ghost"
						size="icon"
						aria-label="Close navigation"
						className="size-11"
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
						aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
						className={cn(!isSidebarOpen && 'ml-auto')}
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
					{SIDEBAR_NAV_ITEMS.map(item => {
						const showTooltip = !isSidebarOpen && !isMobile
						const isActive = activeNav === item.id
						const itemClassName = cn(
							// §11.10: active is a 3px honour mark plus ink text, never
							// a filled slab - that inversion was the heaviest object
							// on every screen. Hover and active differ by colour, not
							// geometry, so both carry the same 3px left border.
							'mark group w-full gap-3 rounded-none text-sm font-medium normal-case tracking-normal no-underline transition-colors duration-[var(--motion-fast)] ease-standard hover:no-underline',
							isMobile ? 'h-11' : 'h-9',
							isSidebarOpen || isMobile ? 'justify-start' : 'justify-center',
							isActive
								? 'bg-surface font-semibold text-foreground'
								: 'text-ink-2 hover:bg-surface hover:text-foreground',
							item.disabled &&
								'cursor-not-allowed text-ink-3 hover:bg-transparent hover:text-ink-3',
						)
						const iconClassName = cn(
							'h-5 w-5 shrink-0 transition-colors',
							isActive
								? 'text-honour-strong'
								: 'text-ink-3 group-hover:text-foreground',
						)
						const inner = (
							<>
								{item.classicalName ? (
									<ClassicalIcon
										name={item.classicalName}
										aria-hidden
										className={iconClassName}
									/>
								) : (
									<item.icon className={iconClassName} aria-hidden />
								)}
								<span
									className={cn(
										'truncate',
										!isSidebarOpen &&
											!isMobile &&
											'w-0 overflow-hidden opacity-0',
									)}
								>
									{item.label}
								</span>
								{item.disabled && (isSidebarOpen || isMobile) && (
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
									'h-5 w-5 shrink-0 transition-colors',
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
				<Link href="/settings">
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
