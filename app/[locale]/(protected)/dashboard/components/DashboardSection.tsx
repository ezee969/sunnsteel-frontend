'use client'

import type { DashboardSectionId } from '@sunsteel/contracts'
import { useTranslations } from 'next-intl'

import { CollapsibleHeading } from '@/components/layout/collapsible-section'
import { useCollapsedState } from '@/hooks/use-collapsed-state'
import { cn } from '@/lib/utils'
import { dashboardSectionLabel } from '@/lib/utils/dashboard-layout'

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
	/**
	 * UX-02: the section can close to its heading, closed below `md` until
	 * the member opens it. The choice is per device, keyed by the permanent
	 * id (`ss-open:dashboard-<id>`), and is separate from DASH-05's hidden,
	 * which is per account and removes the section altogether.
	 */
	collapsible?: boolean
	/** The one line a closed section keeps (design system §20.1). */
	summary?: React.ReactNode
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
	collapsible = false,
	summary,
	bodyClassName,
	children,
}: DashboardSectionProps) {
	const headingId = dashboardSectionHeadingId(id)
	const t = useTranslations('planning.dashboardLayout')
	const title = dashboardSectionLabel(id, t)
	const [storedOpen, setOpen] = useCollapsedState(`dashboard-${id}`, 'wide')
	const open = !collapsible || storedOpen
	const bodyId = `dashboard-${id}-body`

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

	const headingClassName = cn(
		'type-section flex items-center gap-2 text-foreground',
		!description && !action && 'rule-heading pb-2',
	)
	const heading = collapsible ? (
		<CollapsibleHeading
			id={headingId}
			controls={bodyId}
			open={open}
			onToggle={() => setOpen(!open)}
			icon={icon}
			className={headingClassName}
		>
			{title}
		</CollapsibleHeading>
	) : (
		<h2 id={headingId} className={headingClassName}>
			{icon}
			{title}
		</h2>
	)
	const closedSummary =
		!open && summary ? (
			<p className="type-body-sm pt-2 text-ink-3">{summary}</p>
		) : null

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
			{closedSummary}
			<div id={bodyId} hidden={!open} className={bodyClassName ?? 'pt-1'}>
				{children}
			</div>
		</section>
	)
}
