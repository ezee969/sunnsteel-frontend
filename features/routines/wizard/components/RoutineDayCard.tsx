'use client'

import type { WeightUnit } from '@sunsteel/contracts'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { Exercise } from '@/lib/api/types'
import { formatMuscleGroups } from '@/lib/utils/muscle-groups'
import { formatExerciseCount } from '@/lib/utils/routine-format'
import { formatTime } from '@/lib/utils/time'
import { formatWeight } from '@/lib/utils/weight-unit'

import type { RoutineWizardData } from '../types'

interface RoutineDayCardProps {
	day: RoutineWizardData['days'][number]
	/** The day's title, e.g. "Monday · Push" or "Day B" (ROUT-11). */
	label: string
	exerciseMap: Record<string, Exercise>
	weightUnit: WeightUnit
}

/**
 * Render a card summarizing a routine day and its exercises.
 *
 * Renders the day's name, a badge with the number of exercises, and a list of exercise summaries including name, primary muscles, equipment, rest, and set information.
 *
 * @param day - A day entry from RoutineWizardData['days'] (its slot, name and exercises).
 * @param exerciseMap - A lookup map of Exercise objects keyed by exercise ID used to resolve exercise metadata.
 * @returns The JSX element for the day's routine card.
 */
export function RoutineDayCard({
	day,
	label,
	exerciseMap,
	weightUnit,
}: RoutineDayCardProps) {
	return (
		<Card className="border rounded-md p-3">
			<h4 className="type-panel mb-2 flex items-center justify-between text-foreground">
				{label}
				<Badge variant="outline">
					{formatExerciseCount(day.exercises.length)}
				</Badge>
			</h4>
			<div className="space-y-3">
				{day.exercises.map((exercise, exerciseIndex) => {
					const meta = exerciseMap[exercise.exerciseId]

					return (
						<div key={exerciseIndex} className="border rounded-md p-3">
							<div className="flex items-start justify-between mb-2">
								<div>
									<h5 className="font-medium">{meta?.name ?? 'Exercise'}</h5>
									<p className="text-xs text-muted-foreground">
										{meta?.primaryMuscles
											? formatMuscleGroups(meta.primaryMuscles)
											: 'Unknown'}{' '}
										• {meta?.equipment ?? 'Unknown'}
									</p>
									{exercise.note && (
										<p className="text-xs text-muted-foreground mt-1 italic">
											Note: {exercise.note}
										</p>
									)}
								</div>
								<div className="flex items-center gap-1 text-xs text-muted-foreground pt-0.5">
									<span>{formatTime(exercise.restSeconds)} rest</span>
								</div>
							</div>

							<div className="flex flex-wrap gap-1.5">
								{exercise.sets.map(set => (
									<Badge
										key={set.setNumber}
										variant="outline"
										className="text-xs font-normal"
									>
										{set.repType === 'FIXED'
											? `${set.reps ?? ''} reps`
											: `${set.minReps ?? ''}-${set.maxReps ?? ''} reps`}
										{set.weight
											? ` @ ${formatWeight(set.weight, weightUnit)}`
											: ''}
									</Badge>
								))}
							</div>
						</div>
					)
				})}
			</div>
		</Card>
	)
}
