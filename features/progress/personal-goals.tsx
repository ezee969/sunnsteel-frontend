'use client'

import type {
	MeasurableGoalType,
	PersonalGoalProgress,
	PersonalGoalsResponse,
	WeightUnit,
} from '@sunsteel/contracts'
import { CheckCircle2, RefreshCw, Target } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import type { Locale } from '@/i18n/config'
import { numberFormatter } from '@/i18n/date-locale'
import type { Translator } from '@/i18n/translator'
import { getMeasurableGoalLabel } from '@/lib/utils/measurable-goals'
import { formatWeightAmount, getWeightUnitLabel } from '@/lib/utils/weight-unit'

interface PersonalGoalsProps {
	data?: PersonalGoalsResponse
	weightUnit: WeightUnit
	isPending: boolean
	isError: boolean
	onRetry: () => void
}

const NUMBER_FORMATTER = (locale: Locale) =>
	numberFormatter(locale, {
		maximumFractionDigits: 1,
	})

function formatGoalValue(
	value: number,
	type: MeasurableGoalType,
	weightUnit: WeightUnit,
	locale: Locale,
	t: Translator<'progress.goals'>,
): string {
	if (
		type === 'WEEKLY_VOLUME' ||
		type === 'EXERCISE_ESTIMATED_1RM' ||
		type === 'BODY_WEIGHT'
	) {
		return `${formatWeightAmount(value, weightUnit, locale, 1)} ${getWeightUnitLabel(weightUnit)}`
	}
	const formatted = NUMBER_FORMATTER(locale).format(value)
	return t(type === 'WEEKLY_SESSIONS' ? 'sessions' : 'days', {
		count: value,
		value: formatted,
	})
}

function getGoalName(
	goal: PersonalGoalProgress,
	t: Translator<'progress.goals'>,
): string {
	return goal.type === 'EXERCISE_ESTIMATED_1RM' && goal.exercise
		? t('exerciseName', { exercise: goal.exercise.name })
		: getMeasurableGoalLabel(goal.type, t)
}

function getMissingCopy(
	goal: PersonalGoalProgress,
	t: Translator<'progress.goals'>,
): string {
	return t(
		goal.type === 'BODY_WEIGHT' ? 'missingBodyWeight' : 'missingEstimate',
	)
}

function GoalRow({
	goal,
	weightUnit,
}: {
	goal: PersonalGoalProgress
	weightUnit: WeightUnit
}) {
	const locale = useLocale() as Locale
	const t = useTranslations('progress.goals')
	const current =
		goal.currentValue === null
			? null
			: formatGoalValue(goal.currentValue, goal.type, weightUnit, locale, t)
	const target = formatGoalValue(
		goal.targetValue,
		goal.type,
		weightUnit,
		locale,
		t,
	)
	const remaining =
		goal.remainingValue === null
			? null
			: formatGoalValue(goal.remainingValue, goal.type, weightUnit, locale, t)
	const direction = goal.direction === 'AT_MOST' ? 'atMost' : 'atLeast'

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
						{getGoalName(goal, t)}
					</h3>
				</div>
				<p className="type-body-sm mt-1 text-ink-3">
					{t('targetPrefix', { direction })}{' '}
					<span className="type-data">{target}</span>
					{goal.periodStart ? ` ${t('thisWeek')}` : ''}
				</p>
			</div>

			{current === null ? (
				<p className="type-body-sm text-ink-3">{getMissingCopy(goal, t)}</p>
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
								? t('reached')
								: t(goal.direction === 'AT_MOST' ? 'aboveTarget' : 'toGo', {
										remaining: remaining ?? '',
									})}
						</span>
					</div>
					{goal.progressPercent !== null ? (
						<Progress
							value={goal.progressPercent}
							aria-label={t('progressLabel', { goal: getGoalName(goal, t) })}
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
	const t = useTranslations('progress.goals')
	return (
		<section aria-labelledby="personal-goals" className="space-y-4">
			<div className="rule-heading flex flex-wrap items-end justify-between gap-3 pb-4">
				<div>
					<h2 id="personal-goals" className="type-section text-foreground">
						{t('heading')}
					</h2>
					<p className="type-body-sm mt-1 text-ink-3">{t('description')}</p>
				</div>
				<Button asChild variant="outline" size="sm">
					<Link href="/settings/training">{t('manage')}</Link>
				</Button>
			</div>

			{isPending ? (
				<div className="space-y-3" aria-label={t('loading')}>
					<Skeleton className="h-20" />
					<Skeleton className="h-20" />
				</div>
			) : isError ? (
				<div role="alert" className="border border-rule bg-surface p-6">
					<p className="type-panel text-foreground">{t('errorTitle')}</p>
					<p className="type-body-sm mt-1 text-ink-3">{t('errorBody')}</p>
					<Button
						type="button"
						variant="outline"
						className="mt-4"
						onClick={onRetry}
					>
						<RefreshCw className="size-4" aria-hidden />
						{t('retry')}
					</Button>
				</div>
			) : !data?.goals.length ? (
				<div className="border border-dashed border-rule bg-surface p-6 text-center">
					<Target className="mx-auto size-6 text-ink-3" aria-hidden />
					<p className="type-panel mt-3 text-foreground">{t('emptyTitle')}</p>
					<p className="type-body-sm mt-1 text-ink-3">{t('emptyBody')}</p>
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
