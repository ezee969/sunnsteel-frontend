'use client'

import type { ProgressTimelineEventType } from '@sunsteel/contracts'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { type ReactNode, useMemo, useState } from 'react'

import { EmptyModule } from '@/components/layout/empty-module'
import HeroSection from '@/components/layout/HeroSection'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ExercisePerformanceHistory } from '@/features/progress/exercise-performance-history'
import { ProgressTimeline } from '@/features/progress/progress-timeline'
import { StrengthTrendChart } from '@/features/progress/strength-trend-chart'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { useExercises } from '@/lib/api/hooks/useExercises'
import { useRoutines } from '@/lib/api/hooks/useRoutines'
import {
	useExercisePerformanceHistory,
	useExerciseStrengthTrend,
	usePlateaus,
	useProgressTimeline,
	useTrainedExercises,
} from '@/lib/api/hooks/useWorkoutSession'
import type { Exercise } from '@/lib/api/types/exercise.type'
import {
	MECHANIC_LABELS,
	MOVEMENT_PATTERN_LABELS,
} from '@/lib/utils/exercise-catalog'
import { findRoutineUsages } from '@/lib/utils/exercise-detail'
import { EQUIPMENT_LABELS } from '@/lib/utils/exercise-equipment'
import { getFriendlyMuscleNames } from '@/lib/utils/muscle-groups'
import {
	describeClosestShare,
	describePlateauCount,
	formatPlateauSet,
} from '@/lib/utils/plateaus'
import {
	getStrengthDisplayPoints,
	getStrengthTrendRange,
} from '@/lib/utils/strength-trend'
import {
	formatWeightInput,
	getWeightUnitLabel,
	kilogramsToDisplayWeight,
} from '@/lib/utils/weight-unit'

import { CustomExerciseActions } from './custom-exercise-actions'
import { StarToggle } from './star-toggle'

const formatDate = (value: string) =>
	new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	}).format(new Date(value))

function SectionHeading({
	id,
	title,
	description,
}: {
	id: string
	title: string
	description?: string
}) {
	return (
		<div className="rule-row pb-2">
			<h2 id={id} className="type-section text-foreground">
				{title}
			</h2>
			{description ? (
				<p className="type-body-sm mt-1 max-w-2xl text-ink-3">{description}</p>
			) : null}
		</div>
	)
}

function RetryAlert({
	title,
	description,
	onRetry,
}: {
	title: string
	description: string
	onRetry: () => void
}) {
	return (
		<div role="alert" className="border border-rule bg-surface p-5">
			<p className="type-panel text-foreground">{title}</p>
			<p className="type-body-sm mt-1 text-ink-3">{description}</p>
			<Button
				type="button"
				size="sm"
				variant="outline"
				className="mt-3"
				onClick={onRetry}
			>
				<RefreshCw className="size-4" aria-hidden />
				Retry
			</Button>
		</div>
	)
}

function BackLink() {
	return (
		<Link
			href="/exercises"
			className="type-body-sm inline-flex w-fit items-center gap-1 text-ink-3 underline-offset-4 transition-colors duration-[var(--motion-fast)] ease-standard hover:text-foreground hover:underline"
		>
			<ArrowLeft className="size-4" aria-hidden />
			Exercises
		</Link>
	)
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="rule-row grid gap-0.5 py-3">
			<dt className="type-body-sm text-ink-3">{label}</dt>
			<dd className="type-body-sm text-ink-2">{children}</dd>
		</div>
	)
}

function Overview({
	exercise,
	lastTrained,
}: {
	exercise: Exercise
	lastTrained: ReactNode
}) {
	const movement = [
		exercise.movementPattern
			? MOVEMENT_PATTERN_LABELS[exercise.movementPattern]
			: null,
		exercise.mechanic ? MECHANIC_LABELS[exercise.mechanic] : null,
	]
		.filter(Boolean)
		.join(' · ')
	const secondary = getFriendlyMuscleNames(exercise.secondaryMuscles)

	return (
		<section aria-labelledby="exercise-overview">
			<SectionHeading id="exercise-overview" title="Overview" />
			<dl className="grid sm:grid-cols-2 sm:gap-x-8">
				<Fact label="Primary muscles">
					{getFriendlyMuscleNames(exercise.primaryMuscles).join(', ') ||
						'Not classified'}
				</Fact>
				<Fact label="Secondary muscles">
					{secondary.length ? secondary.join(', ') : 'None'}
				</Fact>
				<Fact label="Movement">{movement || 'Not classified'}</Fact>
				<Fact label="Equipment">
					{exercise.equipmentRequired
						.map(item => EQUIPMENT_LABELS[item])
						.join(', ') || 'Not listed'}
				</Fact>
				<Fact label="Last trained">{lastTrained}</Fact>
			</dl>
		</section>
	)
}

function RoutineUsages({ exerciseId }: { exerciseId: string }) {
	const routines = useRoutines()
	const usages = useMemo(
		() => findRoutineUsages(routines.data ?? [], exerciseId),
		[exerciseId, routines.data],
	)

	return (
		<section aria-labelledby="exercise-routines" className="space-y-2">
			<SectionHeading
				id="exercise-routines"
				title="In your routines"
				description="Every routine day that currently programs this exercise, with its planned sets."
			/>
			{routines.isPending ? (
				<div role="status" aria-label="Loading routines" className="space-y-3">
					<Skeleton className="h-12" />
					<Skeleton className="h-12" />
				</div>
			) : routines.isError ? (
				<RetryAlert
					title="Routines are unavailable"
					description="We could not check which routines use this exercise. Try again."
					onRetry={() => void routines.refetch()}
				/>
			) : usages.length === 0 ? (
				<EmptyModule
					title="Not in any routine"
					description="Add it to a routine day in the routine builder to plan it into your week."
					action={{ kind: 'link', label: 'Browse routines', href: '/routines' }}
				/>
			) : (
				<ul>
					{usages.map(usage => (
						<li
							key={usage.routineId}
							className="rule-row grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-6"
						>
							<Link
								href={`/routines/${usage.routineId}`}
								className="type-panel w-fit text-foreground underline-offset-4 hover:underline"
							>
								{usage.routineName}
							</Link>
							<ul className="space-y-0.5">
								{usage.days.map(day => (
									<li
										key={day.dayId}
										className="type-body-sm flex flex-wrap gap-x-2 text-ink-3"
									>
										<span className="text-ink-2">{day.dayName}</span>
										<span className="type-data text-ink-2">
											{day.schemes.join(' · ')}
										</span>
									</li>
								))}
							</ul>
						</li>
					))}
				</ul>
			)}
		</section>
	)
}

function BestPerformance({
	exerciseId,
	hasStrengthTrend,
}: {
	exerciseId: string
	hasStrengthTrend: boolean
}) {
	const weightUnit = useWeightUnit()
	const unitLabel = getWeightUnitLabel(weightUnit)
	const [anchor] = useState(() => new Date())
	const params = useMemo(
		() => ({ exerciseId, ...getStrengthTrendRange('ALL', anchor) }),
		[anchor, exerciseId],
	)
	const trend = useExerciseStrengthTrend(params, hasStrengthTrend)
	// PROG-09: the same plateau watch Progress shows, for this lift only.
	const plateaus = usePlateaus()
	const plateau = plateaus.data?.plateaus.find(
		item => item.exerciseId === exerciseId,
	)
	const current = trend.data?.selectedExercise
	const formatMetric = (value: number) =>
		`${formatWeightInput(value, weightUnit)} ${unitLabel}`

	return (
		<section aria-labelledby="exercise-best" className="space-y-4">
			<SectionHeading
				id="exercise-best"
				title="Your best"
				description="Your best weighted set so far and the one-rep max it estimates, from your recorded bests."
			/>
			{!hasStrengthTrend ? (
				<p className="type-body-sm border border-dashed border-rule bg-surface p-4 text-ink-3">
					No weighted best set yet. Bodyweight sets appear under recent
					performances; a best set needs external load.
				</p>
			) : trend.isPending ? (
				<div role="status" aria-label="Loading your best" className="space-y-4">
					<Skeleton className="h-20" />
					<Skeleton className="h-64" />
				</div>
			) : trend.isError || !current ? (
				<RetryAlert
					title="Your best is unavailable"
					description="We could not load your records for this exercise. Try again."
					onRetry={() => void trend.refetch()}
				/>
			) : (
				<>
					<dl className="grid gap-px bg-rule-faint sm:grid-cols-2">
						<div className="bg-surface p-4 sm:p-5">
							<dt className="type-label text-ink-3">Best set</dt>
							<dd className="mt-2">
								<span className="type-data type-data-strong text-foreground">
									{formatMetric(current.weightKg)} × {current.reps}
								</span>
								<span className="type-body-sm mt-1 block text-ink-3">
									Set on{' '}
									<time dateTime={current.achievedAt}>
										{formatDate(current.achievedAt)}
									</time>
								</span>
							</dd>
						</div>
						<div className="bg-surface p-4 sm:p-5">
							<dt className="type-label text-ink-3">Estimated 1RM</dt>
							<dd className="mt-2">
								<span className="type-data type-data-strong text-foreground">
									{formatMetric(current.estimated1rmKg)}
								</span>
								<span className="type-body-sm mt-1 block text-ink-3">
									Estimated from that set
								</span>
							</dd>
						</div>
					</dl>
					{plateau && plateaus.data ? (
						<p className="type-body-sm text-ink-2">
							{
								describePlateauCount(
									plateau,
									plateaus.data.thresholds,
									formatDate,
								).headline
							}{' '}
							<span className="text-ink-3">
								{
									describePlateauCount(
										plateau,
										plateaus.data.thresholds,
										formatDate,
									).since
								}
								; closest since{' '}
								<span className="type-data text-ink-2">
									{formatPlateauSet(plateau.closest, weightUnit)}
								</span>{' '}
								(
								{describeClosestShare(
									plateau.closestRatio,
									'the best estimate',
								)}
								).
							</span>
						</p>
					) : null}
					<StrengthTrendChart
						id="exercise-estimated-one-rep-max"
						title="Estimated 1RM over time"
						description="Each point is a new best set; its load and reps stay in the detail."
						points={getStrengthDisplayPoints(trend.data)}
						getValue={point =>
							kilogramsToDisplayWeight(point.estimated1rmKg, weightUnit)
						}
						formatValue={value =>
							`${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)} ${unitLabel}`
						}
						formatPointDetail={point =>
							`${formatMetric(point.weightKg)} × ${point.reps}`
						}
					/>
					{trend.data.truncated ? (
						<p role="status" className="type-body-sm text-ink-3">
							The chart shows your latest 500 record changes.
						</p>
					) : null}
				</>
			)}
		</section>
	)
}

function TrainingHistory({ exerciseId }: { exerciseId: string }) {
	const params = useMemo(() => ({ exerciseId }), [exerciseId])
	const history = useExercisePerformanceHistory(params, 5)
	const [timelineFilter, setTimelineFilter] =
		useState<ProgressTimelineEventType>()
	const timeline = useProgressTimeline(timelineFilter, { exerciseId })

	return (
		<>
			<ExercisePerformanceHistory
				copy={{
					title: 'Recent performances',
					description:
						'Every finished session with completed sets of this exercise, newest first. Open one for its sets, notes and progression.',
					emptyTitle: 'No performances yet',
					emptyDescription:
						'Finish a session with a completed set of this exercise to see it here.',
				}}
				sessions={history.data?.pages.flatMap(page => page.items) ?? []}
				isPending={history.isPending}
				isError={history.isError || history.isFetchNextPageError}
				hasNextPage={Boolean(history.hasNextPage)}
				isFetchingNextPage={history.isFetchingNextPage}
				onRetry={() => void history.refetch()}
				onLoadMore={() => void history.fetchNextPage()}
			/>
			<ProgressTimeline
				heading={{
					id: 'exercise-progression',
					title: 'Progression history',
					description:
						'New best sets and automatic prescription changes for this exercise, with the reason preserved from each session.',
				}}
				showExerciseName={false}
				items={timeline.data?.pages.flatMap(page => page.items) ?? []}
				filter={timelineFilter}
				isPending={timeline.isPending}
				isError={timeline.isError || timeline.isFetchNextPageError}
				hasNextPage={Boolean(timeline.hasNextPage)}
				isFetchingNextPage={timeline.isFetchingNextPage}
				onFilterChange={setTimelineFilter}
				onRetry={() => void timeline.refetch()}
				onLoadMore={() => void timeline.fetchNextPage()}
			/>
		</>
	)
}

/**
 * EXER-01: one catalog exercise from the owner's point of view. Every section
 * reads an existing bounded source — the cached catalog and routines, the
 * record frontier, the performance history and the timeline narrowed to this
 * exercise — and the training sections wait for the trained-exercise list so
 * an untrained exercise never requests a history it does not have.
 */
export function ExerciseDetail({ exerciseId }: { exerciseId: string }) {
	const catalog = useExercises()
	const trained = useTrainedExercises()
	const exercise = catalog.data?.find(item => item.id === exerciseId)
	const summary = trained.data?.find(item => item.exerciseId === exerciseId)

	if (catalog.isPending) {
		return (
			<div
				role="status"
				aria-label="Loading exercise"
				className="mx-auto flex max-w-6xl flex-col gap-6"
			>
				<Skeleton className="h-24" />
				<Skeleton className="h-40" />
				<Skeleton className="h-40" />
			</div>
		)
	}

	if (catalog.isError) {
		return (
			<div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
				<BackLink />
				<HeroSection title={<>Exercise</>} />
				<RetryAlert
					title="The catalog is unavailable"
					description="We could not load this exercise. Try again."
					onRetry={() => void catalog.refetch()}
				/>
			</div>
		)
	}

	if (!exercise) {
		return (
			<div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
				<BackLink />
				<HeroSection title={<>Exercise not found</>} />
				<EmptyModule
					title="This exercise is not available"
					description="The link may be out of date. Browse the catalog to find the exercise you were looking for."
					action={{
						kind: 'link',
						label: 'Browse exercises',
						href: '/exercises',
					}}
				/>
			</div>
		)
	}

	const primary = getFriendlyMuscleNames(exercise.primaryMuscles).join(', ')
	const lastTrained = trained.isPending
		? 'Checking your history…'
		: trained.isError
			? 'Unavailable'
			: summary
				? formatDate(summary.lastPerformedAt)
				: 'Not trained yet'

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<BackLink />
				<StarToggle
					exerciseId={exercise.id}
					exerciseName={exercise.name}
					showLabel
				/>
			</div>
			<HeroSection
				title={<>{exercise.name}</>}
				subtitle={primary ? <>Trains {primary}</> : undefined}
			/>
			<Overview exercise={exercise} lastTrained={lastTrained} />
			{exercise.isCustom ? <CustomExerciseActions exercise={exercise} /> : null}
			<RoutineUsages exerciseId={exercise.id} />
			{trained.isPending ? (
				<div role="status" aria-label="Loading your training history">
					<Skeleton className="h-40" />
				</div>
			) : trained.isError ? (
				<RetryAlert
					title="Your training history is unavailable"
					description="We could not check whether you have trained this exercise. Try again."
					onRetry={() => void trained.refetch()}
				/>
			) : !summary ? (
				<section aria-labelledby="exercise-training" className="space-y-2">
					<SectionHeading id="exercise-training" title="Your training" />
					<EmptyModule
						title="You have not trained this exercise yet"
						description="Finish a session with a completed set of it to see your best set, estimated 1RM, recent performances and progression here."
					/>
				</section>
			) : (
				<>
					<BestPerformance
						exerciseId={exercise.id}
						hasStrengthTrend={summary.hasStrengthTrend}
					/>
					<TrainingHistory exerciseId={exercise.id} />
				</>
			)}
		</div>
	)
}
