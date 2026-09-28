import { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface ActivityItemProps {
	icon: ReactNode
	title: string
	time: string
	badges?: Array<string>
	showSeparator?: boolean
}

/**
 * One ruled row of the recent-activity ledger.
 *
 * v1.0 §11.5 makes `ruled` the default for a list, and §11.12 says read-only
 * data carries no border and no fill — so the three metric badges are now one
 * Space Mono run separated by middots, which is also what §10 asks a ledger row
 * to collapse to below 640. That removes the wrap problem the badges had at
 * 320px rather than working around it.
 *
 * The gradient medallion is gone (§4.3 rule 6): the glyph sits inline in
 * `--ink-3`. `showSeparator` keeps its meaning and now draws the row rule
 * itself, so the list needs no `Separator` elements between children.
 */
export default function ActivityItem({
	icon,
	title,
	time,
	badges = [],
	showSeparator = true,
}: ActivityItemProps) {
	return (
		<div
			className={cn(
				'flex items-start gap-3 py-3',
				showSeparator && 'border-b border-rule-faint',
			)}
		>
			<span className="mt-0.5 shrink-0 text-ink-3" aria-hidden>
				{icon}
			</span>
			<div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:justify-between sm:gap-4">
				<div className="min-w-0">
					<p className="type-panel text-foreground">{title}</p>
					<p className="type-body-sm text-ink-3">{time}</p>
				</div>
				{badges.length > 0 && (
					<p className="type-data mt-1 text-ink-3 sm:mt-0 sm:shrink-0 sm:text-right">
						{badges.join(' · ')}
					</p>
				)}
			</div>
		</div>
	)
}
