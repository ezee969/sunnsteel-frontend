import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import type { Ref } from 'react'

import { EmptyModule } from '@/components/layout/empty-module'
import { Button } from '@/components/ui/button'
import { intlLocale } from '@/i18n/date-locale'
import type { Translator } from '@/i18n/translator'
import type { WorkoutSessionSummary } from '@/lib/api/types/workout.type'
import { cn } from '@/lib/utils'
import { getHistoryEmptyState } from '@/lib/utils/empty-states'
import { groupByMonth } from '@/lib/utils/month-groups'
import { planLabel } from '@/lib/utils/routine-deloads'
import { formatDuration } from '@/lib/utils/time-format.utils'

const getErrorMessage = (
	err: unknown,
	t: Translator<'workout.historyList'>,
): string => {
	if (err instanceof Error) return err.message
	if (typeof err === 'string') return err
	if (err && typeof err === 'object' && 'message' in err) {
		const m = (err as { message?: unknown }).message
		if (typeof m === 'string') return m
	}
	return t('failedToLoad')
}

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
	data: { items, isLoading, isError, error },
	pagination: { hasNextPage, isFetchingNextPage, fetchNextPage, sentinelRef },
	emptyState: { hasActiveFilters, onClearFilters },
}: WorkoutHistoryListProps) {
	const t = useTranslations('workout.historyList')
	const tMetrics = useTranslations('workout.metrics')
	const locale = useLocale()
	const router = useRouter()
	const tDeloads = useTranslations('routines.deloads')
	const statusLabel = (status: string) =>
		tMetrics(STATUS_KEYS[status as keyof typeof STATUS_KEYS] ?? 'statusUnknown')
	const dateTime = (iso: string) =>
		new Date(iso).toLocaleString(intlLocale(locale))

	if (isLoading) {
		return (
			<div className="type-body-sm flex h-40 items-center justify-center text-ink-3">
				{t('loadingSessions')}
			</div>
		)
	}

	if (isError) {
		return (
			<div
				className="type-body-sm text-destructive"
				role="alert"
				aria-live="polite"
			>
				{getErrorMessage(error, t)}
			</div>
		)
	}

	if (items.length === 0) {
		return (
			<EmptyModule
				{...getHistoryEmptyState(hasActiveFilters)}
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
						{group.items.map(s => (
							<div
								key={s.id}
								// §11.12 — status is a mark, and the status word beside it is what
								// carries the meaning (§4.3 rule 8). A finished session is "done,
								// as planned"; an aborted one is the row worth noticing.
								//
								// `IN_PROGRESS` is deliberately unmarked, not overlooked. All three
								// mark colours describe an outcome — `--success` is completion,
								// `--honour` is better than planned and capped at two per viewport,
								// and `--warning-strong` already means "aborted" in this very list,
								// so reusing it would collapse two different states into one colour.
								// A session still running has no outcome yet, and `.mark`'s
								// transparent 3px keeps the row on the same left axis as its
								// neighbours while saying so.
								className={cn(
									'rule-row mark cursor-pointer py-3 pl-3 pr-1 transition-colors duration-[var(--motion-fast)] ease-standard hover:bg-surface',
									s.status === 'COMPLETED' && 'mark-success',
									s.status === 'ABORTED' && 'mark-warning',
								)}
								onClick={() => router.push(`/workouts/history/${s.id}`)}
								role="button"
								tabIndex={0}
								aria-label={t('openSessionAria', {
									status: statusLabel(s.status).toLowerCase(),
									routine: s.routine.name,
									date: dateTime(s.startedAt),
								})}
								onKeyDown={e => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault()
										router.push(`/workouts/history/${s.id}`)
									}
								}}
							>
								<div className="xl:grid xl:grid-cols-[minmax(0,2fr)_minmax(0,5fr)] xl:items-center xl:gap-8">
									<div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 xl:flex-col xl:items-start xl:gap-0.5">
										<div className="type-panel min-w-0 text-foreground">
											{s.routine.name}
											{s.routine.dayName ? ` · ${s.routine.dayName}` : ''}
											{planLabel(
												{
													trainingBlockName: s.routine.trainingBlockName,
													deload: !!s.routine.temporaryOverrideKind,
												},
												tDeloads,
											) ? (
												<span className="type-body-sm block text-ink-3">
													{planLabel(
														{
															trainingBlockName: s.routine.trainingBlockName,
															deload: !!s.routine.temporaryOverrideKind,
														},
														tDeloads,
													)}
												</span>
											) : null}
										</div>
										<div className="type-body-sm shrink-0 text-ink-3 sm:text-right xl:text-left">
											{statusLabel(s.status)}
										</div>
									</div>

									{/* §10.1 — at `xl` the ledger opens: duration and volume become
					    right-aligned mono columns rather than left-aligned pairs. */}
									<div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4 xl:mt-0">
										<div>
											<div className="type-body-sm text-ink-3">
												{t('started')}
											</div>
											<div className="type-data text-ink-2">
												{dateTime(s.startedAt)}
											</div>
										</div>
										<div>
											<div className="type-body-sm text-ink-3">
												{t('ended')}
											</div>
											<div className="type-data text-ink-2">
												{s.endedAt ? dateTime(s.endedAt) : '—'}
											</div>
										</div>
										<div className="xl:text-right">
											<div className="type-body-sm text-ink-3">
												{t('duration')}
											</div>
											<div className="type-data text-ink-2">
												{s.durationSec ? formatDuration(s.durationSec) : '—'}
											</div>
										</div>
										<div className="xl:text-right">
											<div className="type-body-sm text-ink-3">
												{t('volumeSets')}
											</div>
											<div className="type-data text-ink-2">
												{s.totalVolume ?? '—'} / {s.totalSets ?? '—'}
											</div>
										</div>
									</div>
								</div>

								{s.notes && (
									<div className="type-body-sm mt-2 text-ink-3">{s.notes}</div>
								)}
							</div>
						))}
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
