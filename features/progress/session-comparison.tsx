'use client'

import type {
	SessionComparisonResponse,
	SessionComparisonSet,
	WeightUnit,
} from '@sunsteel/contracts'
import { GitCompareArrows, NotebookPen, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { buildSessionExerciseComparisons } from '@/lib/utils/session-comparison'
import { formatDuration } from '@/lib/utils/time-format.utils'
import { formatWeightAmount, getWeightUnitLabel } from '@/lib/utils/weight-unit'

const SESSION_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
	dateStyle: 'medium',
	timeStyle: 'short',
})

interface SessionComparisonProps {
	data?: SessionComparisonResponse
	selectedRoutineDayId?: string
	isPending: boolean
	isError: boolean
	onRoutineDayChange: (routineDayId: string) => void
	onRetry: () => void
}

interface MetricComparisonProps {
	label: string
	latest: string
	previous: string
	delta: string
}

function MetricComparison({
	label,
	latest,
	previous,
	delta,
}: MetricComparisonProps) {
	return (
		<div
			role="row"
			className="rule-row grid grid-cols-2 gap-x-4 gap-y-2 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(7rem,auto)_minmax(7rem,auto)_minmax(7rem,auto)] sm:items-center"
		>
			<p
				role="rowheader"
				className="col-span-2 type-body-sm text-ink-2 sm:col-span-1"
			>
				{label}
			</p>
			<div role="cell">
				<p className="type-body-sm text-ink-3 sm:hidden">Latest</p>
				<p className="type-data type-data-strong text-foreground">{latest}</p>
			</div>
			<div role="cell">
				<p className="type-body-sm text-ink-3 sm:hidden">Previous</p>
				<p className="type-data text-ink-2">{previous}</p>
			</div>
			<div role="cell" className="col-span-2 sm:col-span-1 sm:text-right">
				<p className="type-body-sm text-ink-3 sm:hidden">Change</p>
				<p className="type-data text-ink-2">{delta}</p>
			</div>
		</div>
	)
}

function formatSignedDuration(value: number) {
	if (value === 0) return 'No change'
	return `${value > 0 ? '+' : '−'}${formatDuration(Math.abs(value))}`
}

function formatSignedNumber(value: number, format: (value: number) => string) {
	if (value === 0) return 'No change'
	return `${value > 0 ? '+' : '−'}${format(Math.abs(value))}`
}

function formatSet(set: SessionComparisonSet | null, weightUnit: WeightUnit) {
	if (!set) return 'Not completed'
	const performance =
		set.weightKg != null && set.weightKg > 0
			? `${formatWeightAmount(set.weightKg, weightUnit)} ${getWeightUnitLabel(weightUnit)} × ${set.reps}`
			: `${set.reps} reps · bodyweight`
	return set.rpe != null ? `${performance} · RPE ${set.rpe}` : performance
}

export function SessionComparison({
	data,
	selectedRoutineDayId,
	isPending,
	isError,
	onRoutineDayChange,
	onRetry,
}: SessionComparisonProps) {
	const weightUnit = useWeightUnit()
	const unitLabel = getWeightUnitLabel(weightUnit)
	const latest = data?.latestSession ?? null
	const previous = data?.previousSession ?? null
	const exerciseComparisons = useMemo(
		() => (latest ? buildSessionExerciseComparisons(latest, previous) : []),
		[latest, previous],
	)
	const selectedValue =
		selectedRoutineDayId ?? data?.selectedRoutineDay?.routineDayId ?? ''
	const formatVolume = (valueKg: number) =>
		`${formatWeightAmount(valueKg, weightUnit)} ${unitLabel}`

	return (
		<section aria-labelledby="session-comparison" className="space-y-4">
			<div className="rule-row flex items-start gap-2 pb-2">
				<GitCompareArrows className="mt-0.5 size-4 text-ink-3" aria-hidden />
				<div>
					<h2 id="session-comparison" className="type-section text-foreground">
						Session comparison
					</h2>
					<p className="type-body-sm mt-1 max-w-2xl text-ink-3">
						Compare the latest two completions of the same routine day.
					</p>
				</div>
			</div>

			{isPending && !data ? (
				<div className="space-y-3" aria-label="Loading session comparison">
					<Skeleton className="h-16" />
					<Skeleton className="h-56" />
				</div>
			) : isError || !data ? (
				<div role="alert" className="border border-rule bg-surface p-5">
					<p className="type-panel text-foreground">
						Session comparison is unavailable
					</p>
					<p className="type-body-sm mt-1 text-ink-3">
						We could not load your completed sessions. Try again.
					</p>
					<Button
						variant="outline"
						size="sm"
						className="mt-3"
						onClick={onRetry}
					>
						<RefreshCw aria-hidden />
						Retry comparison
					</Button>
				</div>
			) : data.routineDays.length === 0 || !latest ? (
				<div className="border border-dashed border-rule bg-surface p-6 text-center">
					<p className="type-panel text-foreground">
						No completed sessions yet
					</p>
					<p className="type-body-sm mt-1 text-ink-3">
						Finish a routine day to create its first comparison point.
					</p>
				</div>
			) : (
				<>
					<div className="w-full sm:max-w-lg">
						<label
							htmlFor="comparison-routine-day"
							className="type-label text-ink-3"
						>
							Routine day
						</label>
						<Select value={selectedValue} onValueChange={onRoutineDayChange}>
							<SelectTrigger
								id="comparison-routine-day"
								className="mt-2 w-full"
							>
								<SelectValue placeholder="Choose a routine day" />
							</SelectTrigger>
							<SelectContent>
								{data.routineDays.map(day => (
									<SelectItem key={day.routineDayId} value={day.routineDayId}>
										{day.routineName} · {day.dayName || 'Workout day'} ·{' '}
										{day.completedSessionCount}{' '}
										{day.completedSessionCount === 1 ? 'session' : 'sessions'}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="grid gap-px bg-rule-faint sm:grid-cols-2">
						<div className="bg-surface p-4 sm:p-5">
							<p className="type-label text-ink-3">Latest</p>
							<p className="type-panel mt-1 text-foreground">
								{latest.routineName}
							</p>
							<p className="type-body-sm mt-1 text-ink-3">
								{latest.dayName || 'Workout day'} ·{' '}
								<time dateTime={latest.endedAt}>
									{SESSION_DATE_FORMATTER.format(new Date(latest.endedAt))}
								</time>
							</p>
							<Button variant="link" className="mt-2 h-auto p-0" asChild>
								<Link href={`/workouts/sessions/${latest.sessionId}`}>
									Open recap
								</Link>
							</Button>
						</div>
						<div className="bg-surface p-4 sm:p-5">
							<p className="type-label text-ink-3">Previous</p>
							{previous ? (
								<>
									<p className="type-panel mt-1 text-foreground">
										{previous.routineName}
									</p>
									<p className="type-body-sm mt-1 text-ink-3">
										{previous.dayName || 'Workout day'} ·{' '}
										<time dateTime={previous.endedAt}>
											{SESSION_DATE_FORMATTER.format(
												new Date(previous.endedAt),
											)}
										</time>
									</p>
									<Button variant="link" className="mt-2 h-auto p-0" asChild>
										<Link href={`/workouts/sessions/${previous.sessionId}`}>
											Open recap
										</Link>
									</Button>
								</>
							) : (
								<p className="type-body-sm mt-1 text-ink-3">
									Complete this routine day again to unlock the comparison.
								</p>
							)}
						</div>
					</div>

					<div role="table" aria-label="Session metric comparison">
						<div
							role="row"
							className="hidden grid-cols-[minmax(0,1fr)_minmax(7rem,auto)_minmax(7rem,auto)_minmax(7rem,auto)] gap-4 border-b border-rule-faint pb-2 sm:grid"
						>
							<span role="columnheader" className="type-label text-ink-3">
								Metric
							</span>
							<span role="columnheader" className="type-label text-ink-3">
								Latest
							</span>
							<span role="columnheader" className="type-label text-ink-3">
								Previous
							</span>
							<span
								role="columnheader"
								className="type-label text-right text-ink-3"
							>
								Change
							</span>
						</div>
						<MetricComparison
							label="Duration"
							latest={formatDuration(latest.durationSec)}
							previous={
								previous
									? formatDuration(previous.durationSec)
									: 'Not available'
							}
							delta={
								previous
									? formatSignedDuration(
											latest.durationSec - previous.durationSec,
										)
									: '—'
							}
						/>
						<MetricComparison
							label="Load volume"
							latest={formatVolume(latest.totalVolumeKg)}
							previous={
								previous
									? formatVolume(previous.totalVolumeKg)
									: 'Not available'
							}
							delta={
								previous
									? formatSignedNumber(
											latest.totalVolumeKg - previous.totalVolumeKg,
											formatVolume,
										)
									: '—'
							}
						/>
						<MetricComparison
							label="Completed sets"
							latest={String(latest.completedSets)}
							previous={
								previous ? String(previous.completedSets) : 'Not available'
							}
							delta={
								previous
									? formatSignedNumber(
											latest.completedSets - previous.completedSets,
											String,
										)
									: '—'
							}
						/>
					</div>

					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<NotebookPen className="size-4 text-ink-3" aria-hidden />
							<h3 className="type-panel text-foreground">Session notes</h3>
						</div>
						<div className="grid gap-px bg-rule-faint sm:grid-cols-2">
							<div className="bg-surface py-3 sm:pr-4">
								<p className="type-body-sm text-ink-3">Latest</p>
								<p className="type-body-sm mt-1 whitespace-pre-wrap text-ink-2">
									{latest.notes?.trim() || 'No session note.'}
								</p>
							</div>
							<div className="bg-surface py-3 sm:pl-4">
								<p className="type-body-sm text-ink-3">Previous</p>
								<p className="type-body-sm mt-1 whitespace-pre-wrap text-ink-2">
									{previous
										? previous.notes?.trim() || 'No session note.'
										: 'Not available.'}
								</p>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<h3 className="type-panel text-foreground">Exercise details</h3>
						<p className="type-body-sm text-ink-3">
							Open an exercise to compare completed sets. Skipped work remains
							visible.
						</p>
						<Accordion type="multiple" className="border-y border-rule-faint">
							{exerciseComparisons.map(exercise => (
								<AccordionItem
									key={exercise.routineExerciseId}
									value={exercise.routineExerciseId}
									className="border-rule-faint"
								>
									<AccordionTrigger className="rounded-none px-0 hover:no-underline">
										<span className="min-w-0">
											<span className="block truncate text-foreground">
												{exercise.exerciseName}
											</span>
											<span className="type-body-sm mt-1 block text-ink-3">
												{exercise.latest?.sets.length ?? 0} latest ·{' '}
												{exercise.previous?.sets.length ?? 0} previous
												{previous && !exercise.previous
													? ' · added since previous'
													: previous && !exercise.latest
														? ' · removed since previous'
														: ''}
											</span>
										</span>
									</AccordionTrigger>
									<AccordionContent className="pb-4">
										{exercise.sets.length ? (
											<ol className="divide-y divide-rule-faint border-t border-rule-faint">
												{exercise.sets.map(set => (
													<li
														key={set.setNumber}
														className="grid gap-2 py-3 sm:grid-cols-[4rem_minmax(0,1fr)_minmax(0,1fr)] sm:gap-4"
													>
														<p className="type-body-sm text-ink-3">
															Set {set.setNumber}
														</p>
														<div>
															<p className="type-body-sm text-ink-3">Latest</p>
															<p className="type-data text-foreground">
																{formatSet(set.latest, weightUnit)}
															</p>
														</div>
														<div>
															<p className="type-body-sm text-ink-3">
																Previous
															</p>
															<p className="type-data text-ink-2">
																{previous
																	? formatSet(set.previous, weightUnit)
																	: 'Not available'}
															</p>
														</div>
													</li>
												))}
											</ol>
										) : (
											<p className="type-body-sm text-ink-3">
												No completed sets in either session.
											</p>
										)}
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					</div>
				</>
			)}
		</section>
	)
}
