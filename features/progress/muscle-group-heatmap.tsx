'use client'

import type { MuscleGroupHeatmapResponse } from '@sunsteel/contracts'
import { Activity, RefreshCw } from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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

const NUMBER_FORMATTER = new Intl.NumberFormat(undefined, {
	maximumFractionDigits: 1,
})
const WEEK_FORMATTER = new Intl.DateTimeFormat(undefined, {
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
}

const formatSets = (value: number) => NUMBER_FORMATTER.format(value)
const formatWeek = (value: string) =>
	WEEK_FORMATTER.format(new Date(`${value}T00:00:00.000Z`))

export function MuscleGroupHeatmap({
	data,
	weeks,
	isPending,
	isError,
	onWeeksChange,
	onRetry,
}: MuscleGroupHeatmapProps) {
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
							Muscle distribution
						</h2>
						<p className="type-body-sm mt-1 max-w-2xl text-ink-3">
							Weekly completed-set emphasis across primary and secondary
							muscles.
						</p>
					</div>
				</div>
				<div role="group" aria-label="Heatmap range" className="flex gap-1">
					{MUSCLE_HEATMAP_WEEK_OPTIONS.map(option => (
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
				<div className="space-y-3" aria-label="Loading muscle distribution">
					<Skeleton className="h-20" />
					<Skeleton className="h-96" />
				</div>
			) : isError || !data ? (
				<div role="alert" className="border border-rule bg-surface p-5">
					<p className="type-panel text-foreground">
						Muscle distribution is unavailable
					</p>
					<p className="type-body-sm mt-1 text-ink-3">
						We could not load the weekly training map. Try again.
					</p>
					<Button
						variant="outline"
						size="sm"
						className="mt-3"
						onClick={onRetry}
					>
						<RefreshCw aria-hidden />
						Retry map
					</Button>
				</div>
			) : data.peakWeightedSets === 0 ? (
				<div className="border border-dashed border-rule bg-surface p-6 text-center">
					<p className="type-panel text-foreground">No completed sets yet</p>
					<p className="type-body-sm mt-1 text-ink-3">
						Finish a workout to start mapping your weekly muscle distribution.
					</p>
				</div>
			) : (
				<>
					<div className="grid gap-px bg-rule-faint sm:grid-cols-3">
						{topMuscles.map((row, index) => (
							<div key={row.muscle} className="bg-surface p-4">
								<p className="type-label text-ink-3">
									{index === 0 ? 'Most trained' : `Rank ${index + 1}`}
								</p>
								<p className="type-panel mt-1 text-foreground">
									{getFriendlyMuscleName(row.muscle)}
								</p>
								<p className="type-data mt-1 text-ink-3">
									{formatSets(row.totalWeightedSets)} weighted sets
								</p>
							</div>
						))}
					</div>

					<div className="max-w-full overflow-x-auto border border-rule bg-surface">
						<table
							className="w-full min-w-[44rem] border-collapse"
							aria-label="Weekly muscle-group training distribution"
						>
							<thead>
								<tr className="border-b border-rule">
									<th
										scope="col"
										className="type-label sticky left-0 z-10 min-w-32 bg-surface px-3 py-3 text-left text-ink-3"
									>
										Muscle
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
												<span className="mt-1 block text-honour">Current</span>
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
											{getFriendlyMuscleName(row.muscle)}
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
														title={`${getFriendlyMuscleName(row.muscle)}, week of ${formatWeek(data.weeks[index].weekStart)}: ${formatSets(value)} weighted sets`}
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
										Assigned total
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
						<p className="max-w-3xl">
							Each completed set contributes 1 to primary muscles and 0.5 to
							secondary muscles. The current week is still in progress.
						</p>
						<div
							className="flex items-center gap-1"
							aria-label="Heatmap intensity, less to more"
						>
							<span className="mr-1">Less</span>
							{CELL_LEVEL_CLASSES.slice(1).map(className => (
								<span
									key={className}
									className={cn('size-4 border border-rule-faint', className)}
									aria-hidden
								/>
							))}
							<span className="ml-1">More</span>
						</div>
					</div>
				</>
			)}
		</section>
	)
}
