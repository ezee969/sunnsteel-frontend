'use client'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatMuscleGroups } from '@/lib/utils/muscle-groups'
import { formatTime } from '@/lib/utils/time'
import type { Exercise } from '@/lib/api/types'
import type { RoutineWizardData } from '../types'
import { DAYS_OF_WEEK, getRtfSetSummary, isRtFExercise } from '../utils/routine-summary'

interface RoutineDayCardProps {
	day: RoutineWizardData['days'][number]
	exerciseMap: Record<string, Exercise>
}

/**
 * Render a card summarizing a routine day and its exercises.
 *
 * Renders the day's name, a badge with the number of exercises, and a list of exercise summaries including name, primary muscles, equipment, rest, and set information.
 *
 * @param day - A day entry from RoutineWizardData['days'] (contains dayOfWeek and exercises).
 * @param exerciseMap - A lookup map of Exercise objects keyed by exercise ID used to resolve exercise metadata.
 * @returns The JSX element for the day's routine card.
 */
export function RoutineDayCard({ day, exerciseMap }: RoutineDayCardProps) {
	const displayName = DAYS_OF_WEEK[day.dayOfWeek]

	return (
		<Card key={day.dayOfWeek} className="border rounded-md p-3">
			<h4 className="font-medium mb-2 flex items-center justify-between">
				{displayName}
				<Badge variant="outline">{day.exercises.length} exercises</Badge>
			</h4>
			<div className="space-y-3">
				{day.exercises.map((exercise, exerciseIndex) => {
					const meta = exerciseMap[exercise.exerciseId]
					const isRtF = isRtFExercise(exercise.progressionScheme)
					const summary = getRtfSetSummary(exercise.progressionScheme)

					return (
						<div key={exerciseIndex} className="border rounded-md p-3">
							<div className="flex items-start justify-between mb-2">
								<div>
									<h5 className="font-medium">{meta?.name ?? 'Exercise'}</h5>
									<p className="text-xs text-muted-foreground">
										{meta?.primaryMuscles
											? formatMuscleGroups(meta.primaryMuscles)
											: 'Unknown'} • {meta?.equipment ?? 'Unknown'}
									</p>
									{isRtF && (
										<div className="mt-1 flex flex-wrap gap-1">
											<Badge variant="outline" className="text-[10px]">
												{exercise.progressionScheme === 'PROGRAMMED_RTF_HYPERTROPHY'
													? 'RtF Hypertrophy'
													: 'RtF Standard'}
											</Badge>
											{exercise.programTMKg && (
												<Badge variant="secondary" className="text-[10px]">
													TM: {exercise.programTMKg}kg
												</Badge>
											)}
										</div>
									)}
								</div>
								<div className="flex items-center gap-1 text-xs text-muted-foreground pt-0.5">
									<span>{formatTime(exercise.restSeconds)} rest</span>
								</div>
							</div>

							<div className="flex flex-wrap gap-1.5">
								{isRtF
									? (
										<>
											<Badge variant="outline" className="text-xs font-normal">
												{summary.fixedSets} × {summary.repRange} reps (fixed)
											</Badge>
											<Badge variant="outline" className="text-xs font-normal">
												1 × AMRAP set
											</Badge>
										</>
									)
									: (
										<>
											{exercise.sets.map((set) => (
												<Badge key={set.setNumber} variant="outline" className="text-xs font-normal">
													{set.repType === 'FIXED'
														? `${set.reps ?? ''} reps`
														: `${set.minReps ?? ''}-${set.maxReps ?? ''} reps`}
													{set.weight ? ` @ ${set.weight}kg` : ''}
												</Badge>
											))}
										</>
									)}
							</div>
						</div>
					)
				})}
			</div>
		</Card>
	)
}
