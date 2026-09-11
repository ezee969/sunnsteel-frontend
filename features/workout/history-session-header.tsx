'use client'

import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SessionMetrics } from '@/lib/utils/workout-metrics'

interface HistorySessionHeaderProps {
	title?: string
	metrics: SessionMetrics
	onBack: () => void
	showSummary?: boolean
}

/**
 * The history detail page's masthead (§11.11): the inscription with its one pair
 * of corner brackets over the page's one double rule. It was a Bebas `h1` through
 * the global element rule, with the summary in a boxed card below it (TD-31).
 */
export function HistorySessionHeader({
	title = 'Workout Session',
	metrics,
	onBack,
	showSummary = true,
}: HistorySessionHeaderProps) {
	return (
		<header className="rule-heading pb-4">
			<div className="flex items-start gap-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={onBack}
					aria-label="Back"
					className="-ml-2 size-11 shrink-0 rounded-sm p-2 text-ink-2 hover:bg-muted hover:text-foreground md:size-9"
				>
					<ArrowLeft className="h-4 w-4" aria-hidden />
				</Button>
				<div className="min-w-0 pt-1.5 md:pt-0.5">
					{/* Wraps rather than truncating (§11.11). */}
					<h1 className="type-page corner-brackets inline-block text-foreground">
						{title}
					</h1>
					<p className="type-body-sm mt-1 text-ink-3">
						{metrics.dayLabel} · {metrics.dateLabel}
					</p>
				</div>
			</div>

			{showSummary ? (
				<>
					{/* Captions above mono values, so the figures are the scannable
					    rank. Status is a mark plus its word — the colour never carries
					    it alone (§4.3 rule 8). An in-progress session has no outcome
					    yet, so its mark stays transparent, as in the archive list. Every
					    cell carries the (transparent) mark so all four share one left
					    axis when the grid wraps to two rows. */}
					<dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
						<div
							className={cn(
								'mark pl-3',
								metrics.statusLabel === 'COMPLETED' && 'mark-success',
								metrics.statusLabel === 'ABORTED' && 'mark-warning',
							)}
						>
							<dt className="type-body-sm text-ink-3">Status</dt>
							<dd className="type-label mt-0.5 text-foreground">
								{metrics.statusLabel}
							</dd>
						</div>
						<div className="mark pl-3">
							<dt className="type-body-sm text-ink-3">Duration</dt>
							<dd className="type-data mt-0.5 text-foreground">
								{metrics.durationLabel}
							</dd>
						</div>
						<div className="mark pl-3">
							<dt className="type-body-sm text-ink-3">Completed sets</dt>
							<dd className="type-data mt-0.5 text-foreground">
								{metrics.completedSets}
							</dd>
						</div>
						<div className="mark pl-3">
							<dt className="type-body-sm text-ink-3">Volume</dt>
							<dd className="type-data mt-0.5 text-foreground">
								{metrics.totalVolumeLabel}
							</dd>
						</div>
					</dl>

					{metrics.notes && (
						<p className="type-body-sm mt-4 max-w-[68ch] text-ink-2">
							{metrics.notes}
						</p>
					)}
				</>
			) : null}
		</header>
	)
}
