'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'

import { useWeightUnit } from '@/hooks/use-weight-unit'
import { cn } from '@/lib/utils'
import type { ExerciseGroup } from '@/lib/utils/exercise-groups'
import { formatMuscleGroups } from '@/lib/utils/muscle-groups'

import { ExerciseNoteButton } from './session-notes'
import { SetComparisonRow } from './set-comparison-row'

interface HistoryExerciseGroupProps {
	group: ExerciseGroup
	collapsed: boolean
	onToggle: () => void
	/** LIVE-16: the owner's note on this exercise for this workout. */
	sessionNote?: string | null
	/** Present when the notes can be edited (a completed workout). */
	sessionId?: string
}

/**
 * One exercise in a finished session, as a ruled entry on the page rather than a
 * card (§11.5) — the same shape as the live session's `ExerciseGroup`, so a
 * session reads the same during and after. A fully completed exercise takes the
 * `--success` mark (§4.3 rule 2), which is per-item information, not a second
 * statement of the session's progress (§11.8).
 */
export function HistoryExerciseGroup({
	group,
	collapsed,
	onToggle,
	sessionNote,
	sessionId,
}: HistoryExerciseGroupProps) {
	const weightUnit = useWeightUnit()
	// LIVE-15: added sets count as sets of this exercise, like prescribed ones.
	const totalSets = group.plannedSets.length + group.extraSets.length
	const completedSets =
		group.plannedSets.filter(
			plannedSet =>
				group.performedSets.find(set => set.setNumber === plannedSet.setNumber)
					?.isCompleted,
		).length + group.extraSets.filter(set => set.isCompleted).length
	const isComplete = totalSets > 0 && completedSets === totalSets
	const panelId = `history-exercise-${group.routineExerciseId}`

	return (
		<section
			className={cn('rule-row mark py-4 pl-3', isComplete && 'mark-success')}
		>
			{/* A native button, so the toggle needs no hand-rolled key handler and
			    reports its state. It was a `role="button"` card header. The note
			    control sits beside it, never inside: a button in a button is
			    invalid and would toggle the exercise when pressed. */}
			<div className="flex items-start gap-2">
				<button
					type="button"
					onClick={onToggle}
					aria-expanded={!collapsed}
					aria-controls={panelId}
					className="flex w-full items-center gap-3 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
				>
					{collapsed ? (
						<ChevronRight className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />
					) : (
						<ChevronDown className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />
					)}
					<div className="min-w-0 flex-1">
						<h3 className="type-panel text-foreground">
							{group.exercise.name}
						</h3>
						<p className="type-body-sm mt-0.5 text-ink-3">
							{formatMuscleGroups(group.exercise.primaryMuscles)}
							{group.exercise.equipment ? ` · ${group.exercise.equipment}` : ''}
						</p>
						{group.substitutedFrom ? (
							<p className="type-body-sm text-ink-3">
								Swapped from {group.substitutedFrom.name}
							</p>
						) : null}
					</div>
					<span className="type-data shrink-0 text-ink-3">
						{completedSets}/{totalSets} sets
					</span>
				</button>
				{sessionId ? (
					<ExerciseNoteButton
						sessionId={sessionId}
						routineExerciseId={group.routineExerciseId}
						exerciseName={group.exercise.name}
						note={sessionNote ?? null}
					/>
				) : null}
			</div>
			{sessionNote ? (
				<p className="type-body-sm mt-2 whitespace-pre-line pl-7 text-ink-2">
					Your note: {sessionNote}
				</p>
			) : null}

			{!collapsed && (
				<div id={panelId} className="mt-3 pl-7">
					{/* Captions are Body small in sentence case (§5.3). */}
					<div className="type-body-sm mb-1 hidden grid-cols-12 gap-2 border-b border-rule-faint pb-1 text-ink-3 sm:grid">
						<div className="col-span-2">Set</div>
						<div className="col-span-3">Planned</div>
						<div className="col-span-2">Reps</div>
						<div className="col-span-2">Weight</div>
						<div className="col-span-2">RPE</div>
						<div className="col-span-1 text-center">Done</div>
					</div>

					<div>
						{group.plannedSets.map(plannedSet => {
							const performedSet = group.performedSets.find(
								set => set.setNumber === plannedSet.setNumber,
							)
							return (
								<SetComparisonRow
									key={`${group.routineExerciseId}-${plannedSet.id ?? plannedSet.setNumber}`}
									setNumber={plannedSet.setNumber}
									plannedSet={plannedSet}
									performedSet={performedSet}
									weightUnit={weightUnit}
								/>
							)
						})}
						{group.extraSets.map(set => (
							<SetComparisonRow
								key={`${group.routineExerciseId}-extra-${set.setNumber}`}
								setNumber={set.setNumber}
								performedSet={set}
								weightUnit={weightUnit}
							/>
						))}
					</div>
				</div>
			)}
		</section>
	)
}
