'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

import { HistoryExerciseGroup } from '@/features/workout/history-exercise-group'
import { HistorySessionHeader } from '@/features/workout/history-session-header'
import {
	SessionCorrectionEditor,
	SessionCorrectionSummary,
} from '@/features/workout/session-corrections'
import { WorkoutNoteButton } from '@/features/workout/session-notes'
import { SessionRecapPanel } from '@/features/workout/session-recap'
import { SessionShareButton } from '@/features/workout/session-share-dialog'
import { useCollapseMap } from '@/hooks/use-collapse-map'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { useWorkoutSessionData } from '@/hooks/use-workout-session-data'
import {
	useSessionCorrections,
	useSessionRecap,
} from '@/lib/api/hooks/useWorkoutSession'
import type { ExerciseGroup } from '@/lib/utils/exercise-groups'
import { noteFor } from '@/lib/utils/session-notes'

export default function WorkoutDetailPage() {
	const params = useParams()
	const router = useRouter()
	const id = params.id as string

	const { session, exerciseGroups, metrics, isLoading, isError, error } =
		useWorkoutSessionData(id)
	const {
		data: recap,
		isLoading: isRecapLoading,
		isError: isRecapError,
	} = useSessionRecap(id, session?.status === 'COMPLETED')

	// LIVE-17: whether it can still be corrected, and what was corrected.
	const { data: corrections } = useSessionCorrections(
		id,
		session?.status === 'COMPLETED',
	)
	const weightUnit = useWeightUnit()
	const [correcting, setCorrecting] = useState(false)

	// UI state: collapsed exercises
	const { toggle, isCollapsed } = useCollapseMap<string>()

	if (isLoading) {
		return (
			<div className="ledger-page py-6 md:py-8">
				<div className="type-body-sm flex h-40 items-center justify-center text-ink-3">
					Loading workout details...
				</div>
			</div>
		)
	}

	if (isError || !session) {
		return (
			<div className="ledger-page py-6 md:py-8">
				<div className="type-body-sm text-destructive" role="alert">
					{String(error) || 'Failed to load workout details'}
				</div>
			</div>
		)
	}

	return (
		// The session screen's page grid, so a session reads the same during and
		// after it (TD-31).
		<div className="ledger-page space-y-8 py-6 md:py-8">
			{/* Header */}
			<HistorySessionHeader
				title={session?.routine?.name}
				metrics={metrics}
				onBack={() => router.back()}
				showSummary={!recap}
			/>

			{session.status === 'COMPLETED' ? (
				recap ? (
					<SessionRecapPanel
						recap={recap}
						action={<SessionShareButton sessionId={session.id} />}
						notesAction={
							<WorkoutNoteButton
								sessionId={session.id}
								note={session.notes ?? null}
							/>
						}
					/>
				) : (
					<div
						className={
							isRecapError
								? 'type-body-sm mark mark-warning bg-surface-sunk py-2 pl-3 pr-3 text-ink-2'
								: 'type-body-sm text-ink-3'
						}
						role={isRecapError ? 'alert' : 'status'}
					>
						{isRecapLoading
							? 'Loading session recap...'
							: 'The session recap is temporarily unavailable.'}
					</div>
				)
			) : null}

			<SessionCorrectionSummary
				correctionWindow={corrections?.window}
				corrections={corrections?.corrections ?? []}
				weightUnit={weightUnit}
				editing={correcting}
				onStart={() => setCorrecting(true)}
			/>

			{correcting ? (
				<SessionCorrectionEditor
					sessionId={session.id}
					groups={exerciseGroups}
					weightUnit={weightUnit}
					onDone={() => setCorrecting(false)}
				/>
			) : (
				// Exercises: a ruled list, as on the session screen (§11.5). The
				// heading is for the outline only — without it the exercise `h3`s
				// sat under the recap's `h2`, or under no `h2` at all. LIVE-17's
				// editor takes its place while a correction is being made.
				<section aria-labelledby="history-exercises-heading">
					<h2 id="history-exercises-heading" className="sr-only">
						Exercises
					</h2>
					{/* Rows rule themselves with `.rule-row`: a `divide-*` colour here
				    greyed every completed row's success mark but the last's (TD-42). */}
					<div className="border-y border-rule">
						{exerciseGroups.map((group: ExerciseGroup) => (
							<HistoryExerciseGroup
								key={group.routineExerciseId}
								group={group}
								collapsed={isCollapsed(group.routineExerciseId)}
								onToggle={() => toggle(group.routineExerciseId)}
								sessionNote={noteFor(
									session.exerciseNotes,
									group.routineExerciseId,
								)}
								sessionId={
									session.status === 'COMPLETED' ? session.id : undefined
								}
							/>
						))}
					</div>
				</section>
			)}
		</div>
	)
}
