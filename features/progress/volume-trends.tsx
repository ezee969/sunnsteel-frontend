'use client'

import type { VolumeTrendResponse } from '@sunsteel/contracts'
import { BarChart3, RefreshCw } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

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
import { dateFormatter, intlLocale, numberFormatter } from '@/i18n/date-locale'
import type { MessageKey } from '@/i18n/translator'
import {
	getSelectedVolumeTrend,
	getVolumeBarPercent,
	getVolumeTrendSeries,
	getVolumeTrendSummary,
	VOLUME_TREND_WEEK_OPTIONS,
	type VolumeTrendScope,
	type VolumeTrendWeeks,
} from '@/lib/utils/volume-trend'
import {
	formatWeightAmount,
	getWeightUnitLabel,
	kilogramsToDisplayWeight,
} from '@/lib/utils/weight-unit'

const SCOPE_KEYS = {
	overall: 'scopeOverall',
	muscle: 'scopeMuscle',
	routine: 'scopeRoutine',
	exercise: 'scopeExercise',
} as const satisfies Record<VolumeTrendScope, MessageKey<'progress.volume'>>

const SCOPE_OPTIONS = Object.keys(SCOPE_KEYS) as VolumeTrendScope[]

const WEEK_FORMATTER = (locale: Locale) =>
	dateFormatter(locale, {
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC',
	})
const SET_FORMATTER = (locale: Locale) =>
	numberFormatter(locale, {
		maximumFractionDigits: 1,
	})
const COMPACT_FORMATTER = (locale: Locale) =>
	numberFormatter(locale, {
		notation: 'compact',
		maximumFractionDigits: 1,
	})

interface VolumeTrendsProps {
	data?: VolumeTrendResponse
	weeks: VolumeTrendWeeks
	isPending: boolean
	isError: boolean
	onWeeksChange: (weeks: VolumeTrendWeeks) => void
	onRetry: () => void
}

export function VolumeTrends({
	data,
	weeks,
	isPending,
	isError,
	onWeeksChange,
	onRetry,
}: VolumeTrendsProps) {
	const locale = useLocale() as Locale
	const t = useTranslations('progress.volume')
	const tMuscles = useTranslations('routines.muscles')
	const [scope, setScope] = useState<VolumeTrendScope>('overall')
	const [selectedId, setSelectedId] = useState<string>()
	const weightUnit = useWeightUnit()
	const unitLabel = getWeightUnitLabel(weightUnit)
	const series = useMemo(
		() =>
			data && scope !== 'overall'
				? getVolumeTrendSeries(data, scope, tMuscles)
				: [],
		[data, scope, tMuscles],
	)
	const selection = useMemo(
		() =>
			data ? getSelectedVolumeTrend(data, scope, selectedId, tMuscles) : null,
		[data, scope, selectedId, tMuscles],
	)
	const summary = useMemo(
		() => (selection ? getVolumeTrendSummary(selection.points) : null),
		[selection],
	)
	const formatWeek = (value: string) =>
		WEEK_FORMATTER(locale).format(new Date(`${value}T00:00:00.000Z`))
	const formatVolume = (valueKg: number) =>
		`${formatWeightAmount(valueKg, weightUnit, locale)} ${unitLabel}`
	const formatCompactVolume = (valueKg: number) =>
		`${COMPACT_FORMATTER(locale).format(
			kilogramsToDisplayWeight(valueKg, weightUnit),
		)} ${unitLabel}`
	const hasCompletedWork = data?.overall.some(point => point.completedSets > 0)
	// The scope's own name, lower-cased for the two sentences that name it.
	const scopeLabel = t(SCOPE_KEYS[scope]).toLocaleLowerCase(intlLocale(locale))

	return (
		<section aria-labelledby="volume-trends" className="space-y-4">
			<div className="rule-row flex flex-wrap items-end justify-between gap-3 pb-2">
				<div className="flex items-start gap-2">
					<BarChart3 className="mt-0.5 size-4 text-honour" aria-hidden />
					<div>
						<h2 id="volume-trends" className="type-section text-foreground">
							{t('heading')}
						</h2>
						<p className="type-body-sm mt-1 max-w-2xl text-ink-3">
							{t('description')}
						</p>
					</div>
				</div>
				<div role="group" aria-label={t('rangeLabel')} className="flex gap-1">
					{VOLUME_TREND_WEEK_OPTIONS.map(option => (
						<Button
							key={option}
							type="button"
							size="sm"
							variant={weeks === option ? 'secondary' : 'ghost'}
							aria-pressed={weeks === option}
							onClick={() => onWeeksChange(option)}
						>
							{t('weekOption', { weeks: option })}
						</Button>
					))}
				</div>
			</div>
			<div id="progress-volume-body" className="space-y-4">
				{isPending ? (
					<div className="space-y-3" aria-label={t('loading')}>
						<Skeleton className="h-20" />
						<Skeleton className="h-72" />
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
				) : !hasCompletedWork ? (
					<div className="border border-dashed border-rule bg-surface p-6 text-center">
						<p className="type-panel text-foreground">{t('emptyTitle')}</p>
						<p className="type-body-sm mt-1 text-ink-3">{t('emptyBody')}</p>
					</div>
				) : (
					<>
						<div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
							<div
								role="group"
								aria-label={t('breakdownLabel')}
								className="flex flex-wrap gap-1"
							>
								{SCOPE_OPTIONS.map(option => (
									<Button
										key={option}
										type="button"
										size="sm"
										variant={scope === option ? 'secondary' : 'ghost'}
										aria-pressed={scope === option}
										onClick={() => setScope(option)}
									>
										{t(SCOPE_KEYS[option])}
									</Button>
								))}
							</div>

							{scope !== 'overall' ? (
								<div className="w-full lg:max-w-sm">
									<label
										htmlFor="volume-series"
										className="type-label text-ink-3"
									>
										{t(SCOPE_KEYS[scope])}
									</label>
									<Select
										value={selection?.id ?? ''}
										onValueChange={setSelectedId}
										disabled={series.length === 0}
									>
										<SelectTrigger id="volume-series" className="mt-2 w-full">
											<SelectValue
												placeholder={t('seriesPlaceholder', {
													scope: scopeLabel,
												})}
											/>
										</SelectTrigger>
										<SelectContent>
											{series.map(item => (
												<SelectItem key={item.id} value={item.id}>
													{item.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							) : null}
						</div>

						{scope !== 'overall' && series.length === 0 ? (
							<div className="border border-dashed border-rule bg-surface p-5 text-center">
								<p className="type-body-sm text-ink-3">
									{t('seriesEmpty', { scope: scopeLabel })}
								</p>
							</div>
						) : null}

						{selection?.id && summary ? (
							<>
								<div className="grid gap-px bg-rule-faint sm:grid-cols-3">
									<div className="bg-surface p-4">
										<p className="type-label text-ink-3">
											{t('selectedRange')}
										</p>
										<p className="type-data type-data-strong mt-1 text-foreground">
											{formatVolume(summary.totalVolumeKg)}
										</p>
									</div>
									<div className="bg-surface p-4">
										<p className="type-label text-ink-3">
											{t('setsLabel', { scope })}
										</p>
										<p className="type-data type-data-strong mt-1 text-foreground">
											{SET_FORMATTER(locale).format(summary.completedSets)}
										</p>
									</div>
									<div className="bg-surface p-4">
										<p className="type-label text-ink-3">
											{t('latestFullWeek')}
										</p>
										<p className="type-data type-data-strong mt-1 text-foreground">
											{summary.latestCompleteWeek
												? formatVolume(summary.latestCompleteWeek.volumeKg)
												: t('notAvailable')}
										</p>
										{summary.changePercent !== null ? (
											<p className="type-label mt-1 text-ink-3">
												{t('changeVsPrior', {
													change: `${summary.changePercent >= 0 ? '+' : ''}${Math.round(summary.changePercent)}`,
												})}
											</p>
										) : summary.previousCompleteWeek ? (
											<p className="type-label mt-1 text-ink-3">
												{t('priorWeekEmpty')}
											</p>
										) : null}
									</div>
								</div>

								<div className="max-w-full overflow-x-auto border border-rule bg-surface p-4 sm:p-5">
									<div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
										<h3 className="type-panel text-foreground">
											{selection.name}
										</h3>
										<p className="type-label text-ink-3">
											{t('chartUnit', { unit: unitLabel })}
										</p>
									</div>
									<ol
										className="flex h-56 items-stretch gap-3"
										style={{
											minWidth: `${Math.max(selection.points.length * 72, 320)}px`,
										}}
										aria-label={t('chartLabel', { name: selection.name })}
									>
										{selection.points.map(point => (
											<li
												key={point.weekStart}
												className="grid min-w-0 flex-1 grid-rows-[auto_1fr_auto] gap-2 text-center"
												aria-label={t('pointLabel', {
													week: formatWeek(point.weekStart),
													volume: formatVolume(point.volumeKg),
													sets: SET_FORMATTER(locale).format(
														point.completedSets,
													),
													noun: t('setsNoun', { scope }),
													partial: point.isCurrentWeek ? 'yes' : 'no',
												})}
											>
												<span className="type-label truncate text-ink-3">
													{formatCompactVolume(point.volumeKg)}
												</span>
												<div className="flex min-h-0 items-end justify-center border-b border-rule-faint bg-surface-sunk px-2">
													<div
														className="w-full bg-honour-strong transition-[height] motion-reduce:transition-none"
														style={{
															height: `${getVolumeBarPercent(point.volumeKg, selection.points)}%`,
														}}
														title={t('pointTitle', {
															week: formatWeek(point.weekStart),
															volume: formatVolume(point.volumeKg),
															sets: SET_FORMATTER(locale).format(
																point.completedSets,
															),
															partial: point.isCurrentWeek ? 'yes' : 'no',
														})}
													/>
												</div>
												<time
													dateTime={point.weekStart}
													className="type-label text-ink-3"
												>
													{formatWeek(point.weekStart)}
													{point.isCurrentWeek ? (
														<span className="block text-honour">
															{t('currentWeek')}
														</span>
													) : null}
												</time>
											</li>
										))}
									</ol>
								</div>
							</>
						) : null}

						<p className="type-body-sm text-ink-3">{t('note')}</p>
					</>
				)}
			</div>
		</section>
	)
}
