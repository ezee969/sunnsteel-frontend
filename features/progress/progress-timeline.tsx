'use client'

import type {
	ProgressTimelineEventType,
	ProgressTimelineItem,
	WeightUnit,
} from '@sunsteel/contracts'
import { CalendarClock, History, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import { Explanation } from '@/components/layout/explanation'
import { ShowMoreButton, useShowMore } from '@/components/layout/show-more'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import type { MessageKey } from '@/i18n/translator'
import {
	getRecordTimelineExplanation,
	getRecordTimelinePerformanceLabel,
} from '@/lib/utils/progress-timeline'
import {
	getProgressionRuleExplanation,
	getProgressionSetPresentation,
} from '@/lib/utils/progression-change'
import { formatWeightAmount, getWeightUnitLabel } from '@/lib/utils/weight-unit'

const TIMELINE_DATE_FORMATTER = (locale: Locale) =>
	dateFormatter(locale, {
		dateStyle: 'medium',
		timeStyle: 'short',
	})

type TimelineFilter = ProgressTimelineEventType | undefined

const FILTERS: ReadonlyArray<{
	label: MessageKey<'progress.timeline'>
	value: TimelineFilter
}> = [
	{ label: 'filterAll', value: undefined },
	{ label: 'filterRecords', value: 'PERSONAL_RECORD' },
	{ label: 'filterProgression', value: 'PROGRESSION_CHANGED' },
]

interface ProgressTimelineProps {
	/** Defaults to the global Progress feed's heading. */
	heading?: {
		id: string
		title: string
		/** The one line shown. */
		description: string
		/** UX-17: the full text, one tap away; omit when the line says it all. */
		detail?: string
	}
	/** Off on a single exercise's page, where every event is that exercise. */
	showExerciseName?: boolean
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
	const locale = useLocale() as Locale
	const t = useTranslations('progress.timeline')
	return (
		<div className="type-body-sm flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-3">
			<span>{item.session.routineName}</span>
			<span aria-hidden>·</span>
			<span>{item.session.dayName || t('workoutDay')}</span>
			<span aria-hidden>·</span>
			<time dateTime={item.occurredAt}>
				{TIMELINE_DATE_FORMATTER(locale).format(new Date(item.occurredAt))}
			</time>
		</div>
	)
}

function RecordTimelineItem({
	item,
	weightUnit,
	showExerciseName,
}: {
	item: Extract<ProgressTimelineItem, { type: 'PERSONAL_RECORD' }>
	weightUnit: WeightUnit
	showExerciseName: boolean
}) {
	const locale = useLocale() as Locale
	const tTimeline = useTranslations('progress.timeline')
	const tEx = useTranslations('catalog.exercises')
	return (
		<li className="rule-row grid gap-2 py-4 [content-visibility:auto] [contain-intrinsic-size:auto_8rem]">
			<div className="flex flex-wrap items-center gap-2">
				<Badge variant="outline">{tTimeline('badgeRecord')}</Badge>
				{showExerciseName ? (
					<h3 className="type-panel text-foreground">
						{exerciseLabel(item.exerciseName, tEx)}
					</h3>
				) : null}
			</div>
			<TimelineContext item={item} />
			<p className="type-body-sm text-ink-2">
				{getRecordTimelineExplanation(item, weightUnit, tTimeline, locale)}
			</p>
			<div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
				<p className="type-data type-data-strong text-foreground">
					{getRecordTimelinePerformanceLabel(item, weightUnit, locale)}
				</p>
				<p className="type-body-sm text-ink-3">
					{tTimeline('estimated1rm', {
						value: `${formatWeightAmount(
							item.current.estimated1rmKg,
							weightUnit,
							locale,
							2,
						)} ${getWeightUnitLabel(weightUnit)}`,
					})}
				</p>
			</div>
			<Button variant="link" className="h-auto w-fit p-0" asChild>
				<Link href={`/workouts/sessions/${item.session.sessionId}`}>
					{tTimeline('openRecap')}
				</Link>
			</Button>
		</li>
	)
}

function ProgressionTimelineItem({
	item,
	weightUnit,
	showExerciseName,
}: {
	item: Extract<ProgressTimelineItem, { type: 'PROGRESSION_CHANGED' }>
	weightUnit: WeightUnit
	showExerciseName: boolean
}) {
	const locale = useLocale() as Locale
	const t = useTranslations('progress.timeline')
	const tChange = useTranslations('progress.progressionChange')
	const tEx = useTranslations('catalog.exercises')
	return (
		<li className="rule-row grid gap-2 py-4 [content-visibility:auto] [contain-intrinsic-size:auto_9rem]">
			<div className="flex flex-wrap items-center gap-2">
				<Badge variant="outline">{t('badgeProgression')}</Badge>
				{showExerciseName ? (
					<h3 className="type-panel text-foreground">
						{exerciseLabel(item.exerciseName, tEx)}
					</h3>
				) : null}
			</div>
			<TimelineContext item={item} />
			<p className="type-body-sm text-ink-2">
				{getProgressionRuleExplanation(
					item.change,
					weightUnit,
					tChange,
					locale,
				)}
			</p>
			<details className="group border-y border-rule-faint py-2">
				<summary className="type-body-sm cursor-pointer text-ink-2 marker:text-ink-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
					{t('reviewChanges', { count: item.change.sets.length })}
				</summary>
				<ul className="mt-2 divide-y divide-rule-faint">
					{item.change.sets.map(set => {
						const presentation = getProgressionSetPresentation(
							set,
							weightUnit,
							tChange,
							locale,
						)
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
					{t('openRecap')}
				</Link>
			</Button>
		</li>
	)
}

export function ProgressTimeline({
	heading: headingProp,
	showExerciseName = true,
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
	const t = useTranslations('progress.timeline')
	const heading = headingProp ?? {
		id: 'progress-timeline',
		title: t('title'),
		// UX-17 (§23.4): short enough to stand as it is.
		description: t('description'),
	}

	// UX-04: the first five events, then "Show N more"; the server's
	// "Load earlier events" follows once every loaded one is shown (§20.2).
	const shownItems = useShowMore(items, 5)
	const allLoadedShown = !shownItems.label || shownItems.expanded

	return (
		<section aria-labelledby={heading.id} className="space-y-4">
			<div className="rule-row flex items-start gap-2 pb-2">
				<History className="mt-0.5 size-4 text-ink-3" aria-hidden />
				<div>
					<h2 id={heading.id} className="type-section text-foreground">
						{heading.title}
					</h2>
					{heading.detail ? (
						<Explanation summary={heading.description} className="mt-1">
							<p>{heading.detail}</p>
						</Explanation>
					) : (
						<p className="type-body-sm mt-1 max-w-2xl text-ink-3">
							{heading.description}
						</p>
					)}
				</div>
			</div>

			<div
				role="group"
				aria-label={t('filterGroup')}
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
							{t(option.label)}
						</Button>
					)
				})}
			</div>

			{isPending && items.length === 0 ? (
				<div className="space-y-3" aria-label={t('loading')}>
					<Skeleton className="h-28" />
					<Skeleton className="h-28" />
					<Skeleton className="h-28" />
				</div>
			) : isError && items.length === 0 ? (
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
						{t('retryTimeline')}
					</Button>
				</div>
			) : items.length === 0 ? (
				<div className="border border-dashed border-rule bg-surface p-6 text-center">
					<CalendarClock className="mx-auto size-7 text-ink-3" aria-hidden />
					<p className="type-panel mt-3 text-foreground">{t('emptyTitle')}</p>
					<p className="type-body-sm mx-auto mt-1 max-w-lg text-ink-3">
						{t('emptyBody')}
					</p>
				</div>
			) : (
				<ol id={`${heading.id}-list`} className="border-y border-rule-faint">
					{shownItems.visible.map(item =>
						item.type === 'PERSONAL_RECORD' ? (
							<RecordTimelineItem
								key={item.eventId}
								item={item}
								weightUnit={weightUnit}
								showExerciseName={showExerciseName}
							/>
						) : (
							<ProgressionTimelineItem
								key={item.eventId}
								item={item}
								weightUnit={weightUnit}
								showExerciseName={showExerciseName}
							/>
						),
					)}
				</ol>
			)}
			<ShowMoreButton
				label={shownItems.label}
				expanded={shownItems.expanded}
				onToggle={shownItems.toggle}
				controls={`${heading.id}-list`}
			/>

			{isError && items.length > 0 ? (
				<div role="alert" className="flex flex-wrap items-center gap-3">
					<p className="type-body-sm text-ink-3">{t('nextPageError')}</p>
					<Button size="sm" variant="outline" onClick={onLoadMore}>
						{t('retry')}
					</Button>
				</div>
			) : null}

			{hasNextPage && allLoadedShown ? (
				<Button
					variant="outline"
					className="w-full sm:w-auto"
					disabled={isFetchingNextPage}
					onClick={onLoadMore}
				>
					{isFetchingNextPage ? t('loadingMore') : t('loadEarlier')}
				</Button>
			) : null}
		</section>
	)
}
