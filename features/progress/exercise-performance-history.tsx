'use client'

import type {
	ExercisePerformanceSession,
	WeightUnit,
} from '@sunsteel/contracts'
import {
	CalendarDays,
	Clock3,
	History,
	NotebookPen,
	RefreshCw,
	TrendingUp,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Explanation } from '@/components/layout/explanation'
import { ShowMoreButton, useShowMore } from '@/components/layout/show-more'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import {
	getProgressionRuleExplanation,
	getProgressionSetPresentation,
} from '@/lib/utils/progression-change'
import { formatDuration } from '@/lib/utils/time-format.utils'
import { formatWeightAmount, getWeightUnitLabel } from '@/lib/utils/weight-unit'

const PERFORMANCE_DATE_FORMATTER = (locale: Locale) =>
	dateFormatter(locale, {
		dateStyle: 'medium',
		timeStyle: 'short',
	})

interface ExercisePerformanceHistoryProps {
	/** Defaults to the Progress page's range-bound copy. */
	copy?: {
		title: string
		description: string
		/** UX-17: the rest of the description, behind "How this works". */
		detail?: string
		emptyTitle: string
		emptyDescription: string
	}
	sessions: ExercisePerformanceSession[]
	isPending: boolean
	isError: boolean
	hasNextPage: boolean
	isFetchingNextPage: boolean
	onRetry: () => void
	onLoadMore: () => void
}

function PerformanceSessionCard({
	session,
	weightUnit,
}: {
	session: ExercisePerformanceSession
	weightUnit: WeightUnit
}) {
	const locale = useLocale() as Locale
	const t = useTranslations('progress.performanceHistory')
	const tChange = useTranslations('progress.progressionChange')
	const unitLabel = getWeightUnitLabel(weightUnit)
	const prescriptionNotes = session.prescriptions.flatMap(prescription =>
		prescription.note?.trim() ? [prescription.note.trim()] : [],
	)

	return (
		<AccordionItem value={session.sessionId} className="border-0">
			<article className="border border-rule bg-surface [content-visibility:auto] [contain-intrinsic-size:auto_8rem]">
				<AccordionTrigger className="w-full rounded-none p-4 hover:no-underline sm:p-5 [&>svg]:mt-1">
					<span className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
						<span className="min-w-0">
							<span className="flex flex-wrap items-center gap-2">
								<span className="type-panel text-foreground">
									{session.routineName}
								</span>
								<Badge
									variant={
										session.status === 'COMPLETED' ? 'success' : 'outline'
									}
								>
									{session.status === 'COMPLETED'
										? t('completed')
										: t('aborted')}
								</Badge>
							</span>
							<span className="type-body-sm mt-1 block text-ink-3">
								{session.dayName || t('workoutDay')}
							</span>
						</span>
						<span className="type-body-sm space-y-1 text-ink-3 sm:text-right">
							<span className="flex items-center gap-2 sm:justify-end">
								<CalendarDays className="size-4" aria-hidden />
								<time dateTime={session.endedAt}>
									{PERFORMANCE_DATE_FORMATTER(locale).format(
										new Date(session.endedAt),
									)}
								</time>
							</span>
							<span className="flex items-center gap-2 sm:justify-end">
								<Clock3 className="size-4" aria-hidden />
								{session.durationSec != null
									? formatDuration(session.durationSec)
									: t('durationUnavailable')}
							</span>
						</span>
					</span>
				</AccordionTrigger>

				<AccordionContent className="space-y-5 border-t border-rule-faint p-4 sm:p-5">
					<section aria-label={t('completedSets')} className="space-y-2">
						<p className="type-label text-ink-3">{t('completedSets')}</p>
						<div className="border-y border-rule-faint">
							<div
								aria-hidden
								className="type-body-sm grid grid-cols-[3rem_minmax(0,1fr)_4rem] gap-3 py-2 text-ink-3"
							>
								<span>{t('set')}</span>
								<span>{t('performance')}</span>
								<span className="text-right">RPE</span>
							</div>
							<ol className="divide-y divide-rule-faint">
								{session.sets.map(set => (
									<li
										key={`${set.routineExerciseId}:${set.setNumber}`}
										className="type-data grid grid-cols-[3rem_minmax(0,1fr)_4rem] items-center gap-3 py-2 text-foreground"
									>
										<span>{set.setNumber}</span>
										<span>
											{set.weightKg != null && set.weightKg > 0
												? `${formatWeightAmount(set.weightKg, weightUnit, locale, 2)} ${unitLabel} × ${set.reps}`
												: t('bodyweight', { reps: set.reps })}
										</span>
										<span className="text-right">{set.rpe ?? '—'}</span>
									</li>
								))}
							</ol>
						</div>
					</section>

					<div className="grid gap-4 lg:grid-cols-2">
						<section aria-label={t('notes')} className="space-y-2">
							<div className="flex items-center gap-2">
								<NotebookPen className="size-4 text-ink-3" aria-hidden />
								<p className="type-label text-ink-3">{t('notes')}</p>
							</div>
							<div className="space-y-2 bg-surface-sunk p-3">
								<div>
									<p className="type-body-sm text-ink-3">{t('sessionNote')}</p>
									<p className="type-body-sm mt-1 whitespace-pre-wrap text-ink-2">
										{session.sessionNotes?.trim() || t('noSessionNote')}
									</p>
								</div>
								<div className="border-t border-rule-faint pt-2">
									<p className="type-body-sm text-ink-3">
										{t('prescriptionNote')}
									</p>
									<p className="type-body-sm mt-1 whitespace-pre-wrap text-ink-2">
										{prescriptionNotes.length
											? prescriptionNotes.join('\n')
											: t('noPrescriptionNote')}
									</p>
								</div>
							</div>
						</section>

						<section aria-label={t('progressionChanges')} className="space-y-2">
							<div className="flex items-center gap-2">
								<TrendingUp className="size-4 text-honour" aria-hidden />
								<p className="type-label text-ink-3">{t('progression')}</p>
							</div>
							{session.progressionChanges.length ? (
								<div className="space-y-3 bg-surface-sunk p-3">
									{session.progressionChanges.map(change => (
										<div key={change.routineExerciseId}>
											<p className="type-body-sm text-ink-2">
												{getProgressionRuleExplanation(
													change,
													weightUnit,
													tChange,
													locale,
												)}
											</p>
											<ul className="mt-2 space-y-1">
												{change.sets.map(set => {
													const row = getProgressionSetPresentation(
														set,
														weightUnit,
														tChange,
														locale,
													)
													return (
														<li
															key={set.setNumber}
															className="type-data flex flex-wrap justify-between gap-2 text-ink-2"
														>
															<span>
																{row.setLabel} · {row.repsLabel}
															</span>
															<span className="type-data-strong text-foreground">
																{row.weightLabel}
															</span>
														</li>
													)
												})}
											</ul>
										</div>
									))}
								</div>
							) : (
								<p className="type-body-sm bg-surface-sunk p-3 text-ink-3">
									{t('noChange')}
								</p>
							)}
						</section>
					</div>

					<Button variant="link" className="h-auto p-0" asChild>
						<a href={'/workouts/sessions/' + session.sessionId}>
							{t('openRecap')}
						</a>
					</Button>
				</AccordionContent>
			</article>
		</AccordionItem>
	)
}

export function ExercisePerformanceHistory({
	copy: copyProp,
	sessions,
	isPending,
	isError,
	hasNextPage,
	isFetchingNextPage,
	onRetry,
	onLoadMore,
}: ExercisePerformanceHistoryProps) {
	const weightUnit = useWeightUnit()
	const t = useTranslations('progress.performanceHistory')
	const copy = copyProp ?? {
		title: t('title'),
		description: t('description'),
		emptyTitle: t('emptyTitle'),
		emptyDescription: t('emptyDescription'),
	}

	// UX-04: the first five sessions, then "Show N more"; the server's
	// "Load earlier sessions" follows once every loaded one is shown.
	const shownSessions = useShowMore(sessions, 5)
	const allLoadedShown = !shownSessions.label || shownSessions.expanded

	return (
		<section aria-labelledby="performance-history" className="space-y-4">
			<div className="rule-row flex items-center gap-2 pb-2">
				<History className="size-4 text-ink-3" aria-hidden />
				<div>
					<h2 id="performance-history" className="type-section text-foreground">
						{copy.title}
					</h2>
					{copy.detail ? (
						<Explanation summary={copy.description} className="mt-1">
							<p>{copy.detail}</p>
						</Explanation>
					) : (
						<p className="type-body-sm mt-1 text-ink-3">{copy.description}</p>
					)}
				</div>
			</div>

			{isPending ? (
				<div className="space-y-4" aria-label={t('loading')}>
					<Skeleton className="h-32" />
					<Skeleton className="h-32" />
				</div>
			) : isError && sessions.length === 0 ? (
				<div role="alert" className="border border-rule bg-surface p-5">
					<p className="type-panel text-foreground">{t('errorTitle')}</p>
					<p className="type-body-sm mt-1 text-ink-3">{t('errorBody')}</p>
					<Button variant="outline" className="mt-3" onClick={onRetry}>
						<RefreshCw aria-hidden />
						{t('retry')}
					</Button>
				</div>
			) : sessions.length === 0 ? (
				<div className="border border-dashed border-rule bg-surface p-6 text-center">
					<p className="type-panel text-foreground">{copy.emptyTitle}</p>
					<p className="type-body-sm mt-1 text-ink-3">
						{copy.emptyDescription}
					</p>
				</div>
			) : (
				<Accordion
					id="performance-history-list"
					type="multiple"
					className="space-y-4"
				>
					{shownSessions.visible.map(session => (
						<PerformanceSessionCard
							key={session.sessionId}
							session={session}
							weightUnit={weightUnit}
						/>
					))}
				</Accordion>
			)}
			<ShowMoreButton
				label={shownSessions.label}
				expanded={shownSessions.expanded}
				onToggle={shownSessions.toggle}
				controls="performance-history-list"
			/>

			{isError && sessions.length > 0 ? (
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
