'use client'

import type { MuscleGroupHeatmapResponse } from '@sunsteel/contracts'
import { Activity } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { EmptyModule } from '@/components/layout/empty-module'
import { Explanation } from '@/components/layout/explanation'
import { InlineError } from '@/components/layout/inline-error'
import {
	LockedModule,
	LockedOptionLabel,
} from '@/components/layout/locked-module'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleOption, ToggleRow } from '@/components/ui/toggle-row'
import type { Locale } from '@/i18n/config'
import { dateFormatter, numberFormatter } from '@/i18n/date-locale'
import { cn } from '@/lib/utils'
import { getFriendlyMuscleName } from '@/lib/utils/muscle-groups'
import {
	buildMuscleHeatmapRows,
	getMuscleHeatmapLevel,
	getTopMuscleHeatmapRows,
	MUSCLE_HEATMAP_WEEK_OPTIONS,
	type MuscleHeatmapWeeks,
} from '@/lib/utils/muscle-heatmap'

const CELL_LEVEL_CLASSES = [
	'bg-rule-faint',
	'bg-honour/20',
	'bg-honour/40',
	'bg-honour/70',
	'bg-honour',
] as const

const NUMBER_FORMATTER = (locale: Locale) =>
	numberFormatter(locale, {
		maximumFractionDigits: 1,
	})
const WEEK_FORMATTER = (locale: Locale) =>
	dateFormatter(locale, {
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC',
	})

interface MuscleGroupHeatmapProps {
	data?: MuscleGroupHeatmapResponse
	weeks: MuscleHeatmapWeeks
	isPending: boolean
	isError: boolean
	onWeeksChange: (weeks: MuscleHeatmapWeeks) => void
	onRetry: () => void
	/** BILL-02: the plan's limit on weeks; a longer window shows locked. */
	maxWeeks?: number | null
}

export function MuscleGroupHeatmap({
	data,
	weeks,
	isPending,
	isError,
	onWeeksChange,
	onRetry,
	maxWeeks = null,
}: MuscleGroupHeatmapProps) {
	const locale = useLocale() as Locale
	const t = useTranslations('progress.muscles')
	const tMuscles = useTranslations('routines.muscles')
	const formatSets = (value: number) => NUMBER_FORMATTER(locale).format(value)
	const formatWeek = (value: string) =>
		WEEK_FORMATTER(locale).format(new Date(`${value}T00:00:00.000Z`))
	const rows = useMemo(() => (data ? buildMuscleHeatmapRows(data) : []), [data])
	const topMuscles = useMemo(() => getTopMuscleHeatmapRows(rows), [rows])

	return (
		<section aria-labelledby="muscle-distribution" className="space-y-4">
			<div className="rule-row flex flex-wrap items-end justify-between gap-3 pb-2">
				<div className="flex items-start gap-2">
					<Activity className="mt-0.5 size-4 text-honour" aria-hidden />
					<div>
						<h2
							id="muscle-distribution"
							className="type-section text-foreground"
						>
							{t('heading')}
						</h2>
						<p className="type-body-sm mt-1 max-w-2xl text-ink-3">
							{t('description')}
						</p>
					</div>
				</div>
				<ToggleRow aria-label={t('rangeLabel')}>
					{MUSCLE_HEATMAP_WEEK_OPTIONS.map(option => (
						<ToggleOption
							key={option}
							pressed={weeks === option}
							onClick={() => onWeeksChange(option)}
						>
							{maxWeeks != null && option > maxWeeks ? (
								<LockedOptionLabel label={t('weekOption', { weeks: option })} />
							) : (
								t('weekOption', { weeks: option })
							)}
						</ToggleOption>
					))}
				</ToggleRow>
			</div>
			<div id="progress-muscles-body" className="space-y-4">
				{maxWeeks != null && weeks > maxWeeks ? (
					<LockedModule feature="MUSCLE_HISTORY_LONG" />
				) : isPending ? (
					<div
						role="status"
						aria-busy="true"
						className="space-y-3"
						aria-label={t('loading')}
					>
						<Skeleton className="h-20" />
						<Skeleton className="h-96" />
					</div>
				) : isError || !data ? (
					<InlineError
						title={t('errorTitle')}
						message={t('errorBody')}
						onRetry={onRetry}
					/>
				) : data.peakWeightedSets === 0 ? (
					<EmptyModule title={t('emptyTitle')} description={t('emptyBody')} />
				) : (
					<>
						<div className="grid gap-px bg-rule-faint sm:grid-cols-3">
							{topMuscles.map((row, index) => (
								<div key={row.muscle} className="bg-surface p-4">
									<p className="type-label text-ink-3">
										{index === 0
											? t('mostTrained')
											: t('rank', { position: index + 1 })}
									</p>
									<p className="type-panel mt-1 text-foreground">
										{getFriendlyMuscleName(row.muscle, tMuscles)}
									</p>
									<p className="type-data mt-1 text-ink-3">
										{t('weightedSets', {
											sets: formatSets(row.totalWeightedSets),
										})}
									</p>
								</div>
							))}
						</div>

						<div className="max-w-full overflow-x-auto border border-rule bg-surface">
							<table
								className="w-full min-w-[44rem] border-collapse"
								aria-label={t('tableLabel')}
							>
								<thead>
									<tr className="border-b border-rule">
										<th
											scope="col"
											className="type-label sticky left-0 z-10 min-w-32 bg-surface px-3 py-3 text-left text-ink-3"
										>
											{t('muscleColumn')}
										</th>
										{data.weeks.map(week => (
											<th
												key={week.weekStart}
												scope="col"
												className="type-label min-w-16 px-2 py-3 text-center text-ink-3"
											>
												<time dateTime={week.weekStart}>
													{formatWeek(week.weekStart)}
												</time>
												{week.isCurrentWeek ? (
													<span className="mt-1 block text-honour">
														{t('currentWeek')}
													</span>
												) : null}
											</th>
										))}
									</tr>
								</thead>
								<tbody className="divide-y divide-rule-faint">
									{rows.map(row => (
										<tr key={row.muscle}>
											<th
												scope="row"
												className="type-body-sm sticky left-0 z-10 bg-surface px-3 py-2 text-left font-medium text-foreground"
											>
												{getFriendlyMuscleName(row.muscle, tMuscles)}
											</th>
											{row.weightedSets.map((value, index) => {
												const level = getMuscleHeatmapLevel(
													value,
													data.peakWeightedSets,
												)
												return (
													<td
														key={data.weeks[index].weekStart}
														className="p-1 text-center"
													>
														<span
															className="type-data flex min-h-9 items-center justify-center gap-1.5 bg-surface-sunk px-2 text-foreground"
															title={t('cellTitle', {
																muscle: getFriendlyMuscleName(
																	row.muscle,
																	tMuscles,
																),
																week: formatWeek(data.weeks[index].weekStart),
																sets: formatSets(value),
															})}
														>
															<span
																className={cn(
																	'size-3 border border-rule-faint',
																	CELL_LEVEL_CLASSES[level],
																)}
																aria-hidden
															/>
															{value > 0 ? formatSets(value) : '—'}
														</span>
													</td>
												)
											})}
										</tr>
									))}
								</tbody>
								<tfoot className="border-t border-rule">
									<tr>
										<th
											scope="row"
											className="type-label sticky left-0 z-10 bg-surface px-3 py-3 text-left text-ink-3"
										>
											{t('assignedTotal')}
										</th>
										{data.weeks.map(week => (
											<td
												key={week.weekStart}
												className="type-data px-2 py-3 text-center text-foreground"
											>
												{formatSets(week.totalWeightedSets)}
											</td>
										))}
									</tr>
								</tfoot>
							</table>
						</div>

						<div className="type-body-sm flex flex-wrap items-center justify-between gap-3 text-ink-3">
							<Explanation summary={t('noteSummary')}>
								<p>{t('note')}</p>
							</Explanation>
							<div
								className="flex items-center gap-1"
								aria-label={t('intensityLabel')}
							>
								<span className="mr-1">{t('less')}</span>
								{CELL_LEVEL_CLASSES.slice(1).map(className => (
									<span
										key={className}
										className={cn('size-4 border border-rule-faint', className)}
										aria-hidden
									/>
								))}
								<span className="ml-1">{t('more')}</span>
							</div>
						</div>
					</>
				)}
			</div>
		</section>
	)
}
