import { Button } from '@/components/ui/button'
import { ChevronsUpDown, Plus } from 'lucide-react'
import type { RoutineWizardExercise } from '../types'
import { SetRow } from './SetRow'

interface SetListSectionProps {
	exercise: RoutineWizardExercise
	exerciseIndex: number
	tabIndex: number
	setsExpanded: boolean
	onToggleSets: () => void
	onAddSet: () => void
	registerSetRowRef: (setIndex: number, node: HTMLDivElement | null) => void
	onUpdateSet: (
		exerciseIndex: number,
		setIndex: number,
		field: 'repType' | 'reps' | 'minReps' | 'maxReps' | 'weight',
		value: string,
	) => void
	onValidateMinMaxReps: (
		exerciseIndex: number,
		setIndex: number,
		field: 'minReps' | 'maxReps',
	) => void
	onStepFixedReps: (exerciseIndex: number, setIndex: number, delta: number) => void
	onStepRangeReps: (
		exerciseIndex: number,
		setIndex: number,
		field: 'minReps' | 'maxReps',
		delta: number,
	) => void
	onStepWeight: (exerciseIndex: number, setIndex: number, delta: number) => void
	onRemoveSetAnimated: (exerciseIndex: number, setIndex: number) => void
	isRemovingSet: (exerciseIndex: number, setIndex: number) => boolean
}

/**
 * Render the collapsible "Sets" section for an exercise, including per-set rows and controls to add, update, and remove sets.
 *
 * @param exercise - The exercise data including its sets and progression scheme
 * @param exerciseIndex - Index of the exercise within the parent routine
 * @param tabIndex - Index used to scope ARIA ids and test ids for this section
 * @param setsExpanded - Whether the sets list is currently expanded
 * @param onToggleSets - Toggle handler for expanding/collapsing the sets list
 * @param onAddSet - Handler invoked when the "Add Set" button is clicked
 * @param registerSetRowRef - Callback to register a DOM ref for a set row: (setIndex, node) => void
 * @param onUpdateSet - Handler to update a set field for a given exercise and set index
 * @param onValidateMinMaxReps - Handler to validate min/max reps for a specific set
 * @param onStepFixedReps - Handler to increment/decrement fixed reps for a set
 * @param onStepRangeReps - Handler to increment/decrement min/max reps for a set
 * @param onStepWeight - Handler to increment/decrement weight for a set
 * @param onRemoveSetAnimated - Handler to request removal of a set with animation
 * @param isRemovingSet - Predicate that returns `true` if a given set is currently in a removing state
 * @returns The JSX element rendering the sets section and its controls
 */
export function SetListSection({
	exercise,
	exerciseIndex,
	tabIndex,
	setsExpanded,
	onToggleSets,
	onAddSet,
	registerSetRowRef,
	onUpdateSet,
	onValidateMinMaxReps,
	onStepFixedReps,
	onStepRangeReps,
	onStepWeight,
	onRemoveSetAnimated,
	isRemovingSet,
}: SetListSectionProps) {
	return (
		<>
			<div className="flex items-center justify-between mb-2 px-1">
				<h5 className="text-sm font-medium">Sets</h5>
				<Button
					variant="ghost"
					size="sm"
					aria-label="Toggle set rows"
					aria-expanded={setsExpanded}
					aria-controls={`sets-list-${tabIndex}-${exerciseIndex}`}
					onClick={onToggleSets}
					className="h-8 w-8 p-0"
				>
					<ChevronsUpDown
						className={`h-4 w-4 transition-transform duration-300 ease-in-out ${
							setsExpanded ? 'rotate-180' : ''
						}`}
					/>
				</Button>
			</div>

			{setsExpanded && (
				<div id={`sets-list-${tabIndex}-${exerciseIndex}`}>
					<div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground mb-2 px-1">
						<div className="col-span-2">Set</div>
						<div className="col-span-3">Type</div>
						<div className="col-span-3">Reps</div>
						<div className="col-span-2">Weight</div>
						<div className="col-span-2" />
					</div>

					<div className="space-y-1.5 px-2 sm:px-0">
						{exercise.sets.map((set, setIndex) => (
							<div
								key={setIndex}
								ref={(node) => registerSetRowRef(setIndex, node)}
							>
								<SetRow
									exerciseIndex={exerciseIndex}
									setIndex={setIndex}
									set={set}
									progressionScheme={exercise.progressionScheme}
									onUpdateSet={onUpdateSet}
									onValidateMinMaxReps={onValidateMinMaxReps}
									onStepFixedReps={onStepFixedReps}
									onStepRangeReps={onStepRangeReps}
									onStepWeight={onStepWeight}
									onRemoveSet={() => onRemoveSetAnimated(exerciseIndex, setIndex)}
									isRemoving={isRemovingSet(exerciseIndex, setIndex)}
									disableRemove={exercise.sets.length === 1}
								/>
							</div>
						))}
					</div>

					<div className="mt-3 pt-3 border-t border-muted px-2 sm:px-0 sm:border-0">
						<Button
							data-testid={`add-set-btn-${tabIndex}-${exerciseIndex}`}
							onClick={onAddSet}
							variant="outline"
							className="w-full h-10 text-base mb-3"
							disabled={
								exercise.sets.length >= 10 ||
								exercise.progressionScheme === 'PROGRAMMED_RTF' ||
								exercise.progressionScheme === 'PROGRAMMED_RTF_HYPERTROPHY'
							}
							title={
								exercise.progressionScheme === 'PROGRAMMED_RTF'
									? 'Sets are handled by RtF Standard progression (5 sets: 4 + 1 AMRAP)'
								: exercise.progressionScheme === 'PROGRAMMED_RTF_HYPERTROPHY'
								? 'Sets are handled by RtF Hypertrophy progression (4 sets: 3 + 1 AMRAP)'
								: undefined
							}
						>
							<Plus className="h-4 w-4 mr-2" />
							Add Set
						</Button>
					</div>
				</div>
			)}
		</>
	)
}
