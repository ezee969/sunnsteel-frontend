'use client'

import type { VolumeTrendResponse } from '@sunsteel/contracts'
import { BarChart3, RefreshCw } from 'lucide-react'
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

const SCOPE_OPTIONS: Array<{ value: VolumeTrendScope; label: string }> = [
	{ value: 'overall', label: 'Total' },
	{ value: 'muscle', label: 'Muscle' },
	{ value: 'routine', label: 'Routine' },
	{ value: 'exercise', label: 'Exercise' },
]

const WEEK_FORMATTER = new Intl.DateTimeFormat(undefined, {
	month: 'short',
	day: 'numeric',
	timeZone: 'UTC',
})
const SET_FORMATTER = new Intl.NumberFormat(undefined, {
	maximumFractionDigits: 1,
})
const COMPACT_FORMATTER = new Intl.NumberFormat(undefined, {
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

const formatWeek = (value: string) =>
	WEEK_FORMATTER.format(new Date(`${value}T00:00:00.000Z`))

export function VolumeTrends({
	data,
	weeks,
	isPending,
	isError,
	onWeeksChange,
	onRetry,
}: VolumeTrendsProps) {
	const [scope, setScope] = useState<VolumeTrendScope>('overall')
	const [selectedId, setSelectedId] = useState<string>()
	const weightUnit = useWeightUnit()
	const unitLabel = getWeightUnitLabel(weightUnit)
	const series = useMemo(
		() =>
			data && scope !== 'overall' ? getVolumeTrendSeries(data, scope) : [],
		[data, scope],
	)
	const selection = useMemo(
		() => (data ? getSelectedVolumeTrend(data, scope, selectedId) : null),
		[data, scope, selectedId],
	)
	const summary = useMemo(
		() => (selection ? getVolumeTrendSummary(selection.points) : null),
		[selection],
	)
	const formatVolume = (valueKg: number) =>
		`${formatWeightAmount(valueKg, weightUnit)} ${unitLabel}`
	const formatCompactVolume = (valueKg: number) =>
		`${COMPACT_FORMATTER.format(
			kilogramsToDisplayWeight(valueKg, weightUnit),
		)} ${unitLabel}`
	const hasCompletedWork = data?.overall.some(point => point.completedSets > 0)

	return (
		<section aria-labelledby="volume-trends" className="space-y-4">
			<div className="rule-row flex flex-wrap items-end justify-between gap-3 pb-2">
				<div className="flex items-start gap-2">
					<BarChart3 className="mt-0.5 size-4 text-honour" aria-hidden />
					<div>
						<h2 id="volume-trends" className="type-section text-foreground">
							Load volume
						</h2>
						<p className="type-body-sm mt-1 max-w-2xl text-ink-3">
							Compare external-load volume by week, muscle, routine, or
							exercise.
						</p>
					</div>
				</div>
				<div role="group" aria-label="Volume range" className="flex gap-1">
					{VOLUME_TREND_WEEK_OPTIONS.map(option => (
						<Button
							key={option}
							type="button"
							size="sm"
							variant={weeks === option ? 'secondary' : 'ghost'}
							aria-pressed={weeks === option}
							onClick={() => onWeeksChange(option)}
						>
							{option}W
						</Button>
					))}
				</div>
			</div>

			{isPending ? (
				<div className="space-y-3" aria-label="Loading load volume">
					<Skeleton className="h-20" />
					<Skeleton className="h-72" />
				</div>
			) : isError || !data ? (
				<div role="alert" className="border border-rule bg-surface p-5">
					<p className="type-panel text-foreground">
						Load volume is unavailable
					</p>
					<p className="type-body-sm mt-1 text-ink-3">
						We could not load your weekly volume. Try again.
					</p>
					<Button
						variant="outline"
						size="sm"
						className="mt-3"
						onClick={onRetry}
					>
						<RefreshCw aria-hidden />
						Retry volume
					</Button>
				</div>
			) : !hasCompletedWork ? (
				<div className="border border-dashed border-rule bg-surface p-6 text-center">
					<p className="type-panel text-foreground">No completed work yet</p>
					<p className="type-body-sm mt-1 text-ink-3">
						Finish a workout to start comparing weekly load volume.
					</p>
				</div>
			) : (
				<>
					<div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
						<div
							role="group"
							aria-label="Volume breakdown"
							className="flex flex-wrap gap-1"
						>
							{SCOPE_OPTIONS.map(option => (
								<Button
									key={option.value}
									type="button"
									size="sm"
									variant={scope === option.value ? 'secondary' : 'ghost'}
									aria-pressed={scope === option.value}
									onClick={() => setScope(option.value)}
								>
									{option.label}
								</Button>
							))}
						</div>

						{scope !== 'overall' ? (
							<div className="w-full lg:max-w-sm">
								<label
									htmlFor="volume-series"
									className="type-label text-ink-3"
								>
									{SCOPE_OPTIONS.find(option => option.value === scope)?.label}
								</label>
								<Select
									value={selection?.id ?? ''}
									onValueChange={setSelectedId}
									disabled={series.length === 0}
								>
									<SelectTrigger id="volume-series" className="mt-2 w-full">
										<SelectValue placeholder={`No ${scope} data`} />
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
								No {scope} volume is available in this range.
							</p>
						</div>
					) : null}

					{selection?.id && summary ? (
						<>
							<div className="grid gap-px bg-rule-faint sm:grid-cols-3">
								<div className="bg-surface p-4">
									<p className="type-label text-ink-3">Selected range</p>
									<p className="type-data type-data-strong mt-1 text-foreground">
										{formatVolume(summary.totalVolumeKg)}
									</p>
								</div>
								<div className="bg-surface p-4">
									<p className="type-label text-ink-3">
										{scope === 'muscle' ? 'Set equivalents' : 'Completed sets'}
									</p>
									<p className="type-data type-data-strong mt-1 text-foreground">
										{SET_FORMATTER.format(summary.completedSets)}
									</p>
								</div>
								<div className="bg-surface p-4">
									<p className="type-label text-ink-3">Latest full week</p>
									<p className="type-data type-data-strong mt-1 text-foreground">
										{summary.latestCompleteWeek
											? formatVolume(summary.latestCompleteWeek.volumeKg)
											: 'Not available'}
									</p>
									{summary.changePercent !== null ? (
										<p className="type-label mt-1 text-ink-3">
											{summary.changePercent >= 0 ? '+' : ''}
											{Math.round(summary.changePercent)}% vs prior full week
										</p>
									) : summary.previousCompleteWeek ? (
										<p className="type-label mt-1 text-ink-3">
											Prior full week had no load volume
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
										Weekly {unitLabel} × reps
									</p>
								</div>
								<ol
									className="flex h-56 items-stretch gap-3"
									style={{
										minWidth: `${Math.max(selection.points.length * 72, 320)}px`,
									}}
									aria-label={`${selection.name} weekly load volume`}
								>
									{selection.points.map(point => (
										<li
											key={point.weekStart}
											className="grid min-w-0 flex-1 grid-rows-[auto_1fr_auto] gap-2 text-center"
											aria-label={`${formatWeek(point.weekStart)}: ${formatVolume(point.volumeKg)}, ${SET_FORMATTER.format(point.completedSets)} ${scope === 'muscle' ? 'set equivalents' : 'completed sets'}${point.isCurrentWeek ? ', current partial week' : ''}`}
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
													title={`${formatWeek(point.weekStart)}: ${formatVolume(point.volumeKg)}, ${SET_FORMATTER.format(point.completedSets)} completed sets${point.isCurrentWeek ? ', current partial week' : ''}`}
												/>
											</div>
											<time
												dateTime={point.weekStart}
												className="type-label text-ink-3"
											>
												{formatWeek(point.weekStart)}
												{point.isCurrentWeek ? (
													<span className="block text-honour">Current</span>
												) : null}
											</time>
										</li>
									))}
								</ol>
							</div>
						</>
					) : null}

					<p className="type-body-sm text-ink-3">
						Volume is external load × repetitions, so it is a workload signal,
						not a strength score. Bodyweight sets remain in the set count but
						add zero load volume. Muscle volume uses the same 1.0 primary / 0.5
						secondary weighting as the distribution map; the current week is
						partial.
					</p>
				</>
			)}
		</section>
	)
}
