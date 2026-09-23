'use client'

import type {
	ActivityEntry,
	ActivityType,
	WeightUnit,
} from '@sunsteel/contracts'
import {
	BookOpen,
	Dumbbell,
	Flame,
	type LucideIcon,
	Medal,
	RotateCcw,
	TrendingUp,
	Trophy,
} from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ActivityComments } from '@/features/activity/activity-comments'
import { ActivityReactions } from '@/features/activity/activity-reactions'
import {
	activityHref,
	describeActivity,
	describeAuthor,
	groupActivity,
} from '@/lib/utils/activity'
import { formatTimeAgo } from '@/lib/utils/date'

// Icons stay ink: a feed can hold many records, and honour is capped at two
// marks per viewport (§4.3 rule 3), so none of them borrows it.
export const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
	SESSION_COMPLETED: Dumbbell,
	PERSONAL_RECORD: Trophy,
	PROGRESSION_CHANGED: TrendingUp,
	ACHIEVEMENT_UNLOCKED: Medal,
	STREAK_MILESTONE: Flame,
	COMEBACK: RotateCcw,
	ROUTINE_SHARED: BookOpen,
}

/**
 * One fact. Its title links only when the server returned a link, which it
 * does only where this viewer may open the record; otherwise the record is
 * named and not linked.
 */
export function ActivityFact({
	entry,
	weightUnit,
	canReact = false,
	discussion = true,
	children,
}: {
	entry: ActivityEntry
	weightUnit: WeightUnit
	/** SOC-05: false on your own activity, where there is nothing to acknowledge. */
	canReact?: boolean
	/**
	 * False on the dashboard preview (DASH-08), which names the fact and leaves
	 * reacting and commenting to the Activity page it links to.
	 */
	discussion?: boolean
	children?: ReactNode
}) {
	const Icon = ACTIVITY_ICONS[entry.type]
	const { title, detail } = describeActivity(entry, weightUnit)
	return (
		<div className="flex min-w-0 gap-3">
			<Icon className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
			<div className="min-w-0 flex-1">
				<p className="text-foreground">
					{entry.link ? (
						<Link
							href={activityHref(entry.link)}
							className="underline-offset-4 hover:underline"
						>
							{title}
						</Link>
					) : (
						title
					)}
				</p>
				{detail ? <p className="type-body-sm text-ink-3">{detail}</p> : null}
				{children}
				{discussion ? (
					<>
						<ActivityReactions
							entryId={entry.id}
							summary={entry.reactions}
							canReact={canReact}
						/>
						<ActivityComments entryId={entry.id} summary={entry.comments} />
					</>
				) : null}
			</div>
		</div>
	)
}

export function AuthorHeader({ entry }: { entry: ActivityEntry }) {
	const { author } = entry
	const name = describeAuthor(author)
	return (
		<div className="flex items-start justify-between gap-3">
			<Link
				href={`/profile/${encodeURIComponent(author.username)}`}
				className="group flex min-w-0 items-center gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
			>
				<Avatar className="size-8 shrink-0 border border-rule">
					<AvatarImage
						src={author.avatarUrl || ''}
						alt=""
						className="object-cover"
					/>
					<AvatarFallback className="type-data bg-surface-sunk text-ink-2">
						{author.name.charAt(0)}
						{author.lastName?.charAt(0)}
					</AvatarFallback>
				</Avatar>
				<span className="min-w-0">
					<span className="type-panel block truncate text-foreground underline-offset-4 group-hover:underline">
						{name}
					</span>
					<span className="type-body-sm block truncate text-ink-3">
						@{author.username}
					</span>
				</span>
			</Link>
			<time
				dateTime={entry.occurredAt}
				className="type-body-sm shrink-0 whitespace-nowrap text-ink-3"
			>
				{formatTimeAgo(entry.occurredAt)}
			</time>
		</div>
	)
}

/**
 * SOC-03. A ruled list (§11.5) with one row per workout or fact: a session
 * and the records it set share a row, under the member's name when the list
 * mixes members.
 */
export function ActivityEntryList({
	entries,
	weightUnit,
	showAuthor,
	label,
	ruled = true,
	canReact = false,
}: {
	entries: ActivityEntry[]
	weightUnit: WeightUnit
	/** False on one member's own list, where the name would repeat on every row. */
	showAuthor: boolean
	label: string
	/** False under a heading that already draws its rule. */
	ruled?: boolean
	/** SOC-05: whether these entries may be reacted to (never your own). */
	canReact?: boolean
}) {
	const groups = groupActivity(entries)
	return (
		<ul
			aria-label={label}
			className={ruled ? 'border-t border-rule-faint' : undefined}
		>
			{groups.map(group => (
				<li key={group.key} className="rule-row space-y-3 py-4">
					{showAuthor ? (
						<AuthorHeader entry={group.entries[0]} />
					) : (
						<time
							dateTime={group.entries[0].occurredAt}
							className="type-body-sm block text-ink-3"
						>
							{formatTimeAgo(group.entries[0].occurredAt)}
						</time>
					)}
					<ul className="space-y-3">
						{group.entries.map(entry => (
							<li key={entry.id}>
								<ActivityFact
									entry={entry}
									weightUnit={weightUnit}
									canReact={canReact}
								/>
							</li>
						))}
					</ul>
				</li>
			))}
		</ul>
	)
}
