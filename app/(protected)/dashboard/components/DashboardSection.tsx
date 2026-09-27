'use client'

import type { DashboardSectionId } from '@sunsteel/contracts'

import { cn } from '@/lib/utils'
import { DASHBOARD_SECTION_LABELS } from '@/lib/utils/dashboard-layout'

export const dashboardSectionHeadingId = (id: DashboardSectionId) =>
	`dashboard-${id}-heading`

interface DashboardSectionProps {
	/** The permanent contract id; also what any per-device state keys by. */
	id: DashboardSectionId
	icon?: React.ReactNode
	/** One line under the heading, such as This Week's totals. */
	description?: React.ReactNode
	/** A control on the heading's row, such as This Week's schedule link. */
	action?: React.ReactNode
	/**
	 * The heading exists for assistive technology only. Training Stats is a
	 * ruled band with no visible heading, and adding one would change the
	 * dashboard's look for no reader.
	 */
	headingHidden?: boolean
	bodyClassName?: string
	children: React.ReactNode
}

/**
 * DASH-05: every configurable dashboard section renders through this one
 * shell, which owns its `section`, its `h2` (`type-section`, over a rule) and
 * its body. Adding behaviour every section shares -- UX-02's collapse --
 * belongs here, not in the seven sections.
 */
export function DashboardSection({
	id,
	icon,
	description,
	action,
	headingHidden = false,
	bodyClassName,
	children,
}: DashboardSectionProps) {
	const headingId = dashboardSectionHeadingId(id)
	const title = DASHBOARD_SECTION_LABELS[id]

	if (headingHidden) {
		return (
			<section aria-labelledby={headingId} data-dashboard-section={id}>
				<h2 id={headingId} className="sr-only">
					{title}
				</h2>
				<div className={bodyClassName}>{children}</div>
			</section>
		)
	}

	const heading = (
		<h2
			id={headingId}
			className={cn(
				'type-section flex items-center gap-2 text-foreground',
				!description && !action && 'rule-heading pb-2',
			)}
		>
			{icon}
			{title}
		</h2>
	)

	return (
		<section aria-labelledby={headingId} data-dashboard-section={id}>
			{description || action ? (
				<div className="rule-heading flex flex-wrap items-end justify-between gap-x-6 gap-y-2 pb-2">
					<div>
						{heading}
						{description}
					</div>
					{action}
				</div>
			) : (
				heading
			)}
			<div className={bodyClassName ?? 'pt-1'}>{children}</div>
		</section>
	)
}
