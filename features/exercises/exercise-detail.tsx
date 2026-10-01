'use client'

import type { ProgressTimelineEventType } from '@sunsteel/contracts'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { type ReactNode, useMemo, useState } from 'react'

import { EmptyModule } from '@/components/layout/empty-module'
import HeroSection from '@/components/layout/HeroSection'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ExercisePerformanceHistory } from '@/features/progress/exercise-performance-history'
import { ProgressTimeline } from '@/features/progress/progress-timeline'
import { StrengthTrendChart } from '@/features/progress/strength-trend-chart'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { dateFormatter, numberFormatter } from '@/i18n/date-locale'
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
	mechanicLabel,
	movementPatternLabel,
} from '@/lib/utils/exercise-catalog'
import { findRoutineUsages } from '@/lib/utils/exercise-detail'
import { equipmentLabel } from '@/lib/utils/exercise-equipment'
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

const formatDate = (locale: Locale) => (value: string) =>
	dateFormatter(locale, {
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
	const t = useTranslations('catalog.exercisesUi')
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
				{t('retry')}
			</Button>
		</div>
	)
}

function BackLink() {
	const t = useTranslations('catalog.exercisesUi')
	return (
		<Link
			href="/exercises"
			className="type-body-sm inline-flex w-fit items-center gap-1 text-ink-3 underline-offset-4 transition-colors duration-[var(--motion-fast)] ease-standard hover:text-foreground hover:underline"
		>
			<ArrowLeft className="size-4" aria-hidden />
			{t('back')}
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
	const t = useTranslations('catalog.exercisesUi')
	const tMuscles = useTranslations('routines.muscles')
	const tEquipment = useTranslations('routines.equipment')
	const movement = [
		exercise.movementPattern
			? movementPatternLabel(t, exercise.movementPattern)
			: null,
		exercise.mechanic ? mechanicLabel(t, exercise.mechanic) : null,
	]
		.filter(Boolean)
		.join(' · ')
	const secondary = getFriendlyMuscleNames(exercise.secondaryMuscles, tMuscles)

	return (
		<section aria-labelledby="exercise-overview">
			<SectionHeading id="exercise-overview" title={t('overview')} />
			<dl className="grid sm:grid-cols-2 sm:gap-x-8">
				<Fact label={t('primaryMuscles')}>
					{getFriendlyMuscleNames(exercise.primaryMuscles, tMuscles).join(
						', ',
					) || t('notClassified')}
				</Fact>
				<Fact label={t('secondaryMuscles')}>
					{secondary.length ? secondary.join(', ') : t('none')}
				</Fact>
				<Fact label={t('colMovement')}>{movement || t('notClassified')}</Fact>
				<Fact label={t('colEquipment')}>
					{exercise.equipmentRequired
						.map(item => equipmentLabel(item, tEquipment))
						.join(', ') || t('notListed')}
				</Fact>
				<Fact label={t('colLastTrained')}>{lastTrained}</Fact>
			</dl>
		</section>
	)
}

function RoutineUsages({ exerciseId }: { exerciseId: string }) {
	const t = useTranslations('catalog.exercisesUi')
	const routines = useRoutines()
	const tDate = useTranslations('routines.date')
	const tFormat = useTranslations('routines.format')
	const usages = useMemo(
		() => findRoutineUsages(routines.data ?? [], exerciseId, tDate, tFormat),
		[exerciseId, routines.data, tDate, tFormat],
	)

	return (
		<section aria-labelledby="exercise-routines" className="space-y-2">
			<SectionHeading
				id="exercise-routines"
				title={t('inRoutinesTitle')}
				description={t('inRoutinesDescription')}
			/>
			{routines.isPending ? (
				<div
					role="status"
					aria-label={t('loadingRoutines')}
					className="space-y-3"
				>
					<Skeleton className="h-12" />
					<Skeleton className="h-12" />
				</div>
			) : routines.isError ? (
				<RetryAlert
					title={t('routinesUnavailable')}
					description={t('routinesUnavailableBody')}
					onRetry={() => void routines.refetch()}
				/>
			) : usages.length === 0 ? (
				<EmptyModule
					title={t('notInRoutineTitle')}
					description={t('notInRoutineBody')}
					action={{
						kind: 'link',
						label: t('browseRoutines'),
						href: '/routines',
					}}
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
	const locale = useLocale() as Locale
	const t = useTranslations('catalog.exercisesUi')
	const weightUnit = useWeightUnit()
	const tPlateaus = useTranslations('planning.plateaus')
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
				title={t('bestTitle')}
				description={t('bestDescription')}
			/>
			{!hasStrengthTrend ? (
				<p className="type-body-sm border border-dashed border-rule bg-surface p-4 text-ink-3">
					{t('noWeightedBest')}
				</p>
			) : trend.isPending ? (
				<div role="status" aria-label={t('loadingBest')} className="space-y-4">
					<Skeleton className="h-20" />
					<Skeleton className="h-64" />
				</div>
			) : trend.isError || !current ? (
				<RetryAlert
					title={t('bestUnavailable')}
					description={t('bestUnavailableBody')}
					onRetry={() => void trend.refetch()}
				/>
			) : (
				<>
					<dl className="grid gap-px bg-rule-faint sm:grid-cols-2">
						<div className="bg-surface p-4 sm:p-5">
							<dt className="type-label text-ink-3">{t('bestSet')}</dt>
							<dd className="mt-2">
								<span className="type-data type-data-strong text-foreground">
									{formatMetric(current.weightKg)} × {current.reps}
								</span>
								<span className="type-body-sm mt-1 block text-ink-3">
									{t.rich('setOn', {
										date: formatDate(locale)(current.achievedAt),
										time: chunks => (
											<time dateTime={current.achievedAt}>{chunks}</time>
										),
									})}
								</span>
							</dd>
						</div>
						<div className="bg-surface p-4 sm:p-5">
							<dt className="type-label text-ink-3">{t('estimated1rm')}</dt>
							<dd className="mt-2">
								<span className="type-data type-data-strong text-foreground">
									{formatMetric(current.estimated1rmKg)}
								</span>
								<span className="type-body-sm mt-1 block text-ink-3">
									{t('estimatedFromSet')}
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
									formatDate(locale),
									tPlateaus,
								).headline
							}{' '}
							<span className="text-ink-3">
								{t.rich('plateauTail', {
									since: describePlateauCount(
										plateau,
										plateaus.data.thresholds,
										formatDate(locale),
										tPlateaus,
									).since,
									set: chunks => (
										<span className="type-data text-ink-2">{chunks}</span>
									),
									setText: formatPlateauSet(
										plateau.closest,
										weightUnit,
										locale,
									),
									share: describeClosestShare(
										plateau.closestRatio,
										tPlateaus,
										tPlateaus('estimateBest'),
									),
								})}
							</span>
						</p>
					) : null}
					<StrengthTrendChart
						id="exercise-estimated-one-rep-max"
						title={t('chartTitle')}
						description={t('chartDescription')}
						points={getStrengthDisplayPoints(trend.data)}
						getValue={point =>
							kilogramsToDisplayWeight(point.estimated1rmKg, weightUnit)
						}
						formatValue={value =>
							`${numberFormatter(locale, { maximumFractionDigits: 2 }).format(value)} ${unitLabel}`
						}
						formatPointDetail={point =>
							`${formatMetric(point.weightKg)} × ${point.reps}`
						}
					/>
					{trend.data.truncated ? (
						<p role="status" className="type-body-sm text-ink-3">
							{t('chartTruncated')}
						</p>
					) : null}
				</>
			)}
		</section>
	)
}

function TrainingHistory({ exerciseId }: { exerciseId: string }) {
	const t = useTranslations('catalog.exercisesUi')
	const params = useMemo(() => ({ exerciseId }), [exerciseId])
	const history = useExercisePerformanceHistory(params, 5)
	const [timelineFilter, setTimelineFilter] =
		useState<ProgressTimelineEventType>()
	const timeline = useProgressTimeline(timelineFilter, { exerciseId })

	return (
		<>
			<ExercisePerformanceHistory
				copy={{
					title: t('recentTitle'),
					description: t('recentSummary'),
					detail: t('recentDescription'),
					emptyTitle: t('recentEmptyTitle'),
					emptyDescription: t('recentEmptyDescription'),
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
					title: t('progressionTitle'),
					description: t('progressionDescription'),
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
	const locale = useLocale() as Locale
	const tMusclesPage = useTranslations('routines.muscles')
	const t = useTranslations('catalog.exercisesUi')
	const tExercises = useTranslations('catalog.exercises')
	const catalog = useExercises()
	const trained = useTrainedExercises()
	const exercise = catalog.data?.find(item => item.id === exerciseId)
	const summary = trained.data?.find(item => item.exerciseId === exerciseId)

	if (catalog.isPending) {
		return (
			<div
				role="status"
				aria-label={t('loadingExercise')}
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
				<HeroSection title={<>{t('exerciseTitle')}</>} />
				<RetryAlert
					title={t('catalogUnavailable')}
					description={t('exerciseLoadFailedBody')}
					onRetry={() => void catalog.refetch()}
				/>
			</div>
		)
	}

	if (!exercise) {
		return (
			<div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
				<BackLink />
				<HeroSection title={<>{t('notFoundTitle')}</>} />
				<EmptyModule
					title={t('notAvailableTitle')}
					description={t('notAvailableBody')}
					action={{
						kind: 'link',
						label: t('browseExercises'),
						href: '/exercises',
					}}
				/>
			</div>
		)
	}

	const primary = getFriendlyMuscleNames(
		exercise.primaryMuscles,
		tMusclesPage,
	).join(', ')
	const lastTrained = trained.isPending
		? t('checkingHistory')
		: trained.isError
			? t('unavailable')
			: summary
				? formatDate(locale)(summary.lastPerformedAt)
				: t('notTrainedYet')

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<BackLink />
				<StarToggle
					exerciseId={exercise.id}
					exerciseName={exerciseLabel(exercise.name, tExercises)}
					showLabel
				/>
			</div>
			<HeroSection
				title={<>{exerciseLabel(exercise.name, tExercises)}</>}
				subtitle={
					primary ? <>{t('trains', { muscles: primary })}</> : undefined
				}
				subtitleOnPhone
			/>
			<Overview exercise={exercise} lastTrained={lastTrained} />
			{exercise.isCustom ? <CustomExerciseActions exercise={exercise} /> : null}
			<RoutineUsages exerciseId={exercise.id} />
			{trained.isPending ? (
				<div role="status" aria-label={t('loadingHistory')}>
					<Skeleton className="h-40" />
				</div>
			) : trained.isError ? (
				<RetryAlert
					title={t('historyUnavailable')}
					description={t('trainedCheckFailedBody')}
					onRetry={() => void trained.refetch()}
				/>
			) : !summary ? (
				<section aria-labelledby="exercise-training" className="space-y-2">
					<SectionHeading id="exercise-training" title={t('yourTraining')} />
					<EmptyModule
						title={t('notTrainedTitle')}
						description={t('notTrainedBody')}
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
