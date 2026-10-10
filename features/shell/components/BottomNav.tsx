'use client'

import { type LucideIcon, MoreHorizontal, Users } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { useTodaysWorkouts } from '@/app/[locale]/(protected)/dashboard/hooks/useTodaysWorkouts'
import {
	ClassicalIcon,
	type ClassicalIconName,
} from '@/components/icons/ClassicalIcon'
import { useUnreadConversations } from '@/lib/api/hooks/useConversations'
import { useNotifications } from '@/lib/api/hooks/useNotifications'
import { cn } from '@/lib/utils'
import {
	NAV_GROUP_HREF,
	type NavGroupId,
	navGroupOf,
} from '@/lib/utils/nav-groups'
import { communityIndicator } from '@/lib/utils/navigation-indicators'

interface BottomNavProps {
	activeNav: string
	isMoreOpen: boolean
	onOpenMore: () => void
	onNavigateStart?: () => void
}

// UX-25: one icon family per destination. A group that is a sidebar
// destination takes the sidebar's classical glyph (Dashboard's pillar,
// Workouts' dumbbell, Progress's compass); the others have no classical
// counterpart and stay lucide.
const ICONS: Record<NavGroupId, ClassicalIconName | LucideIcon> = {
	today: 'pillar-icon',
	train: 'dumbbell',
	progress: 'compass',
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
	const unreadConversations = useUnreadConversations()
	// MSG-03: Community carries unread notifications and conversations both.
	const community = communityIndicator(
		notifications.data?.unreadCount,
		unreadConversations.data,
		t,
	)
	const planned =
		today.active?.status === 'IN_PROGRESS' ? 0 : today.entries.length

	const count = (group: NavGroupId) =>
		group === 'train'
			? planned
			: group === 'community'
				? (community?.count ?? 0)
				: 0

	// v1.1 §26.6 / motion §8: the active group's 2px rule is ONE element that
	// slides between the five equal slots, as the sidebar's marker does,
	// rather than a border on each item that blinked from one to the next.
	const groups = [...LINK_GROUPS, 'more'] as const
	const activeIndex = groups.indexOf(activeGroup as (typeof groups)[number])

	const itemClass = (active: boolean) =>
		cn(
			'relative flex min-h-14 flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 border-t-2 border-transparent px-1 text-xs font-medium outline-none transition-colors duration-[var(--motion-fast)] ease-standard focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
			active ? 'text-foreground' : 'text-ink-3 hover:text-foreground',
		)

	const glyph = (group: NavGroupId, active: boolean) => {
		const Icon = ICONS[group]
		const n = count(group)
		return (
			<span className="relative flex">
				{typeof Icon === 'string' ? (
					<ClassicalIcon
						name={Icon}
						aria-hidden
						className={cn('size-5', active ? 'text-honour-strong' : '')}
					/>
				) : (
					<Icon
						aria-hidden
						className={cn('size-5', active ? 'text-honour-strong' : '')}
					/>
				)}
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
			className="relative flex shrink-0 border-t border-rule bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
		>
			{activeIndex >= 0 ? (
				<span
					aria-hidden
					className="pointer-events-none absolute left-0 top-0 h-0.5 w-1/5 bg-honour-strong transition-transform duration-[var(--motion-base)] ease-standard"
					style={{ transform: `translateX(${activeIndex * 100}%)` }}
				/>
			) : null}
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
									: (community?.label ?? label)
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
