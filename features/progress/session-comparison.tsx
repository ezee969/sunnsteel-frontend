'use client'

import type {
	SessionComparisonResponse,
	SessionComparisonSet,
	WeightUnit,
} from '@sunsteel/contracts'
import { GitCompareArrows, NotebookPen, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
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
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import type { Translator } from '@/i18n/translator'
import { buildSessionExerciseComparisons } from '@/lib/utils/session-comparison'
import { formatDuration } from '@/lib/utils/time-format.utils'
import { formatWeightAmount, getWeightUnitLabel } from '@/lib/utils/weight-unit'

const SESSION_DATE_FORMATTER = (locale: Locale) =>
	dateFormatter(locale, {
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
	const t = useTranslations('progress.sessionComparison')
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
				<p className="type-body-sm text-ink-3 sm:hidden">{t('latest')}</p>
				<p className="type-data type-data-strong text-foreground">{latest}</p>
			</div>
			<div role="cell">
				<p className="type-body-sm text-ink-3 sm:hidden">{t('previous')}</p>
				<p className="type-data text-ink-2">{previous}</p>
			</div>
			<div role="cell" className="col-span-2 sm:col-span-1 sm:text-right">
				<p className="type-body-sm text-ink-3 sm:hidden">{t('change')}</p>
				<p className="type-data text-ink-2">{delta}</p>
			</div>
		</div>
	)
}

type T = Translator<'progress.sessionComparison'>

function formatSignedDuration(value: number, t: T) {
	if (value === 0) return t('noChange')
	return `${value > 0 ? '+' : '−'}${formatDuration(Math.abs(value))}`
}

function formatSignedNumber(
	value: number,
	format: (value: number) => string,
	t: T,
) {
	if (value === 0) return t('noChange')
	return `${value > 0 ? '+' : '−'}${format(Math.abs(value))}`
}

function formatSet(
	set: SessionComparisonSet | null,
	weightUnit: WeightUnit,
	locale: Locale,
	t: T,
) {
	if (!set) return t('notCompleted')
	const performance =
		set.weightKg != null && set.weightKg > 0
			? `${formatWeightAmount(set.weightKg, weightUnit, locale)} ${getWeightUnitLabel(weightUnit)} × ${set.reps}`
			: t('bodyweight', { reps: set.reps })
	return set.rpe != null
		? t('withRpe', { performance, rpe: set.rpe })
		: performance
}

export function SessionComparison({
	data,
	selectedRoutineDayId,
	isPending,
	isError,
	onRoutineDayChange,
	onRetry,
}: SessionComparisonProps) {
	const locale = useLocale() as Locale
	const t = useTranslations('progress.sessionComparison')
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
		`${formatWeightAmount(valueKg, weightUnit, locale)} ${unitLabel}`

	return (
		<section aria-labelledby="session-comparison" className="space-y-4">
			<div className="rule-row flex items-start gap-2 pb-2">
				<GitCompareArrows className="mt-0.5 size-4 text-ink-3" aria-hidden />
				<div>
					<h2 id="session-comparison" className="type-section text-foreground">
						{t('title')}
					</h2>
					<p className="type-body-sm mt-1 max-w-2xl text-ink-3">
						{t('description')}
					</p>
				</div>
			</div>
			<div className="space-y-4">
				{isPending && !data ? (
					<div className="space-y-3" aria-label={t('loading')}>
						<Skeleton className="h-16" />
						<Skeleton className="h-56" />
					</div>
				) : isError || !data ? (
					<div role="alert" className="border border-rule bg-surface p-5">
						<p className="type-panel text-foreground">{t('errorTitle')}</p>
						<p className="type-body-sm mt-1 text-ink-3">{t('errorBody')}</p>
						<Button
							variant="outline"
							size="sm"
							className="mt-3"
							onClick={onRetry}
						>
							<RefreshCw aria-hidden />
							{t('retry')}
						</Button>
					</div>
				) : data.routineDays.length === 0 || !latest ? (
					<div className="border border-dashed border-rule bg-surface p-6 text-center">
						<p className="type-panel text-foreground">{t('emptyTitle')}</p>
						<p className="type-body-sm mt-1 text-ink-3">{t('emptyBody')}</p>
					</div>
				) : (
					<>
						<div className="w-full sm:max-w-lg">
							<label
								htmlFor="comparison-routine-day"
								className="type-label text-ink-3"
							>
								{t('routineDay')}
							</label>
							<Select value={selectedValue} onValueChange={onRoutineDayChange}>
								<SelectTrigger
									id="comparison-routine-day"
									className="mt-2 w-full"
								>
									<SelectValue placeholder={t('chooseDay')} />
								</SelectTrigger>
								<SelectContent>
									{data.routineDays.map(day => (
										<SelectItem key={day.routineDayId} value={day.routineDayId}>
											{t('dayOption', {
												routine: day.routineName,
												day: day.dayName || t('workoutDay'),
												count: day.completedSessionCount,
											})}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-px bg-rule-faint sm:grid-cols-2">
							<div className="bg-surface p-4 sm:p-5">
								<p className="type-label text-ink-3">{t('latest')}</p>
								<p className="type-panel mt-1 text-foreground">
									{latest.routineName}
								</p>
								<p className="type-body-sm mt-1 text-ink-3">
									{latest.dayName || t('workoutDay')} ·{' '}
									<time dateTime={latest.endedAt}>
										{SESSION_DATE_FORMATTER(locale).format(
											new Date(latest.endedAt),
										)}
									</time>
								</p>
								<Button variant="link" className="mt-2 h-auto p-0" asChild>
									<Link href={`/workouts/sessions/${latest.sessionId}`}>
										{t('openRecap')}
									</Link>
								</Button>
							</div>
							<div className="bg-surface p-4 sm:p-5">
								<p className="type-label text-ink-3">{t('previous')}</p>
								{previous ? (
									<>
										<p className="type-panel mt-1 text-foreground">
											{previous.routineName}
										</p>
										<p className="type-body-sm mt-1 text-ink-3">
											{previous.dayName || t('workoutDay')} ·{' '}
											<time dateTime={previous.endedAt}>
												{SESSION_DATE_FORMATTER(locale).format(
													new Date(previous.endedAt),
												)}
											</time>
										</p>
										<Button variant="link" className="mt-2 h-auto p-0" asChild>
											<Link href={`/workouts/sessions/${previous.sessionId}`}>
												{t('openRecap')}
											</Link>
										</Button>
									</>
								) : (
									<p className="type-body-sm mt-1 text-ink-3">{t('unlock')}</p>
								)}
							</div>
						</div>

						<div role="table" aria-label={t('metricTable')}>
							<div
								role="row"
								className="hidden grid-cols-[minmax(0,1fr)_minmax(7rem,auto)_minmax(7rem,auto)_minmax(7rem,auto)] gap-4 border-b border-rule-faint pb-2 sm:grid"
							>
								<span role="columnheader" className="type-label text-ink-3">
									{t('metric')}
								</span>
								<span role="columnheader" className="type-label text-ink-3">
									{t('latest')}
								</span>
								<span role="columnheader" className="type-label text-ink-3">
									{t('previous')}
								</span>
								<span
									role="columnheader"
									className="type-label text-right text-ink-3"
								>
									{t('change')}
								</span>
							</div>
							<MetricComparison
								label={t('duration')}
								latest={formatDuration(latest.durationSec)}
								previous={
									previous
										? formatDuration(previous.durationSec)
										: t('notAvailable')
								}
								delta={
									previous
										? formatSignedDuration(
												latest.durationSec - previous.durationSec,
												t,
											)
										: '—'
								}
							/>
							<MetricComparison
								label={t('loadVolume')}
								latest={formatVolume(latest.totalVolumeKg)}
								previous={
									previous
										? formatVolume(previous.totalVolumeKg)
										: t('notAvailable')
								}
								delta={
									previous
										? formatSignedNumber(
												latest.totalVolumeKg - previous.totalVolumeKg,
												formatVolume,
												t,
											)
										: '—'
								}
							/>
							<MetricComparison
								label={t('completedSets')}
								latest={String(latest.completedSets)}
								previous={
									previous ? String(previous.completedSets) : t('notAvailable')
								}
								delta={
									previous
										? formatSignedNumber(
												latest.completedSets - previous.completedSets,
												String,
												t,
											)
										: '—'
								}
							/>
						</div>

						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<NotebookPen className="size-4 text-ink-3" aria-hidden />
								<h3 className="type-panel text-foreground">
									{t('sessionNotes')}
								</h3>
							</div>
							<div className="grid gap-px bg-rule-faint sm:grid-cols-2">
								<div className="bg-surface py-3 sm:pr-4">
									<p className="type-body-sm text-ink-3">{t('latest')}</p>
									<p className="type-body-sm mt-1 whitespace-pre-wrap text-ink-2">
										{latest.notes?.trim() || t('noSessionNote')}
									</p>
								</div>
								<div className="bg-surface py-3 sm:pl-4">
									<p className="type-body-sm text-ink-3">{t('previous')}</p>
									<p className="type-body-sm mt-1 whitespace-pre-wrap text-ink-2">
										{previous
											? previous.notes?.trim() || t('noSessionNote')
											: t('notAvailablePeriod')}
									</p>
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<h3 className="type-panel text-foreground">
								{t('exerciseDetails')}
							</h3>
							<p className="type-body-sm text-ink-3">
								{t('exerciseDetailsBody')}
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
													{t('exerciseCounts', {
														latest: exercise.latest?.sets.length ?? 0,
														previous: exercise.previous?.sets.length ?? 0,
														status:
															previous && !exercise.previous
																? 'added'
																: previous && !exercise.latest
																	? 'removed'
																	: 'none',
													})}
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
																{t('setNumber', { number: set.setNumber })}
															</p>
															<div>
																<p className="type-body-sm text-ink-3">
																	{t('latest')}
																</p>
																<p className="type-data text-foreground">
																	{formatSet(set.latest, weightUnit, locale, t)}
																</p>
															</div>
															<div>
																<p className="type-body-sm text-ink-3">
																	{t('previous')}
																</p>
																<p className="type-data text-ink-2">
																	{previous
																		? formatSet(
																				set.previous,
																				weightUnit,
																				locale,
																				t,
																			)
																		: t('notAvailable')}
																</p>
															</div>
														</li>
													))}
												</ol>
											) : (
												<p className="type-body-sm text-ink-3">{t('noSets')}</p>
											)}
										</AccordionContent>
									</AccordionItem>
								))}
							</Accordion>
						</div>
					</>
				)}
			</div>
		</section>
	)
}
