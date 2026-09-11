'use client'

import { useParams, useRouter } from 'next/navigation'

import { HistoryExerciseGroup } from '@/features/workout/history-exercise-group'
import { HistorySessionHeader } from '@/features/workout/history-session-header'
import { SessionRecapPanel } from '@/features/workout/session-recap'
import { useCollapseMap } from '@/hooks/use-collapse-map'
import { useWorkoutSessionData } from '@/hooks/use-workout-session-data'
import { useSessionRecap } from '@/lib/api/hooks/useWorkoutSession'
import type { ExerciseGroup } from '@/lib/utils/exercise-groups'

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
					<SessionRecapPanel recap={recap} />
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

			{/* Exercises: a ruled list, as on the session screen (§11.5). The
			    heading is for the outline only — without it the exercise `h3`s
			    sat under the recap's `h2`, or under no `h2` at all. */}
			<section aria-labelledby="history-exercises-heading">
				<h2 id="history-exercises-heading" className="sr-only">
					Exercises
				</h2>
				<div className="divide-y divide-rule-faint border-y border-rule">
					{exerciseGroups.map((group: ExerciseGroup) => (
						<HistoryExerciseGroup
							key={group.routineExerciseId}
							group={group}
							collapsed={isCollapsed(group.routineExerciseId)}
							onToggle={() => toggle(group.routineExerciseId)}
						/>
					))}
				</div>
			</section>
		</div>
	)
}
