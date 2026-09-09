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
			<div className="container mx-auto p-4">
				<div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
					Loading workout details...
				</div>
			</div>
		)
	}

	if (isError || !session) {
		return (
			<div className="container mx-auto p-4">
				<div className="text-sm text-destructive" role="alert">
					{String(error) || 'Failed to load workout details'}
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto p-4 max-w-4xl">
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
						className="mb-6 rounded-lg border p-4 text-sm text-muted-foreground"
						role={isRecapError ? 'alert' : 'status'}
					>
						{isRecapLoading
							? 'Loading session recap...'
							: 'The session recap is temporarily unavailable.'}
					</div>
				)
			) : null}

			{/* Exercises */}
			<div className="space-y-4">
				{exerciseGroups.map((group: ExerciseGroup) => (
					<HistoryExerciseGroup
						key={group.routineExerciseId}
						group={group}
						collapsed={isCollapsed(group.routineExerciseId)}
						onToggle={() => toggle(group.routineExerciseId)}
					/>
				))}
			</div>
		</div>
	)
}
