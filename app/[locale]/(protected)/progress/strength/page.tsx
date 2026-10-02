'use client'

import { Dumbbell, RefreshCw, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { GlossaryLine } from '@/components/layout/glossary-line'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ExercisePerformanceHistory } from '@/features/progress/exercise-performance-history'
import { useProgressControls } from '@/features/progress/progress-controls'
import { ProgressTab } from '@/features/progress/progress-tab'
import { ProgressTimeline } from '@/features/progress/progress-timeline'
import { StrengthTrendChart } from '@/features/progress/strength-trend-chart'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { dateFormatter, numberFormatter } from '@/i18n/date-locale'
import {
	useExercisePerformanceHistory,
	useExerciseStrengthTrend,
	useProgressTimeline,
} from '@/lib/api/hooks/useWorkoutSession'
import {
	getStrengthDisplayPoints,
	getStrengthTrendRange,
	STRENGTH_RANGE_OPTIONS,
} from '@/lib/utils/strength-trend'
import {
	getWeightUnitLabel,
	kilogramsToDisplayWeight,
} from '@/lib/utils/weight-unit'

function ProgressLoading() {
	const t = useTranslations('progress.strength')
	return (
		<div className="space-y-6" aria-label={t('loading')}>
			<div className="grid gap-4 sm:grid-cols-2">
				<Skeleton className="h-20" />
				<Skeleton className="h-20" />
			</div>
			<div className="grid gap-6 lg:grid-cols-2">
				<Skeleton className="h-80" />
				<Skeleton className="h-80" />
			</div>
		</div>
	)
}

/**
 * Progress › Strength (UX-11): one lift at a time -- its best set and
 * estimated 1RM over the chosen range, its record changes and every
 * session behind them -- then the record and progression timeline across
 * all lifts.
 */
export default function ProgressStrengthPage() {
	const locale = useLocale() as Locale
	const t = useTranslations('progress.strength')
	const tEx = useTranslations('catalog.exercises')
	const {
		range,
		setRange,
		rangeAnchor,
		exerciseId,
		setExerciseId,
		timelineFilter,
		setTimelineFilter,
	} = useProgressControls()
	const historyParams = useMemo(
		() => ({ exerciseId, ...getStrengthTrendRange(range, rangeAnchor) }),
		[exerciseId, range, rangeAnchor],
	)
	const history = useExercisePerformanceHistory(historyParams)
	const timeline = useProgressTimeline(timelineFilter)
	const historyPage = history.data?.pages[0]
	const selectedExerciseId =
		exerciseId ?? historyPage?.selectedExercise?.exerciseId
	const selectedPerformance = historyPage?.exercises.find(
		exercise => exercise.exerciseId === selectedExerciseId,
	)
	const trend = useExerciseStrengthTrend(
		historyParams,
		exerciseId === undefined ||
			Boolean(selectedExerciseId && selectedPerformance?.hasStrengthTrend),
	)
	const weightUnit = useWeightUnit()
	const unitLabel = getWeightUnitLabel(weightUnit)
	const displayPoints = trend.data ? getStrengthDisplayPoints(trend.data) : []
	const current = trend.data?.selectedExercise
	const recentChanges = trend.data?.points.slice(-6).reverse() ?? []
	const performanceSessions =
		history.data?.pages.flatMap(page => page.items) ?? []
	const timelineItems = timeline.data?.pages.flatMap(page => page.items) ?? []
	// No grouping: English reads as `String()` did; Spanish moves the decimal.
	const formatMetric = (value: number) =>
		`${numberFormatter(locale, { maximumFractionDigits: 2, useGrouping: false }).format(kilogramsToDisplayWeight(value, weightUnit))} ${unitLabel}`
	const formatDate = (value: string) =>
		dateFormatter(locale, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		}).format(new Date(value))

	return (
		<ProgressTab>
			<GlossaryLine terms={['estimated1rm']} />
			<section
				id="progress-exercise"
				className="rule-heading grid gap-4 pb-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end"
			>
				<div className="min-w-0">
					<label htmlFor="strength-exercise" className="type-label text-ink-3">
						{t('exercise')}
					</label>
					<Select
						value={selectedExerciseId ?? ''}
						onValueChange={setExerciseId}
						disabled={!historyPage?.exercises.length}
					>
						<SelectTrigger
							id="strength-exercise"
							className="mt-2 w-full md:max-w-md"
							aria-label={t('exercise')}
						>
							<SelectValue placeholder={t('chooseExercise')} />
						</SelectTrigger>
						<SelectContent>
							{historyPage?.exercises.map(exercise => (
								<SelectItem
									key={exercise.exerciseId}
									value={exercise.exerciseId}
								>
									{exerciseLabel(exercise.exerciseName, tEx)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div
					role="group"
					aria-label={t('dateRange')}
					className="flex flex-wrap gap-1"
				>
					{STRENGTH_RANGE_OPTIONS.map(option => (
						<Button
							key={option.value}
							type="button"
							size="sm"
							variant={range === option.value ? 'secondary' : 'ghost'}
							aria-pressed={range === option.value}
							onClick={() => setRange(option.value)}
						>
							{t(`range${option.value}`)}
						</Button>
					))}
				</div>
			</section>

			{history.isPending ? (
				<ProgressLoading />
			) : history.isError && !history.data ? (
				<div role="alert" className="border border-rule bg-surface p-6">
					<h2 className="type-section text-foreground">{t('errorTitle')}</h2>
					<p className="type-body-sm mt-2 text-ink-3">{t('errorBody')}</p>
					<Button
						className="mt-4"
						variant="outline"
						onClick={() => void history.refetch()}
					>
						<RefreshCw aria-hidden />
						{t('retry')}
					</Button>
				</div>
			) : !selectedPerformance ? (
				<div className="flex min-h-72 flex-col items-center justify-center border border-dashed border-rule bg-surface p-8 text-center">
					<Dumbbell className="size-8 text-ink-3" aria-hidden />
					<h2 className="type-section mt-4 text-foreground">
						{t('emptyTitle')}
					</h2>
					<p className="type-body-sm mt-2 max-w-md text-ink-3">
						{t('emptyBody')}
					</p>
				</div>
			) : (
				<>
					<section aria-labelledby="current-strength" className="space-y-3">
						<div className="rule-row flex items-center gap-2 pb-2">
							<TrendingUp className="size-4 text-honour" aria-hidden />
							<h2
								id="current-strength"
								className="type-section text-foreground"
							>
								{exerciseLabel(selectedPerformance.exerciseName, tEx)}
							</h2>
							<Link
								href={`/exercises/${selectedPerformance.exerciseId}`}
								className="type-body-sm ml-auto shrink-0 text-primary underline-offset-4 hover:underline"
							>
								{t('exercisePage')}
							</Link>
						</div>
					</section>

					{selectedPerformance.hasStrengthTrend ? (
						trend.isPending ? (
							<div className="grid gap-6 lg:grid-cols-2">
								<Skeleton className="h-80" />
								<Skeleton className="h-80" />
							</div>
						) : trend.isError ? (
							<div role="alert" className="border border-rule bg-surface p-5">
								<p className="type-panel text-foreground">
									{t('trendsErrorTitle')}
								</p>
								<p className="type-body-sm mt-1 text-ink-3">
									{t('trendsErrorBody')}
								</p>
								<Button
									size="sm"
									variant="outline"
									className="mt-3"
									onClick={() => void trend.refetch()}
								>
									<RefreshCw aria-hidden />
									{t('retryTrends')}
								</Button>
							</div>
						) : current ? (
							<>
								{/* v1.1 §26.4: the two figures side by side at every width,
								    so the chart rises on a phone. */}
								<div className="grid grid-cols-2 gap-px bg-rule-faint">
									<div className="bg-surface p-3 sm:p-5">
										<p className="type-label text-ink-3">{t('currentBest')}</p>
										<p className="type-data type-data-strong mt-2 text-foreground">
											{formatMetric(current.weightKg)} × {current.reps}
										</p>
									</div>
									<div className="bg-surface p-3 sm:p-5">
										<p className="type-label text-ink-3">{t('estimated1rm')}</p>
										<p className="type-data type-data-strong mt-2 text-foreground">
											{formatMetric(current.estimated1rmKg)}
										</p>
									</div>
								</div>

								{trend.data?.baseline && trend.data.points.length === 0 ? (
									<p role="status" className="type-body-sm text-ink-3">
										{t('unchanged')}
									</p>
								) : null}

								<div className="grid gap-6 lg:grid-cols-2">
									<StrengthTrendChart
										id="estimated-one-rep-max"
										title={t('e1rmTitle')}
										description={t('e1rmDescription')}
										points={displayPoints}
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
									<StrengthTrendChart
										id="best-set-load"
										title={t('loadTitle')}
										description={t('loadDescription')}
										points={displayPoints}
										getValue={point =>
											kilogramsToDisplayWeight(point.weightKg, weightUnit)
										}
										formatValue={value =>
											`${numberFormatter(locale, { maximumFractionDigits: 2 }).format(value)} ${unitLabel}`
										}
										formatPointDetail={point =>
											t('repsDetail', { reps: point.reps })
										}
									/>
								</div>

								{recentChanges.length > 0 ? (
									<section
										aria-labelledby="record-changes"
										className="space-y-3"
									>
										<div className="rule-row pb-2">
											<h2
												id="record-changes"
												className="type-section text-foreground"
											>
												{t('recentChanges')}
											</h2>
										</div>
										<ol className="divide-y divide-rule-faint border-y border-rule-faint">
											{recentChanges.map(point => (
												<li
													key={`${point.sessionId}-${point.achievedAt}`}
													className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-6"
												>
													<time className="type-body-sm text-ink-3">
														{formatDate(point.achievedAt)}
													</time>
													<span className="type-data text-foreground">
														{formatMetric(point.weightKg)} × {point.reps}
													</span>
													<span className="type-body-sm text-ink-3 sm:text-right">
														{t('est1rm', {
															value: formatMetric(point.estimated1rmKg),
														})}
													</span>
												</li>
											))}
										</ol>
									</section>
								) : null}

								{trend.data?.truncated ? (
									<p role="status" className="type-body-sm text-ink-3">
										{t('truncated')}
									</p>
								) : null}
							</>
						) : null
					) : (
						<p className="type-body-sm border border-dashed border-rule bg-surface p-4 text-ink-3">
							{t('noTrend')}
						</p>
					)}

					<ExercisePerformanceHistory
						sessions={performanceSessions}
						isPending={history.isPending}
						isError={history.isError || history.isFetchNextPageError}
						hasNextPage={Boolean(history.hasNextPage)}
						isFetchingNextPage={history.isFetchingNextPage}
						onRetry={() => void history.refetch()}
						onLoadMore={() => void history.fetchNextPage()}
					/>
				</>
			)}

			<ProgressTimeline
				items={timelineItems}
				filter={timelineFilter}
				isPending={timeline.isPending}
				isError={timeline.isError || timeline.isFetchNextPageError}
				hasNextPage={Boolean(timeline.hasNextPage)}
				isFetchingNextPage={timeline.isFetchingNextPage}
				onFilterChange={setTimelineFilter}
				onRetry={() => void timeline.refetch()}
				onLoadMore={() => void timeline.fetchNextPage()}
			/>
		</ProgressTab>
	)
}
