import type { WeightUnit } from '@sunsteel/contracts'
import { ChevronsUpDown, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

import type { RoutineWizardExercise, SetField } from '../types'
import {
	isLinearExercise,
	isLpWorkingSet,
	lpWorkingSetTarget,
} from '../utils/linear-block'
import { isWeightLocked } from '../utils/set-kinds'
import { SET_ROW_COLUMNS, SET_ROW_COLUMNS_SIMPLE, SetRow } from './SetRow'
import { WarmUpRampDialog } from './WarmUpRampDialog'

interface SetListSectionProps {
	weightUnit: WeightUnit
	exercise: RoutineWizardExercise
	exerciseIndex: number
	tabIndex: number
	setsExpanded: boolean
	onToggleSets: () => void
	onAddSet: () => void
	exerciseName: string
	equipmentRequired?: readonly string[]
	onReplaceWarmUps: (
		warmUps: { weightKg: number; reps: number; share: number }[],
		followLoad: boolean,
	) => void
	onSetWarmUpsFollowLoad: (followLoad: boolean) => void
	/** UX-20: the exercise's "More options" are shown. */
	advanced: boolean
	registerSetRowRef: (setIndex: number, node: HTMLDivElement | null) => void
	onUpdateSet: (
		exerciseIndex: number,
		setIndex: number,
		field: SetField,
		value: string | number | null,
	) => void
	onValidateMinMaxReps: (
		exerciseIndex: number,
		setIndex: number,
		field: 'minReps' | 'maxReps',
	) => void
	onStepFixedReps: (
		exerciseIndex: number,
		setIndex: number,
		delta: number,
	) => void
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
	weightUnit,
	exercise,
	exerciseIndex,
	tabIndex,
	setsExpanded,
	onToggleSets,
	onAddSet,
	exerciseName,
	equipmentRequired,
	onReplaceWarmUps,
	onSetWarmUpsFollowLoad,
	advanced,
	registerSetRowRef,
	onUpdateSet,
	onValidateMinMaxReps,
	onStepFixedReps,
	onStepRangeReps,
	onStepWeight,
	onRemoveSetAnimated,
	isRemovingSet,
}: SetListSectionProps) {
	const t = useTranslations('routines.builder')
	const tBlock = useTranslations('routines.linearBlock')
	// ROUT-17: the block's working sets are read-only, numbered among
	// themselves for their targets.
	const linear = isLinearExercise(exercise)
	const workingIndex = (setIndex: number) =>
		exercise.sets
			.slice(0, setIndex)
			.filter(set => isLpWorkingSet(exercise, set)).length
	return (
		<>
			<div className="flex items-center justify-between mb-2 px-1">
				<h5 className="text-sm font-medium">{t('sets')}</h5>
				<Button
					variant="ghost"
					size="sm"
					aria-label={t('toggleSetRows')}
					aria-expanded={setsExpanded}
					aria-controls={`sets-list-${tabIndex}-${exerciseIndex}`}
					onClick={onToggleSets}
					className="h-8 w-8 p-0"
				>
					<ChevronsUpDown
						aria-hidden
						className={`h-4 w-4 transition-transform duration-[var(--motion-slow)] ease-standard ${
							setsExpanded ? 'rotate-180' : ''
						}`}
					/>
				</Button>
			</div>

			{setsExpanded && (
				<div id={`sets-list-${tabIndex}-${exerciseIndex}`}>
					{/* TD-50: headings only over the one-line row, on its columns. */}
					<div
						className={`hidden lg:grid gap-2 text-xs font-medium text-muted-foreground mb-2 ${
							advanced ? SET_ROW_COLUMNS : SET_ROW_COLUMNS_SIMPLE
						}`}
					>
						<div>{t('columnSet')}</div>
						{advanced ? <div>{t('columnKind')}</div> : null}
						<div>{t('columnType')}</div>
						<div>{t('columnReps')}</div>
						<div>
							{t('columnWeight', {
								unit: weightUnit === 'LB' ? 'lb' : 'kg',
							})}
						</div>
						{advanced ? <div>{t('columnRir')}</div> : null}
						<div />
					</div>

					<div className="space-y-1.5">
						{exercise.sets.map((set, setIndex) => (
							<div
								key={setIndex}
								ref={node => registerSetRowRef(setIndex, node)}
							>
								<SetRow
									weightUnit={weightUnit}
									exerciseIndex={exerciseIndex}
									setIndex={setIndex}
									set={set}
									progressionScheme={exercise.progressionScheme}
									onUpdateSet={onUpdateSet}
									onValidateMinMaxReps={onValidateMinMaxReps}
									onStepFixedReps={onStepFixedReps}
									onStepRangeReps={onStepRangeReps}
									onStepWeight={onStepWeight}
									onRemoveSet={() =>
										onRemoveSetAnimated(exerciseIndex, setIndex)
									}
									isRemoving={isRemovingSet(exerciseIndex, setIndex)}
									disableRemove={exercise.sets.length === 1}
									weightLocked={isWeightLocked(
										exercise.sets,
										setIndex,
										exercise.progressionScheme,
										exercise.warmUpsFollowLoad,
									)}
									advanced={advanced}
									lpWorking={
										isLpWorkingSet(exercise, set)
											? {
													target: lpWorkingSetTarget(
														exercise.linearPeriodization,
														workingIndex(setIndex),
														tBlock,
													),
												}
											: undefined
									}
								/>
							</div>
						))}
					</div>

					<div className="mt-3 pt-3 border-t border-muted sm:border-0">
						{linear ? (
							<p className="type-body-sm mb-3 text-ink-3">
								{tBlock('workingSetsLocked')}
							</p>
						) : (
							<Button
								data-testid={`add-set-btn-${tabIndex}-${exerciseIndex}`}
								onClick={onAddSet}
								variant="outline"
								className="w-full h-10 text-base mb-3"
								disabled={exercise.sets.length >= 10}
							>
								<Plus aria-hidden className="h-4 w-4 mr-2" />
								{t('addSet')}
							</Button>
						)}
						{advanced ? (
							<WarmUpRampDialog
								exerciseName={exerciseName}
								sets={exercise.sets}
								equipmentRequired={equipmentRequired}
								incrementKg={exercise.minWeightIncrement}
								weightUnit={weightUnit}
								onApply={onReplaceWarmUps}
								warmUpsFollowLoad={exercise.warmUpsFollowLoad}
							/>
						) : null}
						{/* LIVE-20: only generated warm-ups know their share, so only
						    they can follow; hand-written ones keep their loads. */}
						{exercise.sets.some(
							set =>
								set.kind === 'WARMUP' && typeof set.warmUpShare === 'number',
						) ? (
							<div className="-mt-1 mb-3 flex items-center gap-1">
								<label
									htmlFor={`warm-ups-follow-${tabIndex}-${exerciseIndex}`}
									className="flex size-11 shrink-0 cursor-pointer items-center justify-center"
								>
									<Checkbox
										id={`warm-ups-follow-${tabIndex}-${exerciseIndex}`}
										checked={Boolean(exercise.warmUpsFollowLoad)}
										onCheckedChange={checked =>
											onSetWarmUpsFollowLoad(checked === true)
										}
									/>
								</label>
								<Label
									htmlFor={`warm-ups-follow-${tabIndex}-${exerciseIndex}`}
									className="cursor-pointer"
								>
									{t('warmUpsFollow')}
								</Label>
							</div>
						) : null}
					</div>
				</div>
			)}
		</>
	)
}
