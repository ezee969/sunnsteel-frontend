'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSession, useUpsertSetLog } from '@/lib/api/hooks/useWorkoutSession'
import { useRoutine, useUpdateExerciseNote } from '@/lib/api/hooks/useRoutines'
import { useRtfWeekGoals } from '@/lib/api/hooks/useRtfWeekGoals'
import { useSessionManagement } from '@/hooks/use-session-management'
import { useCollapsibleExercises } from '@/hooks/use-collapsible-exercises'
import { SessionHeader } from '@/components/workout/session-header'
import { SessionActionCard } from '@/components/workout/session-action-card'
import { ExerciseGroup } from '@/components/workout/exercise-group'
import { SessionConfirmationDialog } from '@/components/workout/session-confirmation-dialog'
import { SessionLoadingSkeleton } from '@/components/workout/session-loading-skeleton'
import { groupSetLogsByExercise } from '@/lib/utils/session-progress.utils'
import type { GroupedExerciseLogs } from '@/lib/utils/workout-session.types'
import type { UpsertSetLogPayload } from '@/lib/utils/workout-session.types'
import type { SetLog } from '@/lib/api/types/workout.type'
import { useCallback, useMemo } from 'react'

export default function ActiveSessionPage() {
	const params = useParams<{ id: string | string[] }>()
	const router = useRouter()
	const idParam = Array.isArray(params.id) ? params.id[0] : params.id

	// Data fetching
	const { data: session, isLoading, error } = useSession(idParam)
	const { mutate: upsertSetLog } = useUpsertSetLog(idParam)
	const { mutate: updateNote } = useUpdateExerciseNote()
	const routineId = session?.routineId ?? ''
	const {
		data: routine,
		isFetched: isRoutineFetched,
		error: routineError,
	} = useRoutine(routineId)
	const { data: weekGoals } = useRtfWeekGoals(
		routineId,
		session?.program?.currentWeek,
	)

	// Session management
	const {
		isConfirmingFinish,
		progressData,
		handleFinishAttempt,
		executeFinish,
		cancelFinish,
		isFinishing,
		finishStatus,
	} = useSessionManagement({
		sessionId: idParam,
		routine,
		routineDayId: session?.routineDayId,
		setLogs: session?.setLogs,
		isDeloadWeek: session?.program?.isDeloadWeek,
	})

	// Collapsible exercises state
	const { toggleExercise, isCollapsed } = useCollapsibleExercises()

	// Handlers
	const handleSaveSetLog = useCallback(
		(payload: UpsertSetLogPayload) => {
			upsertSetLog(payload)
		},
		[upsertSetLog],
	)

	const handleBack = useCallback(() => {
		router.back()
	}, [router])

	// Group set logs by exercise for display
	const groupedLogs = useMemo<GroupedExerciseLogs[]>(() => {
		if (!session?.setLogs || !routine) return [] as GroupedExerciseLogs[]

		const day = routine!.days.find(d => d.id === session.routineDayId)
		if (!day) return [] as GroupedExerciseLogs[]

		const isDeloadWeek = !!session.program?.isDeloadWeek
		const effectiveExercises = isDeloadWeek
			? day.exercises.map(re =>
					re.progressionScheme === 'PROGRAMMED_RTF' ||
					re.progressionScheme === 'PROGRAMMED_RTF_HYPERTROPHY'
						? { ...re, sets: re.sets.filter(s => s.setNumber <= 3) }
						: re,
				)
			: day.exercises

		return groupSetLogsByExercise(
			session.setLogs as SetLog[],
			effectiveExercises,
			session.id,
		)
	}, [
		session?.setLogs,
		session?.routineDayId,
		session?.id,
		session?.program?.isDeloadWeek,
		routine,
	])

	// Loading state (session or routine). For routine, wait until first fetch completes when routineId exists
	const routineFirstFetchPending = !!routineId && !isRoutineFetched
	if (isLoading || routineFirstFetchPending) {
		return <SessionLoadingSkeleton />
	}

	// Error state
	if (error) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="text-center space-y-4">
					<h1 className="text-2xl font-bold text-red-600">
						Error Loading Session
					</h1>
					<p className="text-muted-foreground">
						{error.message || 'Failed to load workout session'}
					</p>
					<button
						onClick={handleBack}
						className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
					>
						Go Back
					</button>
				</div>
			</div>
		)
	}

	// No session found
	if (!session) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="text-center space-y-4">
					<h1 className="text-2xl font-bold">Session Not Found</h1>
					<p className="text-muted-foreground">
						The workout session you&apos;re looking for doesn&apos;t exist or
						has been deleted.
					</p>
					<button
						onClick={handleBack}
						className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
					>
						Go Back
					</button>
				</div>
			</div>
		)
	}

	// Routine error state
	if (routineError) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="text-center space-y-4">
					<h1 className="text-2xl font-bold text-red-600">
						Error Loading Routine
					</h1>
					<p className="text-muted-foreground">
						{routineError.message || 'Failed to load routine'}
					</p>
					<button
						onClick={handleBack}
						className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
					>
						Go Back
					</button>
				</div>
			</div>
		)
	}

	// No routine found (only after routine finished first fetch and routineId exists)
	if (!!routineId && isRoutineFetched && !routine) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="text-center space-y-4">
					<h1 className="text-2xl font-bold">Routine Not Found</h1>
					<p className="text-muted-foreground">
						The routine associated with this session could not be loaded.
					</p>
					<button
						onClick={handleBack}
						className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
					>
						Go Back
					</button>
				</div>
			</div>
		)
	}

	const day = routine!.days.find(d => d.id === session.routineDayId)
	if (!day) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="text-center space-y-4">
					<h1 className="text-2xl font-bold">Day Not Found</h1>
					<p className="text-muted-foreground">
						The routine day associated with this session could not be found.
					</p>
					<button
						onClick={handleBack}
						className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
					>
						Go Back
					</button>
				</div>
			</div>
		)
	}
	console.log('Session ', session)
	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<SessionHeader
				routineName={routine!.name}
				dayName={`Day ${day.dayOfWeek}`}
				startedAt={session.startedAt}
				progressData={progressData}
				onNavigateBack={handleBack}
			/>

			<div className="container mx-auto px-4 py-6 space-y-6">
				{/* Program info banner (RtF) */}
				{session.program && (
					<div className="rounded-md border bg-muted/30 p-3">
						<div className="flex items-center justify-between text-sm">
							<div className="font-medium">
								Week {session.program.currentWeek} /{' '}
								{session.program.durationWeeks}
							</div>
							<div className="text-muted-foreground">
								{session.program.isDeloadWeek ? 'Deload week' : 'Standard week'}
							</div>
						</div>
					</div>
				)}

				{/* Action Card */}
				<SessionActionCard
					sessionId={session.id}
					routineName={routine!.name}
					dayName={`Day ${day.dayOfWeek}`}
					startedAt={session.startedAt}
					progressData={progressData}
					isFinishing={isFinishing}
					onFinishAttempt={() => handleFinishAttempt('COMPLETED')}
					onNavigateBack={handleBack}
				/>

				{/* Exercise Groups */}
				<div className="space-y-4">
					{groupedLogs.map(group => {
						const completedSets = group.sets.filter(
							set => set.isCompleted,
						).length
						const totalSets = group.sets.length
						const isRtF =
							group.progressionScheme === 'PROGRAMMED_RTF' ||
							group.progressionScheme === 'PROGRAMMED_RTF_HYPERTROPHY'
						const goal = weekGoals?.goals?.find(
							g => g.routineExerciseId === group.exerciseId,
						)
						const isDeload = !!session.program?.isDeloadWeek
						const amrapSetNumber = isRtF
							? !isDeload
								? (goal?.amrapSetNumber ??
									(group.progressionScheme === 'PROGRAMMED_RTF_HYPERTROPHY'
										? 4
										: 5))
								: undefined
							: undefined
						const hideAmrapLabel = isDeload

						const setsWithWeekTargets =
							isRtF && goal
								? group.sets.map(set => {
										const isAmrapRow =
											!!amrapSetNumber && set.setNumber === amrapSetNumber
										return {
											...set,
											// Fix actual weight to workingWeight to ensure inputs (disabled) reflect correct value
											weight: goal.workingWeightKg ?? set.weight,
											plannedWeight: goal.workingWeightKg ?? set.plannedWeight,
											// For RtF, prefer fixedReps for non-AMRAP sets; clear range to show a single value
											plannedReps: !isAmrapRow
												? (goal.fixedReps ?? set.plannedReps)
												: set.plannedReps,
											plannedMinReps: !isAmrapRow ? null : set.plannedMinReps,
											plannedMaxReps: !isAmrapRow ? null : set.plannedMaxReps,
										}
									})
								: group.sets

						return (
							<ExerciseGroup
								key={group.exerciseId}
								exerciseId={group.exerciseId}
								exerciseName={group.exerciseName}
								sets={setsWithWeekTargets}
								isCollapsed={isCollapsed(group.exerciseId)}
								onToggleCollapse={() => toggleExercise(group.exerciseId)}
								completedSets={completedSets}
								totalSets={totalSets}
								amrapSetNumber={amrapSetNumber}
								hideAmrapLabel={hideAmrapLabel}
								isRtF={isRtF}
								onSave={handleSaveSetLog}
								note={group.note}
								onSaveNote={note => {
									if (routineId) {
										updateNote({
											routineId,
											routineExerciseId: group.exerciseId,
											note,
										})
									}
								}}
							/>
						)
					})}
				</div>

				{/* Empty state */}
				{groupedLogs.length === 0 && (
					<div className="text-center py-12">
						<div className="space-y-4">
							<div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
								<span className="text-2xl">🏋️</span>
							</div>
							<div>
								<h3 className="text-lg font-semibold">No Exercises Found</h3>
								<p className="text-muted-foreground">
									This workout session doesn&apos;t have any exercises to log.
								</p>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Confirmation Dialog */}
			<SessionConfirmationDialog
				isOpen={isConfirmingFinish}
				onClose={cancelFinish}
				onConfirm={() => executeFinish(finishStatus!)}
				progressData={progressData}
				routineName={routine!.name}
				isFinishing={isFinishing}
			/>
		</div>
	)
}
