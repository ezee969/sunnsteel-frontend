'use client'

import type {
	ExercisePerformanceSession,
	WeightUnit,
} from '@sunsteel/contracts'
import {
	CalendarDays,
	Clock3,
	History,
	NotebookPen,
	RefreshCw,
	TrendingUp,
} from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import {
	getProgressionRuleExplanation,
	getProgressionSetPresentation,
} from '@/lib/utils/progression-change'
import { formatDuration } from '@/lib/utils/time-format.utils'
import { formatWeightAmount, getWeightUnitLabel } from '@/lib/utils/weight-unit'

const PERFORMANCE_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
	dateStyle: 'medium',
	timeStyle: 'short',
})

interface ExercisePerformanceHistoryProps {
	sessions: ExercisePerformanceSession[]
	isPending: boolean
	isError: boolean
	hasNextPage: boolean
	isFetchingNextPage: boolean
	onRetry: () => void
	onLoadMore: () => void
}

function PerformanceSessionCard({
	session,
	weightUnit,
}: {
	session: ExercisePerformanceSession
	weightUnit: WeightUnit
}) {
	const unitLabel = getWeightUnitLabel(weightUnit)
	const prescriptionNotes = session.prescriptions.flatMap(prescription =>
		prescription.note?.trim() ? [prescription.note.trim()] : [],
	)

	return (
		<article className="border border-rule bg-surface [content-visibility:auto] [contain-intrinsic-size:auto_28rem]">
			<header className="grid gap-3 border-b border-rule-faint p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:p-5">
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="type-panel text-foreground">
							{session.routineName}
						</h3>
						<Badge
							variant={session.status === 'COMPLETED' ? 'success' : 'outline'}
						>
							{session.status === 'COMPLETED' ? 'Completed' : 'Aborted'}
						</Badge>
					</div>
					<p className="type-body-sm mt-1 text-ink-3">
						{session.dayName || 'Workout day'}
					</p>
				</div>
				<div className="type-body-sm space-y-1 text-ink-3 sm:text-right">
					<p className="flex items-center gap-2 sm:justify-end">
						<CalendarDays className="size-4" aria-hidden />
						<time dateTime={session.endedAt}>
							{PERFORMANCE_DATE_FORMATTER.format(new Date(session.endedAt))}
						</time>
					</p>
					<p className="flex items-center gap-2 sm:justify-end">
						<Clock3 className="size-4" aria-hidden />
						{session.durationSec != null
							? formatDuration(session.durationSec)
							: 'Duration unavailable'}
					</p>
				</div>
			</header>

			<div className="space-y-5 p-4 sm:p-5">
				<section aria-label="Completed sets" className="space-y-2">
					<p className="type-label text-ink-3">Completed sets</p>
					<div className="border-y border-rule-faint">
						<div
							aria-hidden
							className="type-body-sm grid grid-cols-[3rem_minmax(0,1fr)_4rem] gap-3 py-2 text-ink-3"
						>
							<span>Set</span>
							<span>Performance</span>
							<span className="text-right">RPE</span>
						</div>
						<ol className="divide-y divide-rule-faint">
							{session.sets.map(set => (
								<li
									key={`${set.routineExerciseId}:${set.setNumber}`}
									className="type-data grid grid-cols-[3rem_minmax(0,1fr)_4rem] items-center gap-3 py-2 text-foreground"
								>
									<span>{set.setNumber}</span>
									<span>
										{set.weightKg != null && set.weightKg > 0
											? `${formatWeightAmount(set.weightKg, weightUnit, 2)} ${unitLabel} × ${set.reps}`
											: `${set.reps} reps · bodyweight`}
									</span>
									<span className="text-right">{set.rpe ?? '—'}</span>
								</li>
							))}
						</ol>
					</div>
				</section>

				<div className="grid gap-4 lg:grid-cols-2">
					<section aria-label="Notes" className="space-y-2">
						<div className="flex items-center gap-2">
							<NotebookPen className="size-4 text-ink-3" aria-hidden />
							<p className="type-label text-ink-3">Notes</p>
						</div>
						<div className="space-y-2 bg-surface-sunk p-3">
							<div>
								<p className="type-body-sm text-ink-3">Session note</p>
								<p className="type-body-sm mt-1 whitespace-pre-wrap text-ink-2">
									{session.sessionNotes?.trim() || 'No session note.'}
								</p>
							</div>
							<div className="border-t border-rule-faint pt-2">
								<p className="type-body-sm text-ink-3">Prescription note</p>
								<p className="type-body-sm mt-1 whitespace-pre-wrap text-ink-2">
									{prescriptionNotes.length
										? prescriptionNotes.join('\n')
										: 'No exercise note in this prescription.'}
								</p>
							</div>
						</div>
					</section>

					<section aria-label="Progression changes" className="space-y-2">
						<div className="flex items-center gap-2">
							<TrendingUp className="size-4 text-honour" aria-hidden />
							<p className="type-label text-ink-3">Progression</p>
						</div>
						{session.progressionChanges.length ? (
							<div className="space-y-3 bg-surface-sunk p-3">
								{session.progressionChanges.map(change => (
									<div key={change.routineExerciseId}>
										<p className="type-body-sm text-ink-2">
											{getProgressionRuleExplanation(change, weightUnit)}
										</p>
										<ul className="mt-2 space-y-1">
											{change.sets.map(set => {
												const row = getProgressionSetPresentation(
													set,
													weightUnit,
												)
												return (
													<li
														key={set.setNumber}
														className="type-data flex flex-wrap justify-between gap-2 text-ink-2"
													>
														<span>
															{row.setLabel} · {row.repsLabel}
														</span>
														<span className="type-data-strong text-foreground">
															{row.weightLabel}
														</span>
													</li>
												)
											})}
										</ul>
									</div>
								))}
							</div>
						) : (
							<p className="type-body-sm bg-surface-sunk p-3 text-ink-3">
								No prescription change followed this session.
							</p>
						)}
					</section>
				</div>

				<Button variant="link" className="h-auto p-0" asChild>
					<Link href={'/workouts/sessions/' + session.sessionId}>
						Open session recap
					</Link>
				</Button>
			</div>
		</article>
	)
}

export function ExercisePerformanceHistory({
	sessions,
	isPending,
	isError,
	hasNextPage,
	isFetchingNextPage,
	onRetry,
	onLoadMore,
}: ExercisePerformanceHistoryProps) {
	const weightUnit = useWeightUnit()

	return (
		<section aria-labelledby="performance-history" className="space-y-4">
			<div className="rule-row flex items-center gap-2 pb-2">
				<History className="size-4 text-ink-3" aria-hidden />
				<div>
					<h2 id="performance-history" className="type-section text-foreground">
						Performance history
					</h2>
					<p className="type-body-sm mt-1 text-ink-3">
						Completed work from every finished session in this range.
					</p>
				</div>
			</div>

			{isPending ? (
				<div className="space-y-4" aria-label="Loading performance history">
					<Skeleton className="h-72" />
					<Skeleton className="h-72" />
				</div>
			) : isError && sessions.length === 0 ? (
				<div role="alert" className="border border-rule bg-surface p-5">
					<p className="type-panel text-foreground">
						Performance history is unavailable
					</p>
					<p className="type-body-sm mt-1 text-ink-3">
						We could not load these sessions. Try again.
					</p>
					<Button variant="outline" className="mt-3" onClick={onRetry}>
						<RefreshCw aria-hidden />
						Retry
					</Button>
				</div>
			) : sessions.length === 0 ? (
				<div className="border border-dashed border-rule bg-surface p-6 text-center">
					<p className="type-panel text-foreground">
						No sessions in this range
					</p>
					<p className="type-body-sm mt-1 text-ink-3">
						Choose a longer range to review earlier performances.
					</p>
				</div>
			) : (
				<div className="space-y-4">
					{sessions.map(session => (
						<PerformanceSessionCard
							key={session.sessionId}
							session={session}
							weightUnit={weightUnit}
						/>
					))}
				</div>
			)}

			{isError && sessions.length > 0 ? (
				<div role="alert" className="flex flex-wrap items-center gap-3">
					<p className="type-body-sm text-ink-3">
						The next page could not be loaded.
					</p>
					<Button size="sm" variant="outline" onClick={onLoadMore}>
						Retry
					</Button>
				</div>
			) : null}

			{hasNextPage ? (
				<Button
					variant="outline"
					className="w-full sm:w-auto"
					disabled={isFetchingNextPage}
					onClick={onLoadMore}
				>
					{isFetchingNextPage ? 'Loading sessions…' : 'Load earlier sessions'}
				</Button>
			) : null}
		</section>
	)
}
