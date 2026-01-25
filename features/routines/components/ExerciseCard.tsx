'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { useRtFWeekGoals } from '@/lib/api/hooks/useRoutines'
import {
	getCurrentProgramWeek,
	isDeloadWeek,
	getRtfVariant,
	isRtfProgressionScheme,
} from '@/lib/utils/rtf-week-calculator'
import { formatTime } from '@/lib/utils/time'
import { FileText, Clock } from 'lucide-react'
import { useMemo } from 'react'
import { RtfExerciseGoal } from '@/lib/api/types/rtf.types'

interface ExerciseCardProps {
	exercise: {
		id: string
		exercise?: {
			name: string
		}
		note?: string | null
		restSeconds?: number | null
		progressionScheme?: string
		programTMKg?: number
		programRoundingKg?: number
		sets?: {
			id?: string
			setNumber?: number
			reps?: number | null
			minReps?: number | null
			maxReps?: number | null
			weight?: number | null
			rir?: number | null
			rpe?: number
		}[]
	}
	routineId?: string
	routine?: {
		id?: string
		programStartDate?: string | null
		programDurationWeeks?: number | null
		programTimezone?: string | null
		programWithDeloads?: boolean | null
	}
}

/**
 * Card component for displaying exercise details within routine days
 *
 * Features:
 * - Exercise name and progression scheme display
 * - Set details with reps, weight, and RPE
 * - RtF-specific display with intensity, AMRAP sets, and variant badges
 * - Deload week indicators
 * - Numbered set indicators
 */
export const ExerciseCard = ({ exercise, routine }: ExerciseCardProps) => {
	// Calculate current week for RtF exercises
	const currentWeek = useMemo(() => {
		if (
			!routine?.programStartDate ||
			!routine?.programDurationWeeks ||
			!routine?.programTimezone
		) {
			return undefined
		}

		return getCurrentProgramWeek(
			routine.programStartDate,
			routine.programDurationWeeks,
			routine.programTimezone,
		)
	}, [
		routine?.programStartDate,
		routine?.programDurationWeeks,
		routine?.programTimezone,
	])

	// Determine if this is an RtF exercise based on progressionScheme
	const isRtfExercise =
		exercise.progressionScheme &&
		isRtfProgressionScheme(exercise.progressionScheme)

	// Fetch RtF week goals for the routine - only fetch if we have the necessary data
	const { data: rtfData } = useRtFWeekGoals(
		routine?.id || '',
		currentWeek || undefined,
	)

	// Find the specific exercise goal for this exercise
	const exerciseGoal = useMemo((): RtfExerciseGoal | undefined => {
		if (!rtfData?.rtfGoals?.goals || !exercise.exercise?.name) {
			return undefined
		}

		return rtfData.rtfGoals.goals.find(
			goal => goal.exerciseName === exercise.exercise?.name,
		)
	}, [rtfData?.rtfGoals?.goals, exercise.exercise?.name])

	// Check if current week is a deload week
	const isCurrentDeloadWeek = useMemo(() => {
		if (!currentWeek || !routine?.programWithDeloads) return false
		return isDeloadWeek(currentWeek, routine.programWithDeloads)
	}, [currentWeek, routine?.programWithDeloads])

	const rtfVariant = exercise.progressionScheme
		? getRtfVariant(exercise.progressionScheme)
		: null

	return (
		<div className="border rounded-lg p-4 bg-card">
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2">
					<h4 className="font-medium">
						{exercise.exercise?.name || 'Unknown Exercise'}
					</h4>
					{exercise.note && (
						<Dialog>
							<DialogTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 relative"
								>
									<FileText className="h-4 w-4 text-yellow-500" />
									<span className="absolute top-0 right-0">
										<svg
											width="6"
											height="6"
											viewBox="0 0 10 10"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<circle
												cx="4"
												cy="4"
												r="4"
												fill="#FACC15"
												stroke="#FFF"
												strokeWidth="0"
											/>
											<text
												x="4"
												y="6"
												textAnchor="middle"
												fontSize="5"
												fill="#FFF"
												fontWeight="bold"
											>
												!
											</text>
										</svg>
									</span>
									<span className="sr-only">View Note</span>
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Exercise Note</DialogTitle>
								</DialogHeader>
								<div className="p-4 bg-muted/20 rounded-md">
									<p className="text-sm whitespace-pre-wrap">{exercise.note}</p>
								</div>
							</DialogContent>
						</Dialog>
					)}
				</div>
				<div className="flex items-center gap-2">
					{exercise.restSeconds ? (
						<div className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
							<Clock className="h-3 w-3" />
							<span>{formatTime(exercise.restSeconds)}</span>
						</div>
					) : null}
					{exercise.progressionScheme && (
						<Badge variant="outline" className="text-xs">
							{exercise.progressionScheme.replace(/_/g, ' ')}
						</Badge>
					)}
					{rtfVariant && (
						<Badge
							variant={rtfVariant === 'HYPERTROPHY' ? 'secondary' : 'default'}
							className="text-xs"
						>
							{rtfVariant}
						</Badge>
					)}
					{isCurrentDeloadWeek && (
						<Badge variant="destructive" className="text-xs">
							Deload
						</Badge>
					)}
				</div>
			</div>

			{/* RtF-specific display */}
			{exerciseGoal && (
				<div className="mb-3 p-3 bg-muted/50 rounded-md">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-medium text-muted-foreground">
							Week {currentWeek} Goals
						</span>
						<span className="text-sm font-semibold text-primary">
							{Math.round(exerciseGoal.intensity * 100)}% Intensity
						</span>
					</div>

					<div className="grid grid-cols-2 gap-3 text-sm">
						<div>
							<div className="font-medium">{exerciseGoal.fixedReps} reps</div>
							<div className="text-muted-foreground">Base Sets</div>
						</div>
						<div>
							<div className="font-medium">{exerciseGoal.setsPlanned} sets</div>
							<div className="text-muted-foreground">Total</div>
						</div>
					</div>

					{/* Working weight display */}
					{exerciseGoal.workingWeightKg !== undefined && (
						<div className="mt-2 pt-2 border-t border-muted">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Working Weight:</span>
								<span className="font-medium">
									{exerciseGoal.workingWeightKg}kg
								</span>
							</div>
						</div>
					)}

					{exerciseGoal.amrapTarget && !exerciseGoal.isDeload && (
						<div className="mt-2 pt-2 border-t border-muted">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">AMRAP Target:</span>
								<span className="font-medium text-primary">
									{exerciseGoal.amrapTarget}+ reps
								</span>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Traditional set display for non-RtF exercises or when RtF data is not available */}
			{!exerciseGoal && exercise.sets && exercise.sets.length > 0 && (
				<div className="space-y-1">
					<p className="text-sm text-muted-foreground">
						{isRtfExercise ? 'Configured Sets:' : 'Sets:'}
					</p>
					{exercise.sets.map((set, index) => {
						// Since exerciseGoal is not available, use original logic for all exercises
						const repDisplay =
							set.minReps && set.maxReps
								? `${set.minReps}-${set.maxReps}`
								: String(set.reps || set.minReps || 0)

						// For RtF exercises, calculate weight from TM and current week intensity
						let displayWeight = set.weight || 0

						if (
							isRtfExercise &&
							currentWeek &&
							routine?.programWithDeloads !== undefined &&
							exercise.programTMKg
						) {
							// Calculate intensity for current week (simplified calculation)
							// This is a fallback when RtF data is not available
							const baseIntensity = 0.7 + (currentWeek - 1) * 0.01 // Simple progression
							const roundingKg = exercise.programRoundingKg || 2.5
							displayWeight =
								Math.round(
									(exercise.programTMKg * baseIntensity) / roundingKg,
								) * roundingKg
						}

						return (
							<div
								key={set.id || index}
								className="text-sm flex items-center gap-2"
							>
								<span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
									{index + 1}
								</span>
								<span>
									{repDisplay} @ {displayWeight}kg
									{set.rpe && ` (RPE ${set.rpe})`}
									{set.rir !== null &&
										set.rir !== undefined &&
										` (RIR ${set.rir})`}
								</span>
							</div>
						)
					})}
				</div>
			)}

			{/* Show message when RtF exercise has no traditional sets configured */}
			{isRtfExercise &&
				(!exercise.sets || exercise.sets.length === 0) &&
				!exerciseGoal && (
					<div className="text-sm text-muted-foreground italic">
						RtF progression - sets determined by weekly program
					</div>
				)}
		</div>
	)
}
