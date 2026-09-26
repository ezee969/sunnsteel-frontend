'use client'

import {
	canLinkToNext,
	EXERCISE_GROUP_MAX,
	exerciseGroupLabel,
	exerciseGroupPosition,
	type WeightUnit,
} from '@sunsteel/contracts'
import { AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { GripVertical, Link2, Unlink2 } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import type { Exercise } from '@/lib/api/types'

import type { RoutineWizardData } from '../types'
import {
	WizardExerciseCard,
	type WizardExerciseCardProps,
} from '../WizardExerciseCard'

export interface ExerciseListProps {
	weightUnit: WeightUnit
	tabIndex: number
	day?: RoutineWizardData['days'][number]
	exercisesCatalog?: Exercise[]
	expandedMap: Record<string, boolean>
	onToggleExpand: (exerciseKey: string) => void
	onRemoveExercise: (exerciseIndex: number) => void
	onReorderExercises: (
		newExercises: RoutineWizardData['days'][number]['exercises'],
	) => void
	onUpdateExercise: WizardExerciseCardProps['onUpdateExercise']
	onUpdateRestTime: WizardExerciseCardProps['onUpdateRestTime']
	onUpdateNote: WizardExerciseCardProps['onUpdateNote']
	onUpdateProgressionScheme: WizardExerciseCardProps['onUpdateProgressionScheme']
	onUpdateMinWeightIncrement: WizardExerciseCardProps['onUpdateMinWeightIncrement']
	onAddSet: WizardExerciseCardProps['onAddSet']
	onReplaceWarmUps: WizardExerciseCardProps['onReplaceWarmUps']
	onSetWarmUpsFollowLoad: WizardExerciseCardProps['onSetWarmUpsFollowLoad']
	/** ROUT-12: link an exercise to the next one of the day, or unlink it. */
	onSetLinkedToNext: (exerciseIndex: number, linked: boolean) => void
	onRemoveSetAnimated: WizardExerciseCardProps['onRemoveSetAnimated']
	onUpdateSet: WizardExerciseCardProps['onUpdateSet']
	onValidateMinMaxReps: WizardExerciseCardProps['onValidateMinMaxReps']
	onStepFixedReps: WizardExerciseCardProps['onStepFixedReps']
	onStepRangeReps: WizardExerciseCardProps['onStepRangeReps']
	onStepWeight: WizardExerciseCardProps['onStepWeight']
	isRemovingSet: WizardExerciseCardProps['isRemovingSet']
	registerRef: (key: string, node: HTMLElement | null) => void
	exercises?: Exercise[]
	isExercisesLoading?: boolean
}

/**
 * Render the reorderable exercise cards for a routine day.
 *
 * The component resolves catalog metadata, forwards editing callbacks and
 * displays an empty state when the day has no exercises.
 *
 * @param day - Routine day whose exercises should be rendered
 * @param registerRef - Register an exercise row for scrolling and measurement
 * @returns The exercise list or its empty state
 */
export function ExerciseList({
	weightUnit,
	tabIndex,
	day,
	exercisesCatalog,
	expandedMap,
	onToggleExpand,
	onRemoveExercise,
	onReorderExercises,
	onUpdateExercise,
	onUpdateRestTime,
	onUpdateNote,
	onUpdateProgressionScheme,
	onUpdateMinWeightIncrement,
	onAddSet,
	onReplaceWarmUps,
	onSetWarmUpsFollowLoad,
	onSetLinkedToNext,
	onRemoveSetAnimated,
	onUpdateSet,
	onValidateMinMaxReps,
	onStepFixedReps,
	onStepRangeReps,
	onStepWeight,
	isRemovingSet,
	registerRef,
	exercises,
	isExercisesLoading,
}: ExerciseListProps) {
	if (!day || day.exercises.length === 0) {
		return (
			<div className="text-center text-sm text-muted-foreground py-8">
				No exercises added yet. Use &quot;Add Exercise&quot; to start building
				your day.
			</div>
		)
	}

	const dayExerciseIds = day.exercises.map(exercise => exercise.exerciseId)

	return (
		<div className="space-y-4">
			<Reorder.Group
				axis="y"
				values={day.exercises}
				onReorder={onReorderExercises}
				className="space-y-4"
			>
				<AnimatePresence>
					{day.exercises.map((exercise, exerciseIndex) => {
						const exerciseData = exercisesCatalog?.find(
							ex => ex.id === exercise.exerciseId,
						)
						const exerciseKey =
							exercise.clientId ?? `${exercise.exerciseId}-${exerciseIndex}`
						const expanded = expandedMap?.[exerciseKey] ?? true
						// ROUT-12: the exercise's place in a superset or circuit.
						const position = exerciseGroupPosition(day.exercises, exerciseIndex)
						const isLast = exerciseIndex === day.exercises.length - 1
						const linked = Boolean(exercise.linkedToNext) && !isLast
						const canLink = canLinkToNext(day.exercises, exerciseIndex)

						return (
							<ReorderableExerciseRow
								weightUnit={weightUnit}
								key={exerciseKey}
								exerciseKey={exerciseKey}
								tabIndex={tabIndex}
								exerciseIndex={exerciseIndex}
								exercise={exercise}
								exerciseData={exerciseData}
								expanded={expanded}
								onToggleExpand={() => onToggleExpand(exerciseKey)}
								onRemoveExercise={onRemoveExercise}
								onUpdateExercise={onUpdateExercise}
								onUpdateRestTime={onUpdateRestTime}
								onUpdateNote={onUpdateNote}
								onUpdateProgressionScheme={onUpdateProgressionScheme}
								onUpdateMinWeightIncrement={onUpdateMinWeightIncrement}
								onAddSet={onAddSet}
								onReplaceWarmUps={onReplaceWarmUps}
								onSetWarmUpsFollowLoad={onSetWarmUpsFollowLoad}
								onRemoveSetAnimated={onRemoveSetAnimated}
								onUpdateSet={onUpdateSet}
								onValidateMinMaxReps={onValidateMinMaxReps}
								onStepFixedReps={onStepFixedReps}
								onStepRangeReps={onStepRangeReps}
								onStepWeight={onStepWeight}
								isRemovingSet={isRemovingSet}
								registerRef={registerRef}
								exercises={exercises}
								isExercisesLoading={isExercisesLoading}
								dayExerciseIds={dayExerciseIds}
								groupLabel={position ? exerciseGroupLabel(position) : null}
								linkControl={
									isLast ? null : (
										<div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												aria-pressed={linked}
												disabled={!linked && !canLink}
												onClick={() =>
													onSetLinkedToNext(exerciseIndex, !linked)
												}
											>
												{linked ? (
													<Unlink2 className="size-4" aria-hidden />
												) : (
													<Link2 className="size-4" aria-hidden />
												)}
												{linked ? 'Unlink from next' : 'Do in rounds with next'}
											</Button>
											{!linked && !canLink ? (
												<span className="type-body-sm text-ink-3">
													A circuit holds at most {EXERCISE_GROUP_MAX}{' '}
													exercises.
												</span>
											) : null}
										</div>
									)
								}
							/>
						)
					})}
				</AnimatePresence>
			</Reorder.Group>
		</div>
	)
}

interface ReorderableExerciseRowProps {
	weightUnit: WeightUnit
	exerciseKey: string
	tabIndex: number
	exerciseIndex: number
	exercise: RoutineWizardData['days'][number]['exercises'][number]
	exerciseData?: Exercise
	expanded: boolean
	onToggleExpand: () => void
	onRemoveExercise: WizardExerciseCardProps['onRemoveExercise']
	onUpdateExercise: WizardExerciseCardProps['onUpdateExercise']
	onUpdateRestTime: WizardExerciseCardProps['onUpdateRestTime']
	onUpdateNote: WizardExerciseCardProps['onUpdateNote']
	onUpdateProgressionScheme: WizardExerciseCardProps['onUpdateProgressionScheme']
	onUpdateMinWeightIncrement: WizardExerciseCardProps['onUpdateMinWeightIncrement']
	onAddSet: WizardExerciseCardProps['onAddSet']
	onReplaceWarmUps: WizardExerciseCardProps['onReplaceWarmUps']
	onSetWarmUpsFollowLoad: WizardExerciseCardProps['onSetWarmUpsFollowLoad']
	onRemoveSetAnimated: WizardExerciseCardProps['onRemoveSetAnimated']
	onUpdateSet: WizardExerciseCardProps['onUpdateSet']
	onValidateMinMaxReps: WizardExerciseCardProps['onValidateMinMaxReps']
	onStepFixedReps: WizardExerciseCardProps['onStepFixedReps']
	onStepRangeReps: WizardExerciseCardProps['onStepRangeReps']
	onStepWeight: WizardExerciseCardProps['onStepWeight']
	isRemovingSet: WizardExerciseCardProps['isRemovingSet']
	registerRef: (key: string, node: HTMLElement | null) => void
	exercises?: Exercise[]
	isExercisesLoading?: boolean
	dayExerciseIds: string[]
	/** ROUT-12: "Superset A1", or null for an exercise on its own. */
	groupLabel: string | null
	linkControl: ReactNode
}

function ReorderableExerciseRow({
	weightUnit,
	exerciseKey,
	tabIndex,
	exerciseIndex,
	exercise,
	exerciseData,
	expanded,
	onToggleExpand,
	onRemoveExercise,
	onUpdateExercise,
	onUpdateRestTime,
	onUpdateNote,
	onUpdateProgressionScheme,
	onUpdateMinWeightIncrement,
	onAddSet,
	onReplaceWarmUps,
	onSetWarmUpsFollowLoad,
	onRemoveSetAnimated,
	onUpdateSet,
	onValidateMinMaxReps,
	onStepFixedReps,
	onStepRangeReps,
	onStepWeight,
	isRemovingSet,
	registerRef,
	exercises,
	isExercisesLoading,
	dayExerciseIds,
	groupLabel,
	linkControl,
}: ReorderableExerciseRowProps) {
	const dragControls = useDragControls()

	return (
		<Reorder.Item
			value={exercise}
			className="relative scroll-mt-24"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.2, ease: 'easeInOut' }}
			dragListener={false}
			dragControls={dragControls}
			whileDrag={{ zIndex: 60 }}
			ref={(node: HTMLLIElement | null) => registerRef(exerciseKey, node)}
		>
			{/* ROUT-12: a group's members share a left rule and name their place. */}
			<div
				className={
					groupLabel ? 'border-l-2 border-rule pl-2 sm:pl-3' : undefined
				}
			>
				{groupLabel ? (
					<p className="type-body-sm pb-1 text-ink-3">{groupLabel}</p>
				) : null}
				<WizardExerciseCard
					weightUnit={weightUnit}
					tabIndex={tabIndex}
					exerciseIndex={exerciseIndex}
					exercise={exercise}
					exerciseData={exerciseData}
					expanded={expanded}
					onToggleExpand={() => onToggleExpand()}
					onRemoveExercise={onRemoveExercise}
					onUpdateExercise={onUpdateExercise}
					onUpdateRestTime={onUpdateRestTime}
					onUpdateNote={onUpdateNote}
					onUpdateProgressionScheme={onUpdateProgressionScheme}
					onUpdateMinWeightIncrement={onUpdateMinWeightIncrement}
					onAddSet={onAddSet}
					onReplaceWarmUps={onReplaceWarmUps}
					onSetWarmUpsFollowLoad={onSetWarmUpsFollowLoad}
					onRemoveSetAnimated={onRemoveSetAnimated}
					onUpdateSet={onUpdateSet}
					onValidateMinMaxReps={onValidateMinMaxReps}
					onStepFixedReps={onStepFixedReps}
					onStepRangeReps={onStepRangeReps}
					onStepWeight={onStepWeight}
					isRemovingSet={isRemovingSet}
					exercises={exercises}
					isExercisesLoading={isExercisesLoading}
					dayExerciseIds={dayExerciseIds}
					dragHandle={
						<button
							type="button"
							aria-label="Reorder exercise"
							title="Drag to reorder"
							onPointerDown={e => {
								e.preventDefault()
								e.stopPropagation()
								dragControls.start(e)
							}}
							className="inline-flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-md text-muted-foreground/50 hover:bg-muted hover:text-foreground cursor-grab active:cursor-grabbing touch-none transition-colors"
						>
							<GripVertical className="h-4 w-4" />
						</button>
					}
				/>
				{linkControl}
			</div>
		</Reorder.Item>
	)
}

export default ExerciseList
