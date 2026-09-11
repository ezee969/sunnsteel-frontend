'use client'

import type { WeightUnit } from '@sunsteel/contracts'
import { Check, Minus } from 'lucide-react'

import type { SetLog } from '@/lib/api/types/workout.type'
import type { ExerciseGroup } from '@/lib/utils/exercise-groups'
import { formatWeight as formatPlannedWeight } from '@/lib/utils/weight-unit'
import { formatReps, formatWeight } from '@/lib/utils/workout-metrics'

interface SetComparisonRowProps {
	plannedSet: ExerciseGroup['plannedSets'][number]
	performedSet?: SetLog
	weightUnit: WeightUnit
}

/**
 * A logged set against its prescription, as a ruled ledger line. The session's
 * boxed set rows are editable wells (§11.5 keeps those boxed); this one is a
 * record, so it is ruled. Below `sm` the captions sit above each value; from
 * `sm` the group's column header carries them.
 */
export function SetComparisonRow({
	plannedSet,
	performedSet,
	weightUnit,
}: SetComparisonRowProps) {
	const isCompleted = Boolean(performedSet?.isCompleted)

	// Completion is the glyph plus its name, in `--success` (§4.3 rules 2, 8).
	// It was a filled-ink badge, the primary control's colour.
	const completion = (
		<span className={isCompleted ? 'text-success-strong' : 'text-ink-3'}>
			{isCompleted ? (
				<Check className="h-4 w-4" aria-hidden />
			) : (
				<Minus className="h-4 w-4" aria-hidden />
			)}
			<span className="sr-only">
				{isCompleted ? 'Completed' : 'Not completed'}
			</span>
		</span>
	)

	return (
		<div className="rule-row grid grid-cols-3 gap-x-4 gap-y-2 py-3 sm:grid-cols-12 sm:items-center sm:gap-2 sm:py-2">
			<div className="col-span-3 flex items-center justify-between sm:col-span-2">
				<span className="type-label text-foreground">
					Set {plannedSet.setNumber}
				</span>
				<span className="sm:hidden">{completion}</span>
			</div>

			<div className="col-span-3 sm:col-span-3">
				<div className="type-body-sm text-ink-3 sm:hidden">Planned</div>
				<div className="type-data text-ink-2">
					{plannedSet.repType === 'FIXED'
						? `${plannedSet.reps} reps`
						: `${plannedSet.minReps}-${plannedSet.maxReps} reps`}
					{plannedSet.weight
						? ` @ ${formatPlannedWeight(plannedSet.weight, weightUnit)}`
						: null}
				</div>
			</div>

			<div className="sm:col-span-2">
				<div className="type-body-sm text-ink-3 sm:hidden">Reps</div>
				<div className="type-data type-data-strong text-foreground">
					{formatReps(performedSet?.reps)}
				</div>
			</div>

			<div className="sm:col-span-2">
				<div className="type-body-sm text-ink-3 sm:hidden">Weight</div>
				<div className="type-data type-data-strong text-foreground">
					{formatWeight(performedSet?.weight, weightUnit)}
				</div>
			</div>

			<div className="sm:col-span-2">
				<div className="type-body-sm text-ink-3 sm:hidden">RPE</div>
				<div className="type-data text-ink-2">
					{performedSet?.rpe ? `${performedSet.rpe}/10` : '—'}
				</div>
			</div>

			<div className="hidden justify-center sm:col-span-1 sm:flex">
				{completion}
			</div>
		</div>
	)
}
