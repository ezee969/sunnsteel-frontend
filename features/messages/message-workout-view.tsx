'use client'

import type { SharedWorkout, SharedWorkoutSet } from '@sunsteel/contracts'
import { ArrowLeft, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import { useMessageWorkout } from '@/lib/api/hooks/useConversations'
import { useUser } from '@/lib/api/hooks/useUser'
import { HttpError } from '@/lib/api/services/httpClient'
import { workoutName } from '@/lib/utils/messages'
import {
	formatRecapRecordValue,
	recapRecordLabel,
} from '@/lib/utils/session-recap'
import { setKindLabel } from '@/lib/utils/set-kind-label'
import { formatDuration } from '@/lib/utils/time-format.utils'
import {
	formatWeight,
	formatWeightAmount,
	getWeightUnitLabel,
} from '@/lib/utils/weight-unit'

/** The sender as a shared routine names its owner: full name, else handle. */
function ownerName(owner: SharedWorkout['owner']): string {
	return (
		[owner.name, owner.lastName].filter(Boolean).join(' ') || owner.username
	)
}

/**
 * MSG-10: the workout a message shared, opened from its card. Sending it was
 * the sender's consent, so the other participant reads it whatever the
 * sender's privacy, until the message is deleted; the read answers 404 for
 * anything else, and this page cannot tell which. It shows the totals, the
 * records it set and each exercise's completed sets -- never notes, effort
 * ratings or the comparison with the session before -- in the reader's unit.
 */
export function MessageWorkoutView({
	conversationId,
	messageId,
}: {
	conversationId: string
	messageId: string
}) {
	const t = useTranslations('messaging.workout')
	const { data, error, isLoading, refetch } = useMessageWorkout(
		conversationId,
		messageId,
	)
	const { user } = useUser()

	const back = (
		<Link
			href={`/messages/${encodeURIComponent(conversationId)}`}
			className="type-body-sm inline-flex items-center gap-1 self-start text-ink-2 underline-offset-4 hover:text-foreground hover:underline"
		>
			<ArrowLeft className="size-4" aria-hidden />
			{t('back')}
		</Link>
	)

	if (isLoading) {
		return (
			<div className="space-y-6" aria-busy="true" aria-label={t('loading')}>
				<Skeleton className="h-8 w-2/3" />
				<Skeleton className="h-4 w-1/3" />
				<Skeleton className="h-24 w-full" />
			</div>
		)
	}

	if (!data) {
		const isGone = error instanceof HttpError && error.status === 404
		return (
			<div className="flex flex-col gap-3">
				{back}
				<div role="alert" className="space-y-1">
					<h1 className="type-section text-foreground">
						{isGone ? t('unavailable') : t('loadError')}
					</h1>
					{isGone ? (
						<p className="type-body-sm max-w-[68ch] text-ink-3">
							{t('unavailableHint')}
						</p>
					) : (
						<Button type="button" variant="outline" onClick={() => refetch()}>
							{t('tryAgain')}
						</Button>
					)}
				</div>
			</div>
		)
	}

	const mine = !!user?.username && user.username === data.owner.username

	return (
		<div className="flex flex-col gap-8">
			{back}
			<p className="type-body-sm max-w-[68ch] text-ink-2">
				{mine ? t('yours') : t('sentToYou', { name: ownerName(data.owner) })}
			</p>
			<SharedWorkoutBody workout={data} />
			{mine ? (
				<Button asChild variant="outline" className="self-start">
					<Link
						href={`/workouts/history/${encodeURIComponent(data.sessionId)}`}
					>
						{t('openYours')}
					</Link>
				</Button>
			) : null}
		</div>
	)
}

function SharedWorkoutBody({ workout }: { workout: SharedWorkout }) {
	const t = useTranslations('messaging.workout')
	const tKinds = useTranslations('workout.setKinds')
	const tEx = useTranslations('catalog.exercises')
	const tRecap = useTranslations('workout.recap')
	const locale = useLocale() as Locale
	const unit = useWeightUnit()
	const unitLabel = getWeightUnitLabel(unit)

	const describeSet = (set: SharedWorkoutSet) => {
		const kind =
			set.kind !== 'WORKING' ? `${setKindLabel(set.kind, tKinds)} · ` : ''
		const reps = set.reps ?? 0
		return set.weightKg
			? `${kind}${t('setLine', {
					weight: formatWeight(set.weightKg, unit, locale),
					reps,
				})}`
			: `${kind}${t('setRepsOnly', { reps })}`
	}

	return (
		<article className="space-y-8">
			<header className="rule-heading space-y-1 pb-3">
				<h1 className="type-page text-foreground">{workoutName(workout)}</h1>
				<p className="type-body-sm text-ink-3">
					{t('finishedOn', {
						date: dateFormatter(locale, { dateStyle: 'full' }).format(
							new Date(workout.endedAt),
						),
					})}
				</p>
			</header>

			<dl className="grid grid-cols-3 gap-4">
				<div className="space-y-1">
					<dt className="type-label text-ink-3">{t('duration')}</dt>
					<dd className="type-data text-foreground">
						{formatDuration(workout.durationSec)}
					</dd>
				</div>
				<div className="space-y-1">
					<dt className="type-label text-ink-3">{t('sets')}</dt>
					<dd className="type-data text-foreground">{workout.completedSets}</dd>
				</div>
				<div className="space-y-1">
					<dt className="type-label text-ink-3">{t('volume')}</dt>
					<dd className="type-data text-foreground">
						{`${formatWeightAmount(workout.totalVolumeKg, unit, locale, 0)} ${unitLabel}`}
					</dd>
				</div>
			</dl>

			{workout.records.length > 0 ? (
				<section aria-labelledby="shared-workout-records" className="space-y-2">
					<h2
						id="shared-workout-records"
						className="type-section rule-heading pb-2 text-foreground"
					>
						{t('recordsHeading')}
					</h2>
					<ul>
						{workout.records.map(record => (
							<li
								key={`${record.exerciseId}:${record.kind}`}
								className="rule-row flex items-start gap-2 py-2"
							>
								<Trophy
									className="mt-1 size-4 shrink-0 text-ink-3"
									aria-hidden
								/>
								<span className="min-w-0">
									<span className="type-panel block text-foreground">
										{exerciseLabel(record.exerciseName, tEx)}
									</span>
									<span className="type-body-sm block text-ink-3">
										{tRecap('recordCaption', {
											label: recapRecordLabel(record.kind, tRecap),
											setNumber: record.setNumber,
										})}
									</span>
									<span className="type-data block text-foreground">
										{formatRecapRecordValue(record, unit, tRecap, locale)}
									</span>
								</span>
							</li>
						))}
					</ul>
				</section>
			) : null}

			<section aria-labelledby="shared-workout-exercises" className="space-y-4">
				<h2
					id="shared-workout-exercises"
					className="type-section rule-heading pb-2 text-foreground"
				>
					{t('exercisesHeading')}
				</h2>
				<p className="type-body-sm text-ink-3">{t('noSetsNote')}</p>
				{workout.exercises.map(exercise => (
					<div key={exercise.exerciseId} className="rule-row space-y-1 pt-3">
						<h3 className="type-panel text-foreground">
							{exerciseLabel(exercise.name, tEx)}
						</h3>
						<ol className="type-data space-y-0.5 text-ink-2">
							{exercise.sets.map(set => (
								<li key={set.setNumber}>
									<span className="sr-only">
										{t('setNumber', { number: set.setNumber })}:{' '}
									</span>
									<span aria-hidden>{set.setNumber}. </span>
									{describeSet(set)}
								</li>
							))}
						</ol>
					</div>
				))}
			</section>
		</article>
	)
}
