'use client'

import type {
	ProgressTimelineEventType,
	ProgressTimelineItem,
	WeightUnit,
} from '@sunsteel/contracts'
import { CalendarClock, History, RefreshCw } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import {
	getRecordTimelineExplanation,
	getRecordTimelinePerformanceLabel,
} from '@/lib/utils/progress-timeline'
import {
	getProgressionRuleExplanation,
	getProgressionSetPresentation,
} from '@/lib/utils/progression-change'
import { formatWeightAmount, getWeightUnitLabel } from '@/lib/utils/weight-unit'

const TIMELINE_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
	dateStyle: 'medium',
	timeStyle: 'short',
})

type TimelineFilter = ProgressTimelineEventType | undefined

const FILTERS: ReadonlyArray<{ label: string; value: TimelineFilter }> = [
	{ label: 'All', value: undefined },
	{ label: 'Records', value: 'PERSONAL_RECORD' },
	{ label: 'Progression', value: 'PROGRESSION_CHANGED' },
]

interface ProgressTimelineProps {
	items: ProgressTimelineItem[]
	filter: TimelineFilter
	isPending: boolean
	isError: boolean
	hasNextPage: boolean
	isFetchingNextPage: boolean
	onFilterChange: (filter: TimelineFilter) => void
	onRetry: () => void
	onLoadMore: () => void
}

function TimelineContext({ item }: { item: ProgressTimelineItem }) {
	return (
		<div className="type-body-sm flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-3">
			<span>{item.session.routineName}</span>
			<span aria-hidden>·</span>
			<span>{item.session.dayName || 'Workout day'}</span>
			<span aria-hidden>·</span>
			<time dateTime={item.occurredAt}>
				{TIMELINE_DATE_FORMATTER.format(new Date(item.occurredAt))}
			</time>
		</div>
	)
}

function RecordTimelineItem({
	item,
	weightUnit,
}: {
	item: Extract<ProgressTimelineItem, { type: 'PERSONAL_RECORD' }>
	weightUnit: WeightUnit
}) {
	return (
		<li className="rule-row grid gap-2 py-4 [content-visibility:auto] [contain-intrinsic-size:auto_8rem]">
			<div className="flex flex-wrap items-center gap-2">
				<Badge variant="outline">Record</Badge>
				<h3 className="type-panel text-foreground">{item.exerciseName}</h3>
			</div>
			<TimelineContext item={item} />
			<p className="type-body-sm text-ink-2">
				{getRecordTimelineExplanation(item, weightUnit)}
			</p>
			<div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
				<p className="type-data type-data-strong text-foreground">
					{getRecordTimelinePerformanceLabel(item, weightUnit)}
				</p>
				<p className="type-body-sm text-ink-3">
					Estimated 1RM{' '}
					{formatWeightAmount(item.current.estimated1rmKg, weightUnit, 2)}{' '}
					{getWeightUnitLabel(weightUnit)}
				</p>
			</div>
			<Button variant="link" className="h-auto w-fit p-0" asChild>
				<Link href={`/workouts/sessions/${item.session.sessionId}`}>
					Open session recap
				</Link>
			</Button>
		</li>
	)
}

function ProgressionTimelineItem({
	item,
	weightUnit,
}: {
	item: Extract<ProgressTimelineItem, { type: 'PROGRESSION_CHANGED' }>
	weightUnit: WeightUnit
}) {
	return (
		<li className="rule-row grid gap-2 py-4 [content-visibility:auto] [contain-intrinsic-size:auto_9rem]">
			<div className="flex flex-wrap items-center gap-2">
				<Badge variant="outline">Progression</Badge>
				<h3 className="type-panel text-foreground">{item.exerciseName}</h3>
			</div>
			<TimelineContext item={item} />
			<p className="type-body-sm text-ink-2">
				{getProgressionRuleExplanation(item.change, weightUnit)}
			</p>
			<details className="group border-y border-rule-faint py-2">
				<summary className="type-body-sm cursor-pointer text-ink-2 marker:text-ink-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
					Review {item.change.sets.length}{' '}
					{item.change.sets.length === 1 ? 'set change' : 'set changes'}
				</summary>
				<ul className="mt-2 divide-y divide-rule-faint">
					{item.change.sets.map(set => {
						const presentation = getProgressionSetPresentation(set, weightUnit)
						return (
							<li
								key={set.setNumber}
								className="type-body-sm flex flex-wrap justify-between gap-2 py-2 text-ink-2"
							>
								<span>
									{presentation.setLabel} · {presentation.repsLabel}
								</span>
								<span className="type-data text-foreground">
									{presentation.weightLabel}
								</span>
							</li>
						)
					})}
				</ul>
			</details>
			<Button variant="link" className="h-auto w-fit p-0" asChild>
				<Link href={`/workouts/sessions/${item.session.sessionId}`}>
					Open session recap
				</Link>
			</Button>
		</li>
	)
}

export function ProgressTimeline({
	items,
	filter,
	isPending,
	isError,
	hasNextPage,
	isFetchingNextPage,
	onFilterChange,
	onRetry,
	onLoadMore,
}: ProgressTimelineProps) {
	const weightUnit = useWeightUnit()

	return (
		<section aria-labelledby="progress-timeline" className="space-y-4">
			<div className="rule-row flex items-start gap-2 pb-2">
				<History className="mt-0.5 size-4 text-ink-3" aria-hidden />
				<div>
					<h2 id="progress-timeline" className="type-section text-foreground">
						Record &amp; progression timeline
					</h2>
					<p className="type-body-sm mt-1 max-w-2xl text-ink-3">
						See when your best sets and automatic prescriptions changed, with
						the reason preserved from that session.
					</p>
				</div>
			</div>

			<div
				role="group"
				aria-label="Timeline event type"
				className="flex flex-wrap gap-1"
			>
				{FILTERS.map(option => {
					const active = filter === option.value
					return (
						<Button
							key={option.label}
							type="button"
							size="sm"
							variant={active ? 'secondary' : 'ghost'}
							aria-pressed={active}
							onClick={() => onFilterChange(option.value)}
						>
							{option.label}
						</Button>
					)
				})}
			</div>

			{isPending && items.length === 0 ? (
				<div className="space-y-3" aria-label="Loading progress timeline">
					<Skeleton className="h-28" />
					<Skeleton className="h-28" />
					<Skeleton className="h-28" />
				</div>
			) : isError && items.length === 0 ? (
				<div role="alert" className="border border-rule bg-surface p-5">
					<p className="type-panel text-foreground">Timeline is unavailable</p>
					<p className="type-body-sm mt-1 text-ink-3">
						We could not load your records and prescription changes. Try again.
					</p>
					<Button
						variant="outline"
						size="sm"
						className="mt-3"
						onClick={onRetry}
					>
						<RefreshCw aria-hidden />
						Retry timeline
					</Button>
				</div>
			) : items.length === 0 ? (
				<div className="border border-dashed border-rule bg-surface p-6 text-center">
					<CalendarClock className="mx-auto size-7 text-ink-3" aria-hidden />
					<p className="type-panel mt-3 text-foreground">
						No timeline events yet
					</p>
					<p className="type-body-sm mx-auto mt-1 max-w-lg text-ink-3">
						Complete weighted best sets or reach automatic progression targets
						to build this history.
					</p>
				</div>
			) : (
				<ol className="border-y border-rule-faint">
					{items.map(item =>
						item.type === 'PERSONAL_RECORD' ? (
							<RecordTimelineItem
								key={item.eventId}
								item={item}
								weightUnit={weightUnit}
							/>
						) : (
							<ProgressionTimelineItem
								key={item.eventId}
								item={item}
								weightUnit={weightUnit}
							/>
						),
					)}
				</ol>
			)}

			{isError && items.length > 0 ? (
				<div role="alert" className="flex flex-wrap items-center gap-3">
					<p className="type-body-sm text-ink-3">
						The next page could not be loaded.
					</p>
					<Button size="sm" variant="outline" onClick={onLoadMore}>
						Retry
					</Button>
				</div>
			) : null}

			{hasNextPage ? (
				<Button
					variant="outline"
					className="w-full sm:w-auto"
					disabled={isFetchingNextPage}
					onClick={onLoadMore}
				>
					{isFetchingNextPage ? 'Loading events…' : 'Load earlier events'}
				</Button>
			) : null}
		</section>
	)
}
