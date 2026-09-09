import { ReactNode } from 'react'

import { Progress } from '@/components/ui/progress'

interface StatCardProps {
	icon: ReactNode
	title: string
	value: string
	unit?: string
	subtitle?: string
	progress?: number
	progressMax?: number
	progressText?: string
	additionalText?: string
}

/**
 * One cell of the dashboard's ruled stat band.
 *
 * v1.0 §4.3 rule 3 caps honour at two marks per viewport and reserves it for
 * "better than planned". This tile used to carry a gold header pill and a gold
 * progress bar, so six ordinary numbers were marked as achievements — the
 * clearest remaining QA 4 violation. A milestone bar is progress, not honour,
 * so the bar is a hairline in `--ink-2` on a `--surface-sunk` track and nothing
 * on this row is gold.
 *
 * The card box is gone with it: §11.5 makes `ruled` the default and §10.1 turns
 * the stat row into one ruled band. The cell paints its own ground so the 1px
 * grid lines come from the container's gap.
 */
export default function StatCard({
	icon,
	title,
	value,
	unit,
	subtitle,
	progress,
	progressMax = 100,
	progressText,
	additionalText,
}: StatCardProps) {
	return (
		<div className="flex min-w-0 flex-col gap-2 bg-background px-3 py-4 sm:px-4 sm:py-5">
			<div className="flex min-w-0 items-center gap-2 text-ink-3">
				{icon}
				<span className="type-label truncate">{title}</span>
			</div>

			{/* Wraps: the unit drops below the value rather than pushing it past
			    the cell when a figure runs long. */}
			<div className="flex flex-wrap items-baseline gap-x-1.5">
				<span className="type-numeral text-foreground">{value}</span>
				{unit && <span className="type-data text-ink-3">{unit}</span>}
			</div>

			{subtitle && (
				<p className="type-body-sm hidden text-ink-3 sm:block">{subtitle}</p>
			)}

			{progress !== undefined && (
				<div className="mt-auto flex flex-col gap-1 pt-1">
					{/* The Radix primitive stays: it carries the progressbar role and
					    value, which a plain div would drop. */}
					{/* The track is `--rule-faint`, not the primitive's `--surface-sunk`:
					    a sunken well is nearly invisible against `--background`, which
					    is the ground this cell paints, so a full bar read as a rule. */}
					<Progress
						value={progress}
						max={progressMax}
						className="h-1 bg-rule-faint [&_[data-slot=progress-indicator]]:bg-ink-2"
					/>
					<div className="flex flex-wrap items-baseline justify-between gap-x-2">
						<span className="type-body-sm text-ink-3">{progressText}</span>
						{additionalText && (
							<span className="type-body-sm text-ink-3">{additionalText}</span>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
