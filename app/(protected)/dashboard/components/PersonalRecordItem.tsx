import { cn } from '@/lib/utils'

interface PersonalRecordItemProps {
	exercise: string
	timeAgo: string
	weight: string
	showSeparator?: boolean
}

/**
 * One ruled row of the personal-records ledger.
 *
 * The record itself is the point of the row, so the figure is emphatic Space
 * Mono rather than a badge (§11.12: read-only data has no border and no fill).
 *
 * No honour mark: §4.3 rule 3 allows at most two per viewport, and a list of
 * five records would spend them all on a section whose heading already says
 * these are records.
 */
export default function PersonalRecordItem({
	exercise,
	timeAgo,
	weight,
	showSeparator = true,
}: PersonalRecordItemProps) {
	return (
		<div
			className={cn(
				'flex items-baseline justify-between gap-4 py-3',
				showSeparator && 'border-b border-rule-faint',
			)}
		>
			<div className="min-w-0">
				<p className="type-panel text-foreground">{exercise}</p>
				<p className="type-body-sm text-ink-3">{timeAgo}</p>
			</div>
			<span className="type-data type-data-strong shrink-0 text-foreground">
				{weight}
			</span>
		</div>
	)
}
