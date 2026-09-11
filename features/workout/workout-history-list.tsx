import { useRouter } from 'next/navigation'
import type { Ref } from 'react'

import { Button } from '@/components/ui/button'
import type { WorkoutSessionSummary } from '@/lib/api/types/workout.type'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/utils/time-format.utils'

const getErrorMessage = (err: unknown): string => {
	if (err instanceof Error) return err.message
	if (typeof err === 'string') return err
	if (err && typeof err === 'object' && 'message' in err) {
		const m = (err as { message?: unknown }).message
		if (typeof m === 'string') return m
	}
	return 'Failed to load sessions'
}

export interface WorkoutHistoryListProps {
	data: {
		items: WorkoutSessionSummary[]
		isLoading: boolean
		isError: boolean
		error: unknown
	}
	pagination: {
		hasNextPage: boolean
		isFetchingNextPage: boolean
		fetchNextPage: () => void
		sentinelRef: Ref<HTMLDivElement>
	}
}

export function WorkoutHistoryList({
	data: { items, isLoading, isError, error },
	pagination: { hasNextPage, isFetchingNextPage, fetchNextPage, sentinelRef },
}: WorkoutHistoryListProps) {
	const router = useRouter()

	if (isLoading) {
		return (
			<div className="type-body-sm flex h-40 items-center justify-center text-ink-3">
				Loading sessions…
			</div>
		)
	}

	if (isError) {
		return (
			<div
				className="type-body-sm text-destructive"
				role="alert"
				aria-live="polite"
			>
				{getErrorMessage(error)}
			</div>
		)
	}

	if (items.length === 0) {
		return (
			<div className="type-body-sm py-6 text-ink-3">
				No sessions found with the current filters.
			</div>
		)
	}

	return (
		// §11.5 — history is the archetypal ruled list: no fill, no box, a rule
		// between rows. Each row was a bordered card inside a card inside a card.
		<div className="border-t border-rule">
			{items.map(s => (
				<div
					key={s.id}
					// §11.12 — status is a mark, and the status word beside it is what
					// carries the meaning (§4.3 rule 8). A finished session is "done,
					// as planned"; an aborted one is the row worth noticing.
					//
					// `IN_PROGRESS` is deliberately unmarked, not overlooked. All three
					// mark colours describe an outcome — `--success` is completion,
					// `--honour` is better than planned and capped at two per viewport,
					// and `--warning-strong` already means "aborted" in this very list,
					// so reusing it would collapse two different states into one colour.
					// A session still running has no outcome yet, and `.mark`'s
					// transparent 3px keeps the row on the same left axis as its
					// neighbours while saying so.
					className={cn(
						'rule-row mark cursor-pointer py-3 pl-3 pr-1 transition-colors duration-[var(--motion-fast)] ease-standard hover:bg-surface',
						s.status === 'COMPLETED' && 'mark-success',
						s.status === 'ABORTED' && 'mark-warning',
					)}
					onClick={() => router.push(`/workouts/history/${s.id}`)}
					role="button"
					tabIndex={0}
					aria-label={`Open session ${s.status.toLowerCase()} for ${
						s.routine.name
					} started ${new Date(s.startedAt).toLocaleString()}`}
					onKeyDown={e => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault()
							router.push(`/workouts/history/${s.id}`)
						}
					}}
				>
					<div className="xl:grid xl:grid-cols-[minmax(0,2fr)_minmax(0,5fr)] xl:items-center xl:gap-8">
						<div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 xl:flex-col xl:items-start xl:gap-0.5">
							<div className="type-panel min-w-0 text-foreground">
								{s.routine.name}
								{s.routine.dayName ? ` · ${s.routine.dayName}` : ''}
							</div>
							<div className="type-body-sm shrink-0 text-ink-3 sm:text-right xl:text-left">
								{s.status}
							</div>
						</div>

						{/* §10.1 — at `xl` the ledger opens: duration and volume become
					    right-aligned mono columns rather than left-aligned pairs. */}
						<div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4 xl:mt-0">
							<div>
								<div className="type-body-sm text-ink-3">Started</div>
								<div className="type-data text-ink-2">
									{new Date(s.startedAt).toLocaleString()}
								</div>
							</div>
							<div>
								<div className="type-body-sm text-ink-3">Ended</div>
								<div className="type-data text-ink-2">
									{s.endedAt ? new Date(s.endedAt).toLocaleString() : '—'}
								</div>
							</div>
							<div className="xl:text-right">
								<div className="type-body-sm text-ink-3">Duration</div>
								<div className="type-data text-ink-2">
									{s.durationSec ? formatDuration(s.durationSec) : '—'}
								</div>
							</div>
							<div className="xl:text-right">
								<div className="type-body-sm text-ink-3">Volume / Sets</div>
								<div className="type-data text-ink-2">
									{s.totalVolume ?? '—'} / {s.totalSets ?? '—'}
								</div>
							</div>
						</div>
					</div>

					{s.notes && (
						<div className="type-body-sm mt-2 text-ink-3">{s.notes}</div>
					)}
				</div>
			))}

			{/* Load more controls */}
			{hasNextPage ? (
				<div className="flex items-center justify-center pt-4">
					<Button
						onClick={() => fetchNextPage()}
						disabled={isFetchingNextPage}
						variant="outline"
						aria-label="Load more"
					>
						{isFetchingNextPage ? 'Loading…' : 'Load more'}
					</Button>
				</div>
			) : (
				<div className="type-body-sm pt-4 text-center text-ink-3">
					No more sessions
				</div>
			)}

			{/* Sentinel for auto-loading */}
			<div ref={sentinelRef} className="h-6 w-full" aria-hidden />
		</div>
	)
}
