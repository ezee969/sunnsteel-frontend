'use client'

import { ChevronRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import { useRoutines } from '@/lib/api/hooks/useRoutines'
import { useSessions } from '@/lib/api/hooks/useWorkoutSession'
import { sendableRoutines, workoutName } from '@/lib/utils/messages'

import type { AttachedObject } from './message-composer'

/** How many finished workouts the picker offers. */
const RECENT_WORKOUTS = 10

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
