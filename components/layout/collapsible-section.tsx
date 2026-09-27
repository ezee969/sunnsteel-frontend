'use client'

import { ChevronDown } from 'lucide-react'
import { useId } from 'react'

import { useCollapsedState } from '@/hooks/use-collapsed-state'
import { cn } from '@/lib/utils'
import type { DefaultOpen } from '@/lib/utils/long-content'

interface CollapsibleSectionProps {
	/** Stable, page-scoped id (`progress-plateaus`); the stored choice keys by it. */
	id: string
	title: React.ReactNode
	icon?: React.ReactNode
	/**
	 * One line shown only while closed, stating what the section holds so a
	 * closed section still says something. It must not restate the screen's
	 * overall progress (§11.8).
	 */
	summary?: React.ReactNode
	/** A line under the heading shown only while open, such as a section's rule. */
	description?: React.ReactNode
	/** A control on the heading's row that stays usable while closed. */
	action?: React.ReactNode
	/** `'wide'`: closed below `md`, open from it, until the member chooses. */
	defaultOpen?: DefaultOpen
	headingLevel?: 'h2' | 'h3'
	/**
	 * `double` is a section's rule (`.rule-heading`); `single` is a group
	 * inside a section, which sits under one 1px rule instead.
	 */
	divider?: 'double' | 'single'
	/** One `type-*` rank; the heading's only typography (§5.3). */
	headingClassName?: string
	className?: string
	bodyClassName?: string
	children: React.ReactNode
}

/**
 * Design system §20.1: a section a member can close to its heading and a
 * summary. The heading stays a heading; its whole text is the toggle, so the
 * accessible name is the title and `aria-expanded` carries the state. The
 * body is hidden, not unmounted, and nothing animates its height.
 */
export function CollapsibleSection({
	id,
	title,
	icon,
	summary,
	description,
	action,
	defaultOpen = true,
	headingLevel = 'h2',
	divider = 'double',
	headingClassName = 'type-section',
	className,
	bodyClassName,
	children,
}: CollapsibleSectionProps) {
	const [open, setOpen] = useCollapsedState(id, defaultOpen)
	const uid = useId()
	const headingId = `${id}-heading`
	const bodyId = `${id}-body-${uid}`
	const Heading = headingLevel

	return (
		<section
			aria-labelledby={headingId}
			data-collapsible-section={id}
			data-state={open ? 'open' : 'closed'}
			className={className}
		>
			<div
				className={cn(
					'flex flex-wrap items-end justify-between gap-x-6 gap-y-2 pb-2',
					divider === 'double' ? 'rule-heading' : 'border-b border-rule',
				)}
			>
				<div className="min-w-0 flex-1">
					<Heading
						id={headingId}
						className={cn(headingClassName, 'text-foreground')}
					>
						<button
							type="button"
							aria-expanded={open}
							aria-controls={bodyId}
							onClick={() => setOpen(!open)}
							className="-mx-1 flex min-h-11 w-full items-center gap-2 rounded-sm px-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-h-9"
						>
							{icon}
							<span className="min-w-0">{title}</span>
							<ChevronDown
								aria-hidden
								className={cn(
									'ml-auto size-4 shrink-0 text-ink-3',
									open && 'rotate-180',
								)}
							/>
						</button>
					</Heading>
					{open
						? description
						: summary && (
								<p className="type-body-sm mt-1 text-ink-3">{summary}</p>
							)}
				</div>
				{action}
			</div>
			<div id={bodyId} hidden={!open} className={bodyClassName ?? 'pt-1'}>
				{children}
			</div>
		</section>
	)
}

interface CollapsibleHeadingProps {
	/** The heading's own id, which its section's `aria-labelledby` names. */
	id: string
	/** The id of the body it opens and closes. */
	controls: string
	open: boolean
	onToggle: () => void
	as?: 'h2' | 'h3'
	/** One `type-*` rank, plus colour or layout utilities (§5.3). */
	className?: string
	icon?: React.ReactNode
	children: React.ReactNode
}

/**
 * §20.1 for a section that keeps its own header row -- its description and
 * controls beside the heading, as every Progress section has. Drop it in for
 * the `h2`, pair it with `useCollapsedState` and hide the body with
 * `hidden={!open}`; `CollapsibleSection` is the same thing with the header
 * built for you.
 */
export function CollapsibleHeading({
	id,
	controls,
	open,
	onToggle,
	as: Heading = 'h2',
	className = 'type-section text-foreground',
	icon,
	children,
}: CollapsibleHeadingProps) {
	return (
		<Heading id={id} className={className}>
			<button
				type="button"
				aria-expanded={open}
				aria-controls={controls}
				onClick={onToggle}
				className="-mx-1 flex min-h-11 w-full items-center gap-2 rounded-sm px-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-h-9"
			>
				{icon}
				<span className="min-w-0">{children}</span>
				<ChevronDown
					aria-hidden
					className={cn(
						'ml-auto size-4 shrink-0 text-ink-3',
						open && 'rotate-180',
					)}
				/>
			</button>
		</Heading>
	)
}
