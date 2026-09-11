'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ExerciseNoteRow } from '@/features/routines/wizard/components/ExerciseNoteRow'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import type { PreviousSetPerformance } from '@/lib/api/types/workout.type'
import type { UpsertSetLogPayload } from '@/lib/utils/workout-session.types'

import { PlateCalculatorDialog } from './plate-calculator-dialog'
import { SetLogInput } from './set-log-input'

interface ExerciseGroupProps {
	exerciseId: string
	exerciseName: string
	sets: Array<{
		id: string
		routineExerciseId: string
		sessionId: string
		exerciseId: string
		setNumber: number
		reps: number
		weight?: number
		rpe?: number
		isCompleted: boolean
		plannedReps?: number | null
		plannedMinReps?: number | null
		plannedMaxReps?: number | null
		plannedWeight?: number | null
		plannedRir?: number | null
	}>
	isCollapsed: boolean
	onToggleCollapse: () => void
	completedSets: number
	totalSets: number
	onSave: (payload: UpsertSetLogPayload) => void
	previousSets?: ReadonlyMap<string, PreviousSetPerformance>
	/** Fired when any set in this group is ticked complete (LIVE-01). */
	onSetCompleted?: () => void
	note?: string | null
	onSaveNote: (note: string) => void
}

/**
 * Reusable component for displaying collapsible exercise groups with set logs
 */
export const ExerciseGroup = ({
	exerciseName,
	sets,
	isCollapsed,
	onToggleCollapse,
	completedSets,
	totalSets,
	onSave,
	previousSets,
	onSetCompleted,
	note,
	onSaveNote,
}: ExerciseGroupProps) => {
	const isComplete = completedSets === totalSets && totalSets > 0
	const weightUnit = useWeightUnit()
	const nextWeightedSet =
		sets.find(
			set => !set.isCompleted && (set.plannedWeight ?? set.weight ?? 0) > 0,
		) ?? sets.find(set => (set.plannedWeight ?? set.weight ?? 0) > 0)
	const calculatorTarget = nextWeightedSet
		? (nextWeightedSet.plannedWeight ?? nextWeightedSet.weight)
		: undefined

	return (
		// De-boxed: a ruled entry on the page, not a card. The mark on the left
		// is what a completed exercise reads as at a glance — "done, as planned",
		// so it is `--success` (§4.3 rule 2), not gold.
		<section
			// Motion spec §2.9 signature 2: `mark-fill` makes the mark grow top to
			// bottom instead of appearing, and the row settles onto the completed
			// tone over the same 300ms. The fill is a transform on an overlay bar,
			// so completing a set never reflows the row.
			className={`mark mark-fill py-4 pl-3 transition-colors duration-[var(--motion-slow)] ease-standard ${
				isComplete ? 'mark-success bg-surface/60' : ''
			}`}
		>
			<div className="flex items-center justify-between gap-2">
				<Button
					variant="ghost"
					onClick={onToggleCollapse}
					className="h-auto flex-1 justify-between rounded-none p-0 hover:bg-transparent"
				>
					<div className="flex min-w-0 flex-1 items-center gap-3">
						{isCollapsed ? (
							<ChevronRight className="h-4 w-4 shrink-0 text-ink-3" />
						) : (
							<ChevronDown className="h-4 w-4 shrink-0 text-ink-3" />
						)}
						<div className="min-w-0 text-left">
							<h3 className="type-panel line-clamp-1 text-foreground">
								{exerciseName}
							</h3>
							<p className="type-data mt-0.5 text-ink-3">
								{completedSets}/{totalSets} sets
							</p>
						</div>
					</div>
				</Button>

				<div className="flex shrink-0 items-center gap-3">
					{calculatorTarget ? (
						<PlateCalculatorDialog
							exerciseName={exerciseName}
							initialTargetWeightKg={calculatorTarget}
						/>
					) : null}

					{/* Note button (stops propagation to prevent toggle) */}
					<div onClick={e => e.stopPropagation()}>
						<ExerciseNoteRow note={note} onSave={onSaveNote} minimal />
					</div>

					{isComplete && (
						<span className="type-label text-success">Complete</span>
					)}
				</div>
			</div>

			{!isCollapsed && (
				<div className="mt-3 space-y-2">
					{sets.map(set => (
						<SetLogInput
							key={`${set.routineExerciseId}-${set.setNumber}`}
							sessionId={set.sessionId}
							routineExerciseId={set.routineExerciseId}
							exerciseId={set.exerciseId}
							setNumber={set.setNumber}
							reps={set.reps}
							weight={set.weight}
							isCompleted={set.isCompleted}
							plannedReps={set.plannedReps}
							plannedMinReps={set.plannedMinReps}
							plannedMaxReps={set.plannedMaxReps}
							plannedWeight={set.plannedWeight}
							plannedRir={set.plannedRir}
							weightUnit={weightUnit}
							previousPerformance={previousSets?.get(
								`${set.routineExerciseId}:${set.setNumber}`,
							)}
							rpe={set.rpe}
							onSave={onSave}
							onSetCompleted={onSetCompleted}
						/>
					))}
				</div>
			)}
		</section>
	)
}
