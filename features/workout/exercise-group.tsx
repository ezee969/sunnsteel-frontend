'use client'

import { ArrowLeftRight, ChevronDown, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import type { PreviousSetPerformance } from '@/lib/api/types/workout.type'
import { comparablePrevious } from '@/lib/utils/session-substitutions'
import type { UpsertSetLogPayload } from '@/lib/utils/workout-session.types'

import { PlateCalculatorDialog } from './plate-calculator-dialog'
import { ExerciseNoteButton } from './session-notes'
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
	sessionId: string
	/** The routine's own note: the standing instruction, shown, never edited here. */
	instruction?: string | null
	/** LIVE-16: what the owner noted about this exercise in this workout. */
	sessionNote?: string | null
	/** LIVE-11: the routine's own exercise when this slot was swapped. */
	substitutedFrom?: string | null
	/** Opens the swap dialog; omitted when the session cannot change. */
	onSwapRequest?: () => void
}

/**
 * Reusable component for displaying collapsible exercise groups with set logs
 */
export const ExerciseGroup = ({
	exerciseId,
	exerciseName,
	sets,
	isCollapsed,
	onToggleCollapse,
	completedSets,
	totalSets,
	onSave,
	previousSets,
	onSetCompleted,
	sessionId,
	instruction,
	sessionNote,
	substitutedFrom,
	onSwapRequest,
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
			className={`rule-row mark mark-fill py-4 pl-3 transition-colors duration-[var(--motion-slow)] ease-standard ${
				isComplete ? 'mark-success bg-surface/60' : ''
			}`}
		>
			<div className="flex items-center justify-between gap-2">
				<Button
					variant="ghost"
					onClick={onToggleCollapse}
					className="h-auto min-w-0 flex-1 justify-between rounded-none p-0 hover:bg-transparent"
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
							{substitutedFrom ? (
								<p className="type-body-sm line-clamp-1 text-ink-3">
									Swapped from {substitutedFrom}
								</p>
							) : null}
							{instruction ? (
								<p className="type-body-sm line-clamp-2 whitespace-normal text-ink-3">
									Routine note: {instruction}
								</p>
							) : null}
							{sessionNote ? (
								<p className="type-body-sm line-clamp-2 whitespace-normal text-ink-2">
									Your note: {sessionNote}
								</p>
							) : null}
						</div>
					</div>
				</Button>

				<div className="flex shrink-0 items-center gap-3">
					{onSwapRequest ? (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label={`Swap ${exerciseName}`}
							title="Swap exercise"
							onClick={event => {
								event.stopPropagation()
								onSwapRequest()
							}}
						>
							<ArrowLeftRight className="h-4 w-4" />
						</Button>
					) : null}

					{calculatorTarget ? (
						<PlateCalculatorDialog
							exerciseName={exerciseName}
							initialTargetWeightKg={calculatorTarget}
						/>
					) : null}

					{/* LIVE-16: a note for this workout. It used to write the
					    routine's own note, so a remark about today overwrote the
					    standing instruction for every workout after it. */}
					<ExerciseNoteButton
						sessionId={sessionId}
						routineExerciseId={exerciseId}
						exerciseName={exerciseName}
						note={sessionNote ?? null}
						instruction={instruction}
					/>

					{isComplete && (
						<span className="type-label text-success">Complete</span>
					)}
				</div>
			</div>

			{!isCollapsed && (
				<div className="mt-3 space-y-2">
					{sets.map(set => (
						<SetLogInput
							// The exercise is part of the key: a LIVE-11 swap must remount the
							// inputs, or values typed for the replaced exercise carry over.
							key={`${set.routineExerciseId}-${set.exerciseId}-${set.setNumber}`}
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
							// LIVE-11: last time counts only if it was the same exercise.
							previousPerformance={comparablePrevious(
								previousSets?.get(`${set.routineExerciseId}:${set.setNumber}`),
								set.exerciseId,
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
