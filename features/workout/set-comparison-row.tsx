'use client'

import type { WeightUnit } from '@sunsteel/contracts'

import { Badge } from '@/components/ui/badge'
import type { SetLog } from '@/lib/api/types/workout.type'
import type { ExerciseGroup } from '@/lib/utils/exercise-groups'
import { formatWeight as formatPlannedWeight } from '@/lib/utils/weight-unit'
import { formatReps, formatWeight } from '@/lib/utils/workout-metrics'

interface SetComparisonRowProps {
	plannedSet: ExerciseGroup['plannedSets'][number]
	performedSet?: SetLog
	weightUnit: WeightUnit
}

export function SetComparisonRow({
	plannedSet,
	performedSet,
	weightUnit,
}: SetComparisonRowProps) {
	return (
		<div className="bg-card border border-muted rounded-lg p-3 sm:p-0 sm:bg-transparent sm:border-0 sm:rounded-none">
			<div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-2 items-start sm:items-center">
				<div className="sm:col-span-2">
					<div className="flex items-center justify-between sm:justify-start">
						<Badge variant="outline" className="text-xs px-2 py-1">
							Set {plannedSet.setNumber}
						</Badge>
						<div className="sm:hidden">
							{performedSet?.isCompleted ? (
								<Badge variant="default" className="text-xs">
									✓
								</Badge>
							) : (
								<Badge variant="secondary" className="text-xs">
									—
								</Badge>
							)}
						</div>
					</div>
				</div>

				<div className="sm:col-span-3">
					<div className="space-y-1">
						<div className="sm:hidden text-xs font-medium text-muted-foreground">
							Planned
						</div>
						<div className="text-sm">
							{plannedSet.repType === 'FIXED'
								? `${plannedSet.reps} reps`
								: `${plannedSet.minReps}-${plannedSet.maxReps} reps`}
							{plannedSet.weight
								? ` @ ${formatPlannedWeight(plannedSet.weight, weightUnit)}`
								: null}
						</div>
					</div>
				</div>

				<div className="sm:col-span-2">
					<div className="space-y-1">
						<div className="sm:hidden text-xs font-medium text-muted-foreground">
							Reps
						</div>
						<div className="text-sm font-medium">
							{formatReps(performedSet?.reps)}
						</div>
					</div>
				</div>

				<div className="sm:col-span-2">
					<div className="space-y-1">
						<div className="sm:hidden text-xs font-medium text-muted-foreground">
							Weight
						</div>
						<div className="text-sm font-medium">
							{formatWeight(performedSet?.weight, weightUnit)}
						</div>
					</div>
				</div>

				<div className="sm:col-span-2">
					<div className="space-y-1">
						<div className="sm:hidden text-xs font-medium text-muted-foreground">
							RPE
						</div>
						<div className="text-sm">
							{performedSet?.rpe ? `${performedSet.rpe}/10` : '—'}
						</div>
					</div>
				</div>

				<div className="hidden sm:flex sm:col-span-1 justify-center">
					{performedSet?.isCompleted ? (
						<Badge variant="default" className="text-xs">
							✓
						</Badge>
					) : (
						<Badge variant="secondary" className="text-xs">
							—
						</Badge>
					)}
				</div>
			</div>
		</div>
	)
}
