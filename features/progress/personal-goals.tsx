'use client'

import type {
	MeasurableGoalType,
	PersonalGoalProgress,
	PersonalGoalsResponse,
	WeightUnit,
} from '@sunsteel/contracts'
import { CheckCircle2, RefreshCw, Target } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { getMeasurableGoalLabel } from '@/lib/utils/measurable-goals'
import { formatWeightAmount, getWeightUnitLabel } from '@/lib/utils/weight-unit'

interface PersonalGoalsProps {
	data?: PersonalGoalsResponse
	weightUnit: WeightUnit
	isPending: boolean
	isError: boolean
	onRetry: () => void
}

const NUMBER_FORMATTER = new Intl.NumberFormat(undefined, {
	maximumFractionDigits: 1,
})

function formatGoalValue(
	value: number,
	type: MeasurableGoalType,
	weightUnit: WeightUnit,
): string {
	if (
		type === 'WEEKLY_VOLUME' ||
		type === 'EXERCISE_ESTIMATED_1RM' ||
		type === 'BODY_WEIGHT'
	) {
		return `${formatWeightAmount(value, weightUnit, 1)} ${getWeightUnitLabel(weightUnit)}`
	}
	const formatted = NUMBER_FORMATTER.format(value)
	return type === 'WEEKLY_SESSIONS'
		? `${formatted} ${value === 1 ? 'session' : 'sessions'}`
		: `${formatted} ${value === 1 ? 'day' : 'days'}`
}

function getGoalName(goal: PersonalGoalProgress): string {
	return goal.type === 'EXERCISE_ESTIMATED_1RM' && goal.exercise
		? `${goal.exercise.name} estimated 1RM`
		: getMeasurableGoalLabel(goal.type)
}

function getMissingCopy(goal: PersonalGoalProgress): string {
	return goal.type === 'BODY_WEIGHT'
		? 'Add your current body weight in Settings to compare this target.'
		: 'Complete a loaded set for this exercise to establish your current estimate.'
}

function GoalRow({
	goal,
	weightUnit,
}: {
	goal: PersonalGoalProgress
	weightUnit: WeightUnit
}) {
	const current =
		goal.currentValue === null
			? null
			: formatGoalValue(goal.currentValue, goal.type, weightUnit)
	const target = formatGoalValue(goal.targetValue, goal.type, weightUnit)
	const remaining =
		goal.remainingValue === null
			? null
			: formatGoalValue(goal.remainingValue, goal.type, weightUnit)
	const direction = goal.direction === 'AT_MOST' ? 'at most' : 'at least'

	return (
		<li className="rule-row grid gap-3 py-4 xl:grid-cols-[minmax(0,1fr)_minmax(13rem,0.85fr)] xl:items-center">
			<div className="min-w-0">
				<div className="flex items-center gap-2">
					{goal.achieved ? (
						<CheckCircle2
							className="size-4 shrink-0 text-success"
							aria-hidden
						/>
					) : (
						<Target className="size-4 shrink-0 text-ink-3" aria-hidden />
					)}
					<h3 className="type-panel truncate text-foreground">
						{getGoalName(goal)}
					</h3>
				</div>
				<p className="type-body-sm mt-1 text-ink-3">
					Target {direction} <span className="type-data">{target}</span>
					{goal.periodStart ? ' this week' : ''}
				</p>
			</div>

			{current === null ? (
				<p className="type-body-sm text-ink-3">{getMissingCopy(goal)}</p>
			) : (
				<div className="space-y-2">
					<div className="flex flex-wrap items-baseline justify-between gap-2">
						<span className="type-data-emphatic text-foreground">
							{current}
						</span>
						<span
							className={
								goal.achieved
									? 'type-body-sm text-success'
									: 'type-body-sm text-ink-3'
							}
						>
							{goal.achieved
								? 'Target reached'
								: goal.direction === 'AT_MOST'
									? `${remaining} above target`
									: `${remaining} to go`}
						</span>
					</div>
					{goal.progressPercent !== null ? (
						<Progress
							value={goal.progressPercent}
							aria-label={`${getGoalName(goal)} progress`}
							className={
								goal.achieved
									? '[&_[data-slot=progress-indicator]]:bg-success-strong'
									: undefined
							}
						/>
					) : null}
				</div>
			)}
		</li>
	)
}

export function PersonalGoals({
	data,
	weightUnit,
	isPending,
	isError,
	onRetry,
}: PersonalGoalsProps) {
	return (
		<section aria-labelledby="personal-goals" className="space-y-4">
			<div className="rule-heading flex flex-wrap items-end justify-between gap-3 pb-4">
				<div>
					<h2 id="personal-goals" className="type-section text-foreground">
						Personal goals
					</h2>
					<p className="type-body-sm mt-1 text-ink-3">
						Private targets calculated from your current training data.
					</p>
				</div>
				<Button asChild variant="outline" size="sm">
					<Link href="/settings">Manage goals</Link>
				</Button>
			</div>

			{isPending ? (
				<div className="space-y-3" aria-label="Loading personal goals">
					<Skeleton className="h-20" />
					<Skeleton className="h-20" />
				</div>
			) : isError ? (
				<div role="alert" className="border border-rule bg-surface p-6">
					<p className="type-panel text-foreground">Goals are unavailable</p>
					<p className="type-body-sm mt-1 text-ink-3">
						We could not calculate your current targets. Try again.
					</p>
					<Button
						type="button"
						variant="outline"
						className="mt-4"
						onClick={onRetry}
					>
						<RefreshCw className="size-4" aria-hidden />
						Retry Goals
					</Button>
				</div>
			) : !data?.goals.length ? (
				<div className="border border-dashed border-rule bg-surface p-6 text-center">
					<Target className="mx-auto size-6 text-ink-3" aria-hidden />
					<p className="type-panel mt-3 text-foreground">
						No measurable goals yet
					</p>
					<p className="type-body-sm mt-1 text-ink-3">
						Create a private target in Settings to track it here.
					</p>
				</div>
			) : (
				<ul className="rule-list">
					{data.goals.map(goal => (
						<GoalRow key={goal.id} goal={goal} weightUnit={weightUnit} />
					))}
				</ul>
			)}
		</section>
	)
}
