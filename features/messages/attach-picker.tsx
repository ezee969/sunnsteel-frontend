'use client'

import { messageProgressId } from '@sunsteel/contracts'
import { ChevronRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { achievementText, exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import { useAchievements } from '@/lib/api/hooks/useAchievements'
import { useRoutines } from '@/lib/api/hooks/useRoutines'
import {
	useProgressTimeline,
	useSessions,
} from '@/lib/api/hooks/useWorkoutSession'
import {
	formatAchievementDate,
	formatComebackEvidence,
} from '@/lib/utils/achievements'
import {
	monthKey,
	progressMonthLabel,
	recentAchievements,
	sendableRoutines,
	workoutName,
} from '@/lib/utils/messages'
import { getRecordTimelinePerformanceLabel } from '@/lib/utils/progress-timeline'

import type { AttachedObject } from './message-composer'

/** How many finished workouts, records and milestones the picker offers. */
const RECENT_WORKOUTS = 10
const RECENT_RECORDS = 10
const RECENT_ACHIEVEMENTS = 10
const RECENT_COMEBACKS = 10

/**
 * MSG-07/MSG-10: one of the member's own routines or finished workouts,
 * which travels with a message. It says what sending does before anything is
 * chosen: the other member may open it whatever the sender's privacy, until
 * the message is deleted. A routine moderation hid is never offered, because
 * the server refuses it.
 */
export function AttachPicker({
	open,
	onOpenChange,
	onChoose,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	onChoose: (attached: AttachedObject) => void
}) {
	const t = useTranslations('messaging.composer')
	const locale = useLocale() as Locale
	const routines = useRoutines()
	const sessions = useSessions({ status: 'COMPLETED', limit: RECENT_WORKOUTS })
	const routineChoices = sendableRoutines(routines.data ?? [])
	const workouts = (sessions.data?.pages[0]?.items ?? []).slice(
		0,
		RECENT_WORKOUTS,
	)
	const date = dateFormatter(locale, { dateStyle: 'medium' })
	// MSG-11: their most recent records, from the progress timeline.
	const tEx = useTranslations('catalog.exercises')
	const unit = useWeightUnit()
	const timeline = useProgressTimeline('PERSONAL_RECORD', {
		limit: RECENT_RECORDS,
	})
	const records = (timeline.data?.pages[0]?.items ?? []).flatMap(item =>
		item.type === 'PERSONAL_RECORD' ? [item] : [],
	)
	// MSG-12: their most recently earned milestones.
	const tCatalog = useTranslations('catalog.achievements')
	// Only once the picker is open: the ledger's read takes the account lock.
	const achievements = useAchievements({ enabled: open })
	const milestones = recentAchievements(
		achievements.data?.achievements ?? [],
		RECENT_ACHIEVEMENTS,
	)
	// MSG-13: their comebacks, most recent first as Achievements lists them.
	const tComeback = useTranslations('achievements.comeback')
	const comebacks = (achievements.data?.comeback?.recognitions ?? []).slice(
		0,
		RECENT_COMEBACKS,
	)
	// MSG-14: this month and last, each only once it has a finished workout.
	// Read only while the picker is open.
	const [thisMonthStart] = useState(() => {
		const now = new Date()
		return new Date(now.getFullYear(), now.getMonth(), 1)
	})
	const lastMonthStart = new Date(
		thisMonthStart.getFullYear(),
		thisMonthStart.getMonth() - 1,
		1,
	)
	const thisMonth = useSessions(
		{ status: 'COMPLETED', from: thisMonthStart.toISOString(), limit: 1 },
		{ enabled: open },
	)
	const lastMonth = useSessions(
		{
			status: 'COMPLETED',
			from: lastMonthStart.toISOString(),
			to: thisMonthStart.toISOString(),
			limit: 1,
		},
		{ enabled: open },
	)
	const progressPending = thisMonth.isPending || lastMonth.isPending
	const months = [
		[thisMonthStart, thisMonth] as const,
		[lastMonthStart, lastMonth] as const,
	].flatMap(([start, query]) =>
		(query.data?.pages[0]?.items.length ?? 0) > 0 ? [monthKey(start)] : [],
	)

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('attachTitle')}</DialogTitle>
					<DialogDescription>{t('attachDescription')}</DialogDescription>
				</DialogHeader>
				<div className="max-h-[60vh] space-y-5 overflow-y-auto">
					<section className="space-y-2">
						<h3 className="type-label text-ink-3">{t('routinesHeading')}</h3>
						{routines.isPending ? (
							<Skeleton
								className="h-11"
								aria-busy="true"
								aria-label={t('pickerLoading')}
							/>
						) : routineChoices.length === 0 ? (
							<p className="type-body-sm text-ink-3">{t('pickerEmpty')}</p>
						) : (
							<ul className="border-t border-rule-faint">
								{routineChoices.map(routine => (
									<li key={routine.id} className="rule-row">
										<ChoiceButton
											label={t('pickerChoose', { name: routine.name })}
											title={routine.name}
											onClick={() =>
												onChoose({
													kind: 'ROUTINE',
													id: routine.id,
													name: routine.name,
												})
											}
										/>
									</li>
								))}
							</ul>
						)}
					</section>
					<section className="space-y-2">
						<h3 className="type-label text-ink-3">{t('workoutsHeading')}</h3>
						{sessions.isPending ? (
							<Skeleton
								className="h-11"
								aria-busy="true"
								aria-label={t('workoutsLoading')}
							/>
						) : workouts.length === 0 ? (
							<p className="type-body-sm text-ink-3">{t('workoutsEmpty')}</p>
						) : (
							<ul className="border-t border-rule-faint">
								{workouts.map(session => {
									const name = workoutName({
										routineName: session.routine.name,
										dayName: session.routine.dayName,
									})
									const when = date.format(
										new Date(session.endedAt ?? session.startedAt),
									)
									return (
										<li key={session.id} className="rule-row">
											<ChoiceButton
												label={t('pickerChoose', { name: `${name}, ${when}` })}
												title={name}
												detail={when}
												onClick={() =>
													onChoose({ kind: 'WORKOUT', id: session.id, name })
												}
											/>
										</li>
									)
								})}
							</ul>
						)}
					</section>
					<section className="space-y-2">
						<h3 className="type-label text-ink-3">{t('recordsHeading')}</h3>
						{timeline.isPending ? (
							<Skeleton
								className="h-11"
								aria-busy="true"
								aria-label={t('recordsLoading')}
							/>
						) : records.length === 0 ? (
							<p className="type-body-sm text-ink-3">{t('recordsEmpty')}</p>
						) : (
							<ul className="border-t border-rule-faint">
								{records.map(record => {
									const lift = exerciseLabel(record.exerciseName, tEx)
									const name = `${lift} · ${getRecordTimelinePerformanceLabel(record, unit, locale)}`
									const when = date.format(new Date(record.occurredAt))
									return (
										<li key={record.eventId} className="rule-row">
											<ChoiceButton
												label={t('pickerChoose', { name: `${name}, ${when}` })}
												title={name}
												detail={when}
												onClick={() =>
													onChoose({
														kind: 'RECORD',
														id: record.eventId,
														exerciseId: record.exerciseId,
														name,
													})
												}
											/>
										</li>
									)
								})}
							</ul>
						)}
					</section>
					<section className="space-y-2">
						<h3 className="type-label text-ink-3">
							{t('achievementsHeading')}
						</h3>
						{achievements.isPending ? (
							<Skeleton
								className="h-11"
								aria-busy="true"
								aria-label={t('achievementsLoading')}
							/>
						) : milestones.length === 0 ? (
							<p className="type-body-sm text-ink-3">
								{t('achievementsEmpty')}
							</p>
						) : (
							<ul className="border-t border-rule-faint">
								{milestones.map(achievement => {
									const name = achievementText(achievement, tCatalog).title
									const when = achievement.backfilled
										? undefined
										: formatAchievementDate(achievement.unlockedAt, locale)
									return (
										<li key={achievement.id} className="rule-row">
											<ChoiceButton
												label={t('pickerChoose', {
													name: when ? `${name}, ${when}` : name,
												})}
												title={name}
												detail={when}
												onClick={() =>
													onChoose({
														kind: 'ACHIEVEMENT',
														id: achievement.id,
														name,
													})
												}
											/>
										</li>
									)
								})}
							</ul>
						)}
					</section>
					<section className="space-y-2">
						<h3 className="type-label text-ink-3">{t('comebacksHeading')}</h3>
						{achievements.isPending ? (
							<Skeleton
								className="h-11"
								aria-busy="true"
								aria-label={t('comebacksLoading')}
							/>
						) : comebacks.length === 0 ? (
							<p className="type-body-sm text-ink-3">{t('comebacksEmpty')}</p>
						) : (
							<ul className="border-t border-rule-faint">
								{comebacks.map(comeback => {
									const name = formatComebackEvidence(comeback, tComeback)
									const when = formatAchievementDate(
										comeback.recognizedAt,
										locale,
									)
									return (
										<li key={comeback.id} className="rule-row">
											<ChoiceButton
												label={t('pickerChoose', { name: `${name}, ${when}` })}
												title={name}
												detail={when}
												onClick={() =>
													onChoose({ kind: 'COMEBACK', id: comeback.id, name })
												}
											/>
										</li>
									)
								})}
							</ul>
						)}
					</section>
					<section className="space-y-2">
						<h3 className="type-label text-ink-3">{t('progressHeading')}</h3>
						{progressPending ? (
							<Skeleton
								className="h-11"
								aria-busy="true"
								aria-label={t('progressLoading')}
							/>
						) : months.length === 0 ? (
							<p className="type-body-sm text-ink-3">{t('progressEmpty')}</p>
						) : (
							<ul className="border-t border-rule-faint">
								{months.map(month => {
									const name = progressMonthLabel(month, locale)
									return (
										<li key={month} className="rule-row">
											<ChoiceButton
												label={t('pickerChoose', { name })}
												title={name}
												onClick={() =>
													onChoose({
														kind: 'PROGRESS',
														id: messageProgressId(month),
														name,
													})
												}
											/>
										</li>
									)
								})}
							</ul>
						)}
					</section>
				</div>
			</DialogContent>
		</Dialog>
	)
}

function ChoiceButton({
	label,
	title,
	detail,
	onClick,
}: {
	label: string
	title: string
	detail?: string
	onClick: () => void
}) {
	return (
		<button
			type="button"
			className="group flex min-h-11 w-full items-center justify-between gap-2 rounded-sm py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
			aria-label={label}
			onClick={onClick}
		>
			<span className="min-w-0">
				<span className="type-body block truncate text-foreground underline-offset-4 group-hover:underline">
					{title}
				</span>
				{detail ? (
					<span className="type-body-sm block text-ink-3">{detail}</span>
				) : null}
			</span>
			<ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden />
		</button>
	)
}
