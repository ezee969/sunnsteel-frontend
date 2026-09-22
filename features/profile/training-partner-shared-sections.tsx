'use client'

import { CalendarDays, Check, Dumbbell, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { useMemberRoutines } from '@/lib/api/hooks/useRoutineSharing'
import {
	useTrainingPartners,
	useTrainingPartnerSchedule,
} from '@/lib/api/hooks/useTrainingPartners'
import { profileRoutineHref } from '@/lib/utils/routine-sharing'
import { findTrainingPartnership } from '@/lib/utils/training-partners'

export function TrainingPartnerSharedSections({
	memberId,
	identifier,
}: {
	memberId: string
	identifier: string
}) {
	const partnerships = useTrainingPartners()
	const partnership = findTrainingPartnership(
		partnerships.data?.items ?? [],
		memberId,
	)
	const active = partnership?.status === 'ACTIVE'
	const scheduleAllowed =
		active && partnership.permissionsGrantedToMe.schedule === true
	const routinesAllowed =
		active && partnership.permissionsGrantedToMe.routines === true
	const schedule = useTrainingPartnerSchedule(
		partnership?.id ?? '',
		scheduleAllowed,
	)
	const routines = useMemberRoutines(identifier, routinesAllowed)

	if (!scheduleAllowed && !routinesAllowed) return null

	return (
		<>
			{scheduleAllowed ? (
				<section aria-labelledby="partner-schedule-heading">
					<h2
						id="partner-schedule-heading"
						className="type-section rule-heading flex items-center gap-2 pb-2 text-foreground"
					>
						<CalendarDays className="size-4 text-ink-3" aria-hidden />
						Shared Schedule
					</h2>
					{schedule.isPending ? (
						<LoadingLabel label="Loading shared schedule…" />
					) : schedule.isError ? (
						<RetryRow
							label="The shared schedule could not be loaded."
							onRetry={() => void schedule.refetch()}
						/>
					) : (
						<div className="border-t border-rule-faint">
							{schedule.data?.days.map(day => (
								<div
									key={day.date}
									className="rule-row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3"
								>
									<div>
										<p className="type-data text-foreground">{day.date}</p>
										<p className="type-body-sm text-ink-3">
											{day.plannedWorkoutCount === 0
												? 'No workout planned'
												: `${day.plannedWorkoutCount} workout${day.plannedWorkoutCount === 1 ? '' : 's'} planned`}
										</p>
									</div>
									<span className="type-body-sm flex items-center gap-1.5 text-ink-2">
										{day.trained ? (
											<Check
												className="size-4 text-success-strong"
												aria-hidden
											/>
										) : null}
										{day.trained ? 'Trained' : 'Not trained'}
									</span>
								</div>
							))}
							<p className="type-body-sm pt-3 text-ink-3">
								Dates use {schedule.data?.timeZone}. Routine names and
								prescriptions are not part of schedule access.
							</p>
						</div>
					)}
				</section>
			) : null}

			{routinesAllowed ? (
				<section aria-labelledby="partner-routines-heading">
					<h2
						id="partner-routines-heading"
						className="type-section rule-heading flex items-center gap-2 pb-2 text-foreground"
					>
						<Dumbbell className="size-4 text-ink-3" aria-hidden /> Shared
						Routines
					</h2>
					{routines.isPending ? (
						<LoadingLabel label="Loading shared routines…" />
					) : routines.isError ? (
						<RetryRow
							label="Shared routines could not be loaded."
							onRetry={() => void routines.refetch()}
						/>
					) : routines.data?.routines.length ? (
						<div className="border-t border-rule-faint">
							{routines.data.routines.map(routine => (
								<Link
									key={routine.routineId}
									href={profileRoutineHref(identifier, routine.routineId)}
									className="rule-row block py-3 text-foreground transition-colors duration-[var(--motion-fast)] ease-standard hover:text-primary"
								>
									<span className="type-panel block">{routine.name}</span>
									<span className="type-body-sm text-ink-3">
										{routine.dayCount} day{routine.dayCount === 1 ? '' : 's'} ·{' '}
										{routine.exerciseCount} exercise
										{routine.exerciseCount === 1 ? '' : 's'}
									</span>
								</Link>
							))}
						</div>
					) : (
						<p className="type-body-sm py-3 text-ink-3">
							No routines are shared with you.
						</p>
					)}
				</section>
			) : null}
		</>
	)
}

function LoadingLabel({ label }: { label: string }) {
	return (
		<p className="type-body-sm flex items-center gap-2 py-3 text-ink-3">
			<Loader2 className="size-4 animate-spin" aria-hidden /> {label}
		</p>
	)
}

function RetryRow({ label, onRetry }: { label: string; onRetry: () => void }) {
	return (
		<div className="flex flex-wrap items-center gap-3 py-3">
			<p className="type-body-sm text-ink-3">{label}</p>
			<Button type="button" variant="outline" size="sm" onClick={onRetry}>
				Retry
			</Button>
		</div>
	)
}
