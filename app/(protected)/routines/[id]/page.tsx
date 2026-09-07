'use client'

import { Calendar, Play } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { RoutineDayAccordion } from '@/features/routines/components/RoutineDayAccordion'
import { RoutineHeader } from '@/features/routines/components/RoutineHeader'
import { WorkoutDialogs } from '@/features/routines/components/WorkoutDialogs'
import { useRoutineData } from '@/features/routines/hooks/useRoutineData'
import { useWorkoutSessionManager } from '@/features/routines/hooks/useWorkoutSessionManager'
import { getDayName } from '@/features/routines/utils/routine-detail.utils'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import {
	useRoutine,
	useToggleRoutineCompleted,
	useToggleRoutineFavorite,
} from '@/lib/api/hooks/useRoutines'
import { useActiveSession } from '@/lib/api/hooks/useWorkoutSession'
import { validateRoutineDayDate } from '@/lib/utils/date'
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

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="animate-pulse space-y-6">
					<div className="h-8 bg-muted rounded w-1/3"></div>
					<div className="h-4 bg-muted rounded w-2/3"></div>
					<div className="space-y-4">
						{[1, 2, 3].map(i => (
							<div key={i} className="h-20 bg-muted rounded"></div>
						))}
					</div>
				</div>
			</div>
		)
	}

	if (!routine) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-4">Routine not found</h1>
					<Button onClick={() => router.push('/routines')}>
						Back to Routines
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto px-4 py-8 space-y-8">
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

			{/* Quick Start Section */}
			{routine.days && routine.days.length > 0 && (
				<div className="space-y-4">
					<h2 className="text-xl font-semibold">Quick Start</h2>
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{routine.days.map(day => {
							const isToday = day.dayOfWeek === sessionManager.todayDow
							const hasActiveSession = activeSession?.routineDayId === day.id
							const isLoadingThisDay =
								sessionManager.isStarting &&
								sessionManager.startActingDayId === day.id

							// Check if this day can be started today
							const dayValidation = validateRoutineDayDate(day)
							const canStartToday = dayValidation.isValid

							return (
								<Button
									key={day.id}
									variant={
										hasActiveSession
											? 'default'
											: isToday
												? 'secondary'
												: 'outline'
									}
									className="h-auto p-4 flex flex-col items-start gap-2"
									disabled={
										isLoadingThisDay || (!hasActiveSession && !canStartToday)
									}
									onClick={() =>
										sessionManager.handleStart(day.id, activeSession)
									}
								>
									<div className="flex items-center gap-2 w-full">
										{isToday && <Calendar className="h-4 w-4" />}
										<span className="font-medium">
											{getDayName(day.dayOfWeek)}
										</span>
										{isLoadingThisDay && (
											<div className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
										)}
										{!isLoadingThisDay && <Play className="h-4 w-4 ml-auto" />}
									</div>
									<div className="text-xs text-left opacity-75">
										{day.exercises?.length || 0} exercises
									</div>
									{hasActiveSession && (
										<div className="text-xs font-medium text-primary">
											Resume Session
										</div>
									)}
									{!hasActiveSession && !canStartToday && (
										<div className="text-xs font-medium text-muted-foreground">
											Not scheduled for today
										</div>
									)}
								</Button>
							)
						})}
					</div>
				</div>
			)}

			{/* Routine Days */}
			{routine.days && routine.days.length > 0 && (
				<div className="space-y-4">
					<h2 className="text-xl font-semibold">Routine Days</h2>
					<RoutineDayAccordion
						weightUnit={weightUnit}
						days={routine.days}
						routine={{
							id: routine.id,
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
