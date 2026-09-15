'use client'

import { useParams, useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RoutineDayAccordion } from '@/features/routines/components/RoutineDayAccordion'
import { RoutineHeader } from '@/features/routines/components/RoutineHeader'
import { RoutineVersions } from '@/features/routines/components/RoutineVersions'
import { WorkoutDialogs } from '@/features/routines/components/WorkoutDialogs'
import { useRoutineData } from '@/features/routines/hooks/useRoutineData'
import { useWorkoutSessionManager } from '@/features/routines/hooks/useWorkoutSessionManager'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import {
	useRoutine,
	useToggleRoutineCompleted,
	useToggleRoutineFavorite,
} from '@/lib/api/hooks/useRoutines'
import { useActiveSession } from '@/lib/api/hooks/useWorkoutSession'
import { logger } from '@/lib/utils/logger'

export default function RoutineDetailsPage() {
	const params = useParams()
	const router = useRouter()
	const routineId = params.id as string
	const weightUnit = useWeightUnit()

	// Data fetching
	const { data: routine, isLoading } = useRoutine(routineId)
	const { data: activeSession } = useActiveSession()

	// Mutations
	const { mutateAsync: toggleFavorite, isPending: isTogglingFavorite } =
		useToggleRoutineFavorite()
	const { mutateAsync: toggleCompleted, isPending: isTogglingCompleted } =
		useToggleRoutineCompleted()

	// Custom hooks
	const sessionManager = useWorkoutSessionManager(routineId, routine)
	const routineData = useRoutineData(routine)

	// Handlers
	const handleToggleFavorite = async () => {
		if (!routine) return
		try {
			await toggleFavorite({ id: routine.id, isFavorite: !routine.isFavorite })
		} catch (error) {
			logger.error('Failed to toggle favorite:', error)
		}
	}

	const handleToggleCompleted = async () => {
		if (!routine) return
		try {
			await toggleCompleted({
				id: routine.id,
				isCompleted: !routine.isCompleted,
			})
		} catch (error) {
			logger.error('Failed to toggle completed:', error)
		}
	}

	// The history detail page's grid (TD-38): `.ledger-page`, not `container`,
	// so the two detail pages share a measure and gutters.
	if (isLoading) {
		return (
			<div
				className="ledger-page space-y-8 py-6 md:py-8"
				role="status"
				aria-label="Loading routine"
			>
				<div className="rule-heading space-y-2 pb-4">
					<Skeleton className="h-8 w-1/3" />
					<Skeleton className="h-4 w-2/3" />
				</div>
				<div className="divide-y divide-rule-faint border-y border-rule">
					{[1, 2, 3].map(i => (
						<div key={i} className="py-4">
							<Skeleton className="h-6 w-40" />
						</div>
					))}
				</div>
			</div>
		)
	}

	if (!routine) {
		return (
			<div className="ledger-page space-y-6 py-6 md:py-8">
				<div className="rule-heading pb-4">
					<h1 className="type-page corner-brackets inline-block text-foreground">
						Routine not found
					</h1>
				</div>
				<Button onClick={() => router.push('/routines')}>
					Back to Routines
				</Button>
			</div>
		)
	}

	return (
		<div className="ledger-page space-y-8 py-6 md:py-8">
			{/* Header */}
			<RoutineHeader
				routine={routine}
				daysPerWeek={routineData.daysPerWeek}
				onBack={() => router.push('/routines')}
				onEdit={() => router.push(`/routines/edit/${routine.id}`)}
				onToggleFavorite={handleToggleFavorite}
				onToggleCompleted={handleToggleCompleted}
				isToggling={isTogglingFavorite || isTogglingCompleted}
			/>

			{/* Routine Days - the page's one start surface. The Quick Start tiles
			    above it started the same days a second time (TD-41). */}
			{routine.days && routine.days.length > 0 && (
				<div className="space-y-4">
					<h2 className="type-section text-foreground">Routine Days</h2>
					<RoutineDayAccordion
						weightUnit={weightUnit}
						days={routine.days}
						routine={{
							id: routine.id,
							scheduleMode: routine.scheduleMode,
							nextRotationDayId: routine.nextRotationDayId,
						}}
						activeSession={activeSession}
						isStarting={sessionManager.isStarting}
						startActingDayId={sessionManager.startActingDayId}
						onStartWorkout={dayId =>
							sessionManager.handleStart(dayId, activeSession)
						}
					/>
				</div>
			)}

			<RoutineVersions
				routine={routine}
				hasLiveSession={activeSession?.routineId === routine.id}
				weightUnit={weightUnit}
			/>

			{/* Dialogs */}
			<WorkoutDialogs
				activeConflictOpen={sessionManager.activeConflictOpen}
				onActiveConflictClose={sessionManager.closeAllDialogs}
				onGoToActiveSession={() => {
					if (activeSession?.id) {
						router.push(`/workouts/sessions/${activeSession.id}`)
					}
				}}
				dateValidationOpen={sessionManager.dateValidationOpen}
				onDateValidationClose={sessionManager.closeAllDialogs}
				dateConfirmOpen={sessionManager.dateConfirmOpen}
				onDateConfirm={sessionManager.handleDateConfirm}
				onDateConfirmClose={sessionManager.closeAllDialogs}
			/>
		</div>
	)
}
