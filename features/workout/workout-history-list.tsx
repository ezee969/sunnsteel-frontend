import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import type { Ref } from 'react'

import { EmptyModule } from '@/components/layout/empty-module'
import { InlineError } from '@/components/layout/inline-error'
import { LoadingRows } from '@/components/layout/loading-rows'
import { Button } from '@/components/ui/button'
import {
	StatusMark,
	statusMarkRule,
	type StatusState,
} from '@/components/ui/status-mark'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import type { Locale } from '@/i18n/config'
import { dateFormatter, intlLocale, numberFormatter } from '@/i18n/date-locale'
import type { WorkoutSessionSummary } from '@/lib/api/types/workout.type'
import { cn } from '@/lib/utils'
import { getHistoryEmptyState } from '@/lib/utils/empty-states'
import { groupByMonth } from '@/lib/utils/month-groups'
import { planLabel } from '@/lib/utils/routine-deloads'
import { formatDuration } from '@/lib/utils/time-format.utils'
import { formatWeight } from '@/lib/utils/weight-unit'

const STATUS_KEYS = {
	COMPLETED: 'statusCompleted',
	ABORTED: 'statusAborted',
	IN_PROGRESS: 'statusInProgress',
} as const

export interface WorkoutHistoryListProps {
	data: {
		items: WorkoutSessionSummary[]
		isLoading: boolean
		isError: boolean
		error: unknown
		/** UX-26: a failed read offers Try again. */
		onRetry?: () => void
	}
	pagination: {
		hasNextPage: boolean
		isFetchingNextPage: boolean
		fetchNextPage: () => void
		sentinelRef: Ref<HTMLDivElement>
	}
	emptyState: {
		hasActiveFilters: boolean
		onClearFilters: () => void
	}
}

export function WorkoutHistoryList({
	data: { items, isLoading, isError, error, onRetry },
	pagination: { hasNextPage, isFetchingNextPage, fetchNextPage, sentinelRef },
	emptyState: { hasActiveFilters, onClearFilters },
}: WorkoutHistoryListProps) {
	const t = useTranslations('workout.historyList')
	const tMetrics = useTranslations('workout.metrics')
	const locale = useLocale() as Locale
	const errorText = useApiErrorMessage()
	const weightUnit = useWeightUnit()
	const tDeloads = useTranslations('routines.deloads')
	const tEmpty = useTranslations('planning.emptyStates')
	// UX-24: the one status vocabulary. A session still running is current,
	// not an outcome, so it carries no rule (see the row's comment below).
	const statusState = (status: string): StatusState =>
		status === 'COMPLETED'
			? 'done'
			: status === 'ABORTED'
				? 'endedEarly'
				: 'current'
	const statusLabel = (status: string) =>
		tMetrics(STATUS_KEYS[status as keyof typeof STATUS_KEYS] ?? 'statusUnknown')
	// UX-26: a date and a time to the minute, in the app's language; the old
	// toLocaleString printed the device's format with seconds.
	const startedFormat = dateFormatter(locale, {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		hour: 'numeric',
		minute: '2-digit',
	})
	const dateTime = (iso: string) => startedFormat.format(new Date(iso))
	const count = numberFormatter(locale, {})
	/** One line: when, how long, how much and how many sets, where known. */
	const summary = (s: WorkoutSessionSummary) =>
		[
			dateTime(s.startedAt),
			s.durationSec ? formatDuration(s.durationSec) : null,
			s.totalVolume ? formatWeight(s.totalVolume, weightUnit, locale) : null,
			s.totalSets != null
				? t('setsCount', {
						count: s.totalSets,
						sets: count.format(s.totalSets),
					})
				: null,
		]
			.filter(Boolean)
			.join(' · ')

	// UX-26 (§28.6): the shared loading rows and inline error, where this was
	// a plain line and a crimson one with the error's own English.
	if (isLoading) {
		return <LoadingRows label={t('loadingSessions')} rows={8} />
	}

	if (isError) {
		return (
			<InlineError
				title={t('failedToLoad')}
				message={errorText(error)}
				onRetry={onRetry}
			/>
		)
	}

	if (items.length === 0) {
		return (
			<EmptyModule
				{...getHistoryEmptyState(hasActiveFilters, tEmpty)}
				onClearFilters={onClearFilters}
			/>
		)
	}

	return (
		// §11.5 — history is the archetypal ruled list: no fill, no box, a rule
		// between rows. Each row was a bordered card inside a card inside a card.
		// UX-03: a month heading at each change of month gives the one page
		// scroll landmarks; the rows keep the order the server sorted them in.
		<div>
			{groupByMonth(items, s => s.startedAt, intlLocale(locale)).map(
				(group, index) => (
					<section
						key={`${group.key}-${index}`}
						aria-labelledby={`history-month-${group.key}-${index}`}
					>
						<h3
							id={`history-month-${group.key}-${index}`}
							className="type-label border-b border-rule pb-2 pt-5 text-ink-3 first:pt-2"
						>
							{group.label}
						</h3>
						{group.items.map(s => {
							const plan = planLabel(
								{
									trainingBlockName: s.routine.trainingBlockName,
									deload: !!s.routine.temporaryOverrideKind,
								},
								tDeloads,
							)
							// LIVE-23: a workout logged after it happened says so, in ink.
							const loggedLater = s.origin === 'LOGGED_LATER'
							return (
								// UX-26: a row is a link, so it opens in a new tab and reads as
								// one; it was a div with a button role. One summary line says
								// when, how long, how much and how many sets, where five
								// captioned figures said it before.
								//
								// §11.12: status is a mark and its word (§4.3 rule 8). A
								// session still running has no outcome yet, so it carries no
								// rule; `.mark`'s transparent 3px keeps it on the same axis.
								<Link
									key={s.id}
									href={`/workouts/history/${s.id}`}
									aria-label={[
										t('openSessionAria', {
											status: statusLabel(s.status).toLowerCase(),
											routine: s.routine.name,
											date: dateTime(s.startedAt),
										}),
										loggedLater ? t('loggedLater') : null,
									]
										.filter(Boolean)
										.join(', ')}
									className={cn(
										'rule-row mark block py-3 pl-3 pr-1 transition-colors duration-[var(--motion-fast)] ease-standard hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
										statusMarkRule(statusState(s.status)),
									)}
								>
									<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
										<p className="type-panel min-w-0 text-foreground">
											{s.routine.name}
											{s.routine.dayName ? ` · ${s.routine.dayName}` : ''}
										</p>
										<StatusMark
											state={statusState(s.status)}
											label={statusLabel(s.status)}
										/>
									</div>
									<p className="type-body-sm mt-1 text-ink-2">
										{summary(s)}
										{plan ? (
											<span className="text-ink-3">{` · ${plan}`}</span>
										) : null}
										{loggedLater ? (
											<span className="text-ink-3">{` · ${t('loggedLater')}`}</span>
										) : null}
									</p>
									{s.notes ? (
										<p className="type-body-sm mt-1 line-clamp-2 text-ink-3">
											{s.notes}
										</p>
									) : null}
								</Link>
							)
						})}
					</section>
				),
			)}

			{/* Load more controls */}
			{hasNextPage ? (
				<div className="flex items-center justify-center pt-4">
					<Button
						onClick={() => fetchNextPage()}
						disabled={isFetchingNextPage}
						variant="outline"
						aria-label={t('loadMore')}
					>
						{isFetchingNextPage ? t('loading') : t('loadMore')}
					</Button>
				</div>
			) : (
				<div className="type-body-sm pt-4 text-center text-ink-3">
					{t('noMoreSessions')}
				</div>
			)}

			{/* Sentinel for auto-loading */}
			<div ref={sentinelRef} className="h-6 w-full" aria-hidden />
		</div>
	)
}
