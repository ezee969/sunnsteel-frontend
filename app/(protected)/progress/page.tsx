'use client'

import { Dumbbell, RefreshCw, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'

import HeroSection from '@/components/layout/HeroSection'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StrengthTrendChart } from '@/features/progress/strength-trend-chart'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { useExerciseStrengthTrend } from '@/lib/api/hooks/useWorkoutSession'
import {
	getStrengthDisplayPoints,
	getStrengthTrendRange,
	STRENGTH_RANGE_OPTIONS,
	type StrengthRange,
} from '@/lib/utils/strength-trend'
import {
	formatWeightInput,
	getWeightUnitLabel,
	kilogramsToDisplayWeight,
} from '@/lib/utils/weight-unit'

function ProgressLoading() {
	return (
		<div className="space-y-6" aria-label="Loading strength trends">
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

export default function ProgressPage() {
	const [range, setRange] = useState<StrengthRange>('90D')
	const [exerciseId, setExerciseId] = useState<string>()
	const [rangeAnchor] = useState(() => new Date())
	const params = useMemo(
		() => ({ exerciseId, ...getStrengthTrendRange(range, rangeAnchor) }),
		[exerciseId, range, rangeAnchor],
	)
	const trend = useExerciseStrengthTrend(params)
	const weightUnit = useWeightUnit()
	const unitLabel = getWeightUnitLabel(weightUnit)
	const displayPoints = trend.data ? getStrengthDisplayPoints(trend.data) : []
	const selectedExerciseId =
		exerciseId ?? trend.data?.selectedExercise?.exerciseId
	const current = trend.data?.selectedExercise
	const recentChanges = trend.data?.points.slice(-6).reverse() ?? []
	const formatMetric = (value: number) =>
		`${formatWeightInput(value, weightUnit)} ${unitLabel}`
	const formatDate = (value: string) =>
		new Intl.DateTimeFormat(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		}).format(new Date(value))

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
			<HeroSection
				title={<>Strength Progress</>}
				subtitle={<>Follow the record frontier for each weighted exercise.</>}
			/>

			<section className="rule-heading grid gap-4 pb-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
				<div className="min-w-0">
					<label htmlFor="strength-exercise" className="type-label text-ink-3">
						Exercise
					</label>
					<Select
						value={selectedExerciseId}
						onValueChange={setExerciseId}
						disabled={!trend.data?.exercises.length}
					>
						<SelectTrigger
							id="strength-exercise"
							className="mt-2 w-full md:max-w-md"
							aria-label="Exercise"
						>
							<SelectValue placeholder="Choose an exercise" />
						</SelectTrigger>
						<SelectContent>
							{trend.data?.exercises.map(exercise => (
								<SelectItem
									key={exercise.exerciseId}
									value={exercise.exerciseId}
								>
									{exercise.exerciseName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div
					role="group"
					aria-label="Date range"
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
							{option.value === 'ALL' ? 'All' : option.value}
						</Button>
					))}
				</div>
			</section>

			{trend.isPending ? (
				<ProgressLoading />
			) : trend.isError ? (
				<div role="alert" className="border border-rule bg-surface p-6">
					<h1 className="type-section text-foreground">
						Strength trends are unavailable
					</h1>
					<p className="type-body-sm mt-2 text-ink-3">
						We could not load this record history. Try again.
					</p>
					<Button
						className="mt-4"
						variant="outline"
						onClick={() => void trend.refetch()}
					>
						<RefreshCw aria-hidden />
						Retry
					</Button>
				</div>
			) : !current ? (
				<div className="flex min-h-72 flex-col items-center justify-center border border-dashed border-rule bg-surface p-8 text-center">
					<Dumbbell className="size-8 text-ink-3" aria-hidden />
					<h1 className="type-section mt-4 text-foreground">
						No strength records yet
					</h1>
					<p className="type-body-sm mt-2 max-w-md text-ink-3">
						Complete a weighted set to establish your first best set and
						estimated 1RM.
					</p>
				</div>
			) : (
				<>
					<section aria-labelledby="current-strength" className="space-y-3">
						<div className="rule-row flex items-center gap-2 pb-2">
							<TrendingUp className="size-4 text-honour" aria-hidden />
							<h1
								id="current-strength"
								className="type-section text-foreground"
							>
								{current.exerciseName}
							</h1>
						</div>
						<div className="grid gap-px bg-rule-faint sm:grid-cols-2">
							<div className="bg-surface p-4 sm:p-5">
								<p className="type-label text-ink-3">Current best set</p>
								<p className="type-data type-data-strong mt-2 text-foreground">
									{formatMetric(current.weightKg)} × {current.reps}
								</p>
							</div>
							<div className="bg-surface p-4 sm:p-5">
								<p className="type-label text-ink-3">Estimated 1RM</p>
								<p className="type-data type-data-strong mt-2 text-foreground">
									{formatMetric(current.estimated1rmKg)}
								</p>
							</div>
						</div>
					</section>

					{trend.data?.baseline && trend.data.points.length === 0 ? (
						<p role="status" className="type-body-sm text-ink-3">
							Your best did not change in this range. The charts begin with the
							record you carried into it.
						</p>
					) : null}

					<div className="grid gap-6 lg:grid-cols-2">
						<StrengthTrendChart
							id="estimated-one-rep-max"
							title="Estimated 1RM trend"
							description="Estimated strength from each new best set."
							points={displayPoints}
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
						<StrengthTrendChart
							id="best-set-load"
							title="Best-set load trend"
							description="Load carried by each new best set; repetitions remain in its detail."
							points={displayPoints}
							getValue={point =>
								kilogramsToDisplayWeight(point.weightKg, weightUnit)
							}
							formatValue={value =>
								`${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)} ${unitLabel}`
							}
							formatPointDetail={point => `${point.reps} reps`}
						/>
					</div>

					{recentChanges.length > 0 ? (
						<section aria-labelledby="record-changes" className="space-y-3">
							<div className="rule-row pb-2">
								<h2
									id="record-changes"
									className="type-section text-foreground"
								>
									Recent record changes
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
											Est. 1RM {formatMetric(point.estimated1rmKg)}
										</span>
									</li>
								))}
							</ol>
						</section>
					) : null}

					{trend.data?.truncated ? (
						<p role="status" className="type-body-sm text-ink-3">
							Showing the latest 500 record changes in this range.
						</p>
					) : null}
				</>
			)}
		</div>
	)
}
