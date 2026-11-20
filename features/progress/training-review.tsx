'use client'

import {
	type AppLocale,
	TRAINING_REVIEW_CANDIDATES,
	TRAINING_REVIEW_QUESTIONS,
	TRAINING_REVIEW_WORKOUTS_MAX,
	TRAINING_REVIEW_WORKOUTS_MIN,
	type TrainingReview,
	type TrainingReviewQuestion,
	trainingReviewSelectionFits,
} from '@sunsteel/contracts'
import { ScrollText, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useId, useMemo, useState } from 'react'

import { EmptyModule } from '@/components/layout/empty-module'
import { InlineError } from '@/components/layout/inline-error'
import { LoadingRows } from '@/components/layout/loading-rows'
import { LockedModule } from '@/components/layout/locked-module'
import { Button } from '@/components/ui/button'
import { ToggleOption, ToggleRow } from '@/components/ui/toggle-row'
import { useApiErrorMessage } from '@/hooks/use-api-error-message'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import { useEntitlement } from '@/lib/api/hooks/useBilling'
import {
	useCreateTrainingReview,
	useTrainingReviewUsage,
} from '@/lib/api/hooks/useTrainingReview'
import { useSessions } from '@/lib/api/hooks/useWorkoutSession'
import {
	forgetReview,
	keepReview,
	readKeptReview,
	reviewCandidates,
	reviewFindings,
	reviewsLeft,
	toggleReviewWorkout,
	workoutDate,
} from '@/lib/utils/training-review'

/**
 * INTEL-04 (design system §31): a Pro member picks a few finished workouts
 * and one fixed question, and the server answers in words and facts. Every
 * number is a fact the server computed, rendered here in the member's unit
 * and language as a link to the workout it came from. Free sees the locked
 * module and no read is made.
 */
export function TrainingReviewSection() {
	const t = useTranslations('progress.review')
	const access = useEntitlement('TRAINING_REVIEW')

	return (
		<section aria-labelledby="training-review" className="space-y-4">
			<div className="rule-row flex items-start gap-2 pb-2">
				<ScrollText className="mt-0.5 size-4 text-ink-3" aria-hidden />
				<div>
					<h2 id="training-review" className="type-section text-foreground">
						{t('title')}
					</h2>
					<p className="type-body-sm mt-1 max-w-2xl text-ink-3">
						{t('description')}
					</p>
				</div>
			</div>
			{access.allowed === false ? (
				<LockedModule feature="TRAINING_REVIEW" />
			) : access.allowed === true ? (
				<TrainingReviewPanel />
			) : (
				<LoadingRows label={t('loading')} rows={2} />
			)}
		</section>
	)
}

function TrainingReviewPanel() {
	const t = useTranslations('progress.review')
	const locale = useLocale() as Locale
	const errorText = useApiErrorMessage()
	const questionLabelId = useId()
	const workoutsLabelId = useId()
	const hintId = useId()
	const usage = useTrainingReviewUsage(true)
	const create = useCreateTrainingReview()
	const sessions = useSessions({
		status: 'COMPLETED',
		limit: TRAINING_REVIEW_CANDIDATES,
	})
	const [question, setQuestion] = useState<TrainingReviewQuestion>('PROGRESS')
	const [selected, setSelected] = useState<string[]>([])
	const [review, setReview] = useState<TrainingReview | null>(null)

	// A review used one of the month's; it comes back after a reload of the tab.
	useEffect(() => {
		setReview(readKeptReview(window.sessionStorage))
	}, [])

	const candidates = useMemo(
		() =>
			reviewCandidates(sessions.data?.pages.flatMap(page => page.items) ?? []),
		[sessions.data],
	)
	const data = usage.data
	const resets = data
		? dateFormatter(locale, {
				day: 'numeric',
				month: 'long',
				timeZone: 'UTC',
			}).format(new Date(data.resetsAt))
		: ''

	const submit = () => {
		create.mutate(
			{ question, sessionIds: selected, locale: locale as AppLocale },
			{
				onSuccess: result => {
					keepReview(window.sessionStorage, result.review)
					setReview(result.review)
				},
			},
		)
	}
	const discard = () => {
		forgetReview(window.sessionStorage)
		setReview(null)
		create.reset()
	}

	if (review) return <ReviewResult review={review} onDiscard={discard} />

	return (
		<div className="space-y-4">
			{usage.isError ? (
				<InlineError
					title={t('usageFailed')}
					message={errorText(usage.error)}
					onRetry={() => void usage.refetch()}
					retrying={usage.isFetching}
				/>
			) : null}
			{!data && !usage.isError ? (
				<LoadingRows label={t('loading')} rows={2} />
			) : null}
			{data?.state === 'UNAVAILABLE' ? (
				<p className="type-body-sm text-ink-2">{t('unavailable')}</p>
			) : null}
			{data?.state === 'PAUSED' ? (
				<p className="type-body-sm text-ink-2">{t('paused')}</p>
			) : null}
			{data?.state === 'QUOTA_REACHED' ? (
				<p className="type-body-sm text-ink-2">
					{t('quotaReached', { limit: data.limit, date: resets })}
				</p>
			) : null}

			{data?.state === 'READY' ? (
				<form
					className="max-w-[68ch] space-y-4"
					onSubmit={event => {
						event.preventDefault()
						if (
							trainingReviewSelectionFits(selected.length) &&
							!create.isPending
						)
							submit()
					}}
				>
					<div className="space-y-2">
						<p id={questionLabelId} className="type-label text-ink-3">
							{t('questionLabel')}
						</p>
						<ToggleRow aria-labelledby={questionLabelId}>
							{TRAINING_REVIEW_QUESTIONS.map(option => (
								<ToggleOption
									key={option}
									pressed={question === option}
									onClick={() => setQuestion(option)}
									disabled={create.isPending}
								>
									{t(`questions.${option}`)}
								</ToggleOption>
							))}
						</ToggleRow>
						<p className="type-body text-foreground">
							{t(`questionText.${question}`)}
						</p>
					</div>

					<div className="space-y-2">
						<p id={workoutsLabelId} className="type-label text-ink-3">
							{t('workoutsLabel')}
						</p>
						{sessions.isError ? (
							<InlineError
								title={t('workoutsFailed')}
								message={errorText(sessions.error)}
								onRetry={() => void sessions.refetch()}
								retrying={sessions.isFetching}
							/>
						) : sessions.isPending ? (
							<LoadingRows label={t('loadingWorkouts')} rows={3} />
						) : candidates.length < TRAINING_REVIEW_WORKOUTS_MIN ? (
							<EmptyModule
								title={t('notEnoughTitle')}
								description={t('notEnoughBody', {
									min: TRAINING_REVIEW_WORKOUTS_MIN,
								})}
							/>
						) : (
							<>
								<ToggleRow
									aria-labelledby={workoutsLabelId}
									aria-describedby={hintId}
								>
									{candidates.map(session => (
										<ToggleOption
											key={session.id}
											pressed={selected.includes(session.id)}
											disabled={
												create.isPending ||
												(!selected.includes(session.id) &&
													selected.length >= TRAINING_REVIEW_WORKOUTS_MAX)
											}
											onClick={() =>
												setSelected(current =>
													toggleReviewWorkout(current, session.id),
												)
											}
											className="max-w-full whitespace-normal text-left"
										>
											{t('workoutOption', {
												date: workoutDate(session.endedAt!, locale),
												name: session.routine.dayName || session.routine.name,
											})}
										</ToggleOption>
									))}
								</ToggleRow>
								<p id={hintId} className="type-body-sm text-ink-3">
									{t('workoutsHint', {
										min: TRAINING_REVIEW_WORKOUTS_MIN,
										max: TRAINING_REVIEW_WORKOUTS_MAX,
										count: selected.length,
									})}
								</p>
							</>
						)}
					</div>

					<div className="space-y-1">
						<p className="type-body-sm text-ink-3">{t('disclosure')}</p>
						<p className="type-body-sm text-ink-3">
							{t('left', {
								left: reviewsLeft(data),
								limit: data.limit,
								date: resets,
							})}
						</p>
					</div>
					{create.isError ? (
						<InlineError
							title={t('failed')}
							message={errorText(create.error)}
						/>
					) : null}
					<Button
						type="submit"
						variant="outline"
						size="sm"
						disabled={
							!trainingReviewSelectionFits(selected.length) || create.isPending
						}
					>
						<Sparkles aria-hidden />
						{create.isPending ? t('reviewing') : t('review')}
					</Button>
					{create.isPending ? (
						<p role="status" className="type-body-sm text-ink-2">
							{t('reviewingStatus')}
						</p>
					) : null}
				</form>
			) : null}
		</div>
	)
}

function ReviewResult({
	review,
	onDiscard,
}: {
	review: TrainingReview
	onDiscard: () => void
}) {
	const t = useTranslations('progress.review')
	const tFacts = useTranslations('progress.review.facts')
	const tCatalog = useTranslations('catalog.exercises')
	const locale = useLocale() as Locale
	const weightUnit = useWeightUnit()
	const findings = reviewFindings(review, {
		t: tFacts,
		locale,
		weightUnit,
		exerciseName: name => exerciseLabel(name, tCatalog),
	})
	const dateOf = (sessionId: string) => {
		const workout = review.workouts.find(w => w.sessionId === sessionId)
		return workout ? workoutDate(workout.endedAt, locale) : ''
	}

	return (
		<div className="max-w-[68ch] space-y-4">
			<div>
				<p className="type-panel text-foreground">{t('resultTitle')}</p>
				<p className="type-body-sm mt-1 text-ink-3">
					{t(`questionText.${review.question}`)}
				</p>
			</div>
			<ol className="border-t border-rule">
				{findings.map((parts, index) => (
					<li key={index} className="rule-row type-body py-3 text-foreground">
						{parts.map((part, partIndex) =>
							part.kind === 'text' ? (
								<span key={partIndex}>{part.text}</span>
							) : part.sessionId ? (
								<Link
									key={partIndex}
									href={`/workouts/history/${part.sessionId}`}
									title={t('citation', { date: dateOf(part.sessionId) })}
									className="type-data text-foreground underline decoration-dotted underline-offset-4 hover:decoration-solid"
								>
									{part.text}
								</Link>
							) : (
								<span key={partIndex}>{part.text}</span>
							),
						)}
					</li>
				))}
			</ol>
			<div className="space-y-1">
				<p className="type-label text-ink-3">{t('workoutsRead')}</p>
				<ul className="border-t border-rule">
					{review.workouts.map(workout => (
						<li key={workout.sessionId} className="rule-row py-2">
							<Link
								href={`/workouts/history/${workout.sessionId}`}
								className="type-body-sm text-ink-2 underline-offset-4 hover:text-foreground hover:underline"
							>
								{t('workoutOption', {
									date: workoutDate(workout.endedAt, locale),
									name: workout.dayName
										? `${workout.routineName} · ${workout.dayName}`
										: workout.routineName,
								})}
							</Link>
						</li>
					))}
				</ul>
			</div>
			<p className="type-body-sm text-ink-3">{t('notAdvice')}</p>
			<Button variant="ghost" size="sm" onClick={onDiscard}>
				{t('discard')}
			</Button>
		</div>
	)
}
