'use client'

import {
	Dumbbell,
	Home,
	type LucideIcon,
	MoreHorizontal,
	TrendingUp,
	Users,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { useTodaysWorkouts } from '@/app/[locale]/(protected)/dashboard/hooks/useTodaysWorkouts'
import { useNotifications } from '@/lib/api/hooks/useNotifications'
import { cn } from '@/lib/utils'
import {
	NAV_GROUP_HREF,
	type NavGroupId,
	navGroupOf,
} from '@/lib/utils/nav-groups'

interface BottomNavProps {
	activeNav: string
	isMoreOpen: boolean
	onOpenMore: () => void
	onNavigateStart?: () => void
}

const ICONS: Record<NavGroupId, LucideIcon> = {
	today: Home,
	train: Dumbbell,
	progress: TrendingUp,
	community: Users,
	more: MoreHorizontal,
}

const LINK_GROUPS = ['today', 'train', 'progress', 'community'] as const

/**
 * UX-22 (design system §23.8): the phone's main navigation, below `md`. Four
 * groups and More, which opens the drawer that still lists every page. It is
 * the last row of the shell's column rather than a layer over the page, so it
 * never covers content, and it carries the device's bottom safe area. The
 * active group is ink over a 2px honour rule; a count sits on its glyph, the
 * exact number in the link's name.
 */
export function BottomNav({
	activeNav,
	isMoreOpen,
	onOpenMore,
	onNavigateStart,
}: BottomNavProps) {
	const t = useTranslations('shell.bottomNav')
	const notifications = useNotifications()
	const today = useTodaysWorkouts()
	const activeGroup = navGroupOf(activeNav)
	const unread = Math.max(0, notifications.data?.unreadCount ?? 0)
	const planned =
		today.active?.status === 'IN_PROGRESS' ? 0 : today.entries.length

	const count = (group: NavGroupId) =>
		group === 'train' ? planned : group === 'community' ? unread : 0

	const itemClass = (active: boolean) =>
		cn(
			'relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 border-t-2 px-1 text-xs font-medium outline-none transition-colors duration-[var(--motion-fast)] ease-standard focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
			active
				? 'border-honour-strong text-foreground'
				: 'border-transparent text-ink-3 hover:text-foreground',
		)

	const glyph = (group: NavGroupId, active: boolean) => {
		const Icon = ICONS[group]
		const n = count(group)
		return (
			<span className="relative flex">
				<Icon
					aria-hidden
					className={cn('size-5', active ? 'text-honour-strong' : '')}
				/>
				{n > 0 ? (
					<span
						aria-hidden
						className="type-data pointer-events-none absolute -right-3 -top-1.5 text-[11px] leading-none text-ink-2"
					>
						{n > 9 ? '9+' : n}
					</span>
				) : null}
			</span>
		)
	}

	return (
		<nav
			aria-label={t('label')}
			className="flex shrink-0 border-t border-rule bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
		>
			{LINK_GROUPS.map(group => {
				const active = activeGroup === group
				const n = count(group)
				const label = t(group)
				return (
					<Link
						key={group}
						href={NAV_GROUP_HREF[group]}
						aria-current={active ? 'true' : undefined}
						aria-label={
							n > 0
								? group === 'train'
									? t('trainPlanned', { count: n })
									: t('communityUnread', { count: n })
								: label
						}
						onClick={() => onNavigateStart?.()}
						className={itemClass(active)}
					>
						{glyph(group, active)}
						<span className="truncate">{label}</span>
					</Link>
				)
			})}
			<button
				type="button"
				aria-label={t('moreAria')}
				aria-expanded={isMoreOpen}
				onClick={onOpenMore}
				className={itemClass(activeGroup === 'more')}
			>
				{glyph('more', activeGroup === 'more')}
				<span className="truncate">{t('more')}</span>
			</button>
		</nav>
	)
}
