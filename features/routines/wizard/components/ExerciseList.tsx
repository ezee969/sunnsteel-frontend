'use client'

import { AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { GripVertical } from 'lucide-react'
import type { Exercise } from '@/lib/api/types'
import type { RoutineWizardData } from '../types'
import { ExerciseCard, type ExerciseCardProps } from '../ExerciseCard'

export interface ExerciseListProps {
	tabIndex: number
	day?: RoutineWizardData['days'][number]
	exercisesCatalog?: Exercise[]
	expandedMap: Record<string, boolean>
	onToggleExpand: (exerciseKey: string) => void
	onRemoveExercise: (exerciseIndex: number) => void
	onReorderExercises: (
		newExercises: RoutineWizardData['days'][number]['exercises'],
	) => void
	onUpdateExercise: ExerciseCardProps['onUpdateExercise']
	onUpdateRestTime: ExerciseCardProps['onUpdateRestTime']
	onUpdateNote: ExerciseCardProps['onUpdateNote']
	onUpdateProgressionScheme: ExerciseCardProps['onUpdateProgressionScheme']
	onUpdateMinWeightIncrement: ExerciseCardProps['onUpdateMinWeightIncrement']
	onUpdateProgramTMKg: ExerciseCardProps['onUpdateProgramTMKg']
	onUpdateProgramRoundingKg: ExerciseCardProps['onUpdateProgramRoundingKg']
	onAddSet: ExerciseCardProps['onAddSet']
	onRemoveSetAnimated: ExerciseCardProps['onRemoveSetAnimated']
	onUpdateSet: ExerciseCardProps['onUpdateSet']
	onValidateMinMaxReps: ExerciseCardProps['onValidateMinMaxReps']
	onStepFixedReps: ExerciseCardProps['onStepFixedReps']
	onStepRangeReps: ExerciseCardProps['onStepRangeReps']
	onStepWeight: ExerciseCardProps['onStepWeight']
	isRemovingSet: ExerciseCardProps['isRemovingSet']
	disableTimeBasedProgressions?: boolean
	registerRef: (key: string, node: HTMLDivElement | null) => void
	exercises?: Exercise[]
	isExercisesLoading?: boolean
}

export function ExerciseList({
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
	onUpdateProgramTMKg,
	onUpdateProgramRoundingKg,
	onAddSet,
	onRemoveSetAnimated,
	onUpdateSet,
	onValidateMinMaxReps,
	onStepFixedReps,
	onStepRangeReps,
	onStepWeight,
	isRemovingSet,
	disableTimeBasedProgressions = false,
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

						return (
							<ReorderableExerciseRow
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
								onUpdateProgramTMKg={onUpdateProgramTMKg}
								onUpdateProgramRoundingKg={onUpdateProgramRoundingKg}
								onAddSet={onAddSet}
								onRemoveSetAnimated={onRemoveSetAnimated}
								onUpdateSet={onUpdateSet}
								onValidateMinMaxReps={onValidateMinMaxReps}
								onStepFixedReps={onStepFixedReps}
								onStepRangeReps={onStepRangeReps}
								onStepWeight={onStepWeight}
								isRemovingSet={isRemovingSet}
								disableTimeBasedProgressions={disableTimeBasedProgressions}
								registerRef={registerRef}
								exercises={exercises}
								isExercisesLoading={isExercisesLoading}
							/>
						)
					})}
				</AnimatePresence>
			</Reorder.Group>
		</div>
	)
}

interface ReorderableExerciseRowProps {
	exerciseKey: string
	tabIndex: number
	exerciseIndex: number
	exercise: RoutineWizardData['days'][number]['exercises'][number]
	exerciseData?: Exercise
	expanded: boolean
	onToggleExpand: () => void
	onRemoveExercise: ExerciseCardProps['onRemoveExercise']
	onUpdateExercise: ExerciseCardProps['onUpdateExercise']
	onUpdateRestTime: ExerciseCardProps['onUpdateRestTime']
	onUpdateNote: ExerciseCardProps['onUpdateNote']
	onUpdateProgressionScheme: ExerciseCardProps['onUpdateProgressionScheme']
	onUpdateMinWeightIncrement: ExerciseCardProps['onUpdateMinWeightIncrement']
	onUpdateProgramTMKg: ExerciseCardProps['onUpdateProgramTMKg']
	onUpdateProgramRoundingKg: ExerciseCardProps['onUpdateProgramRoundingKg']
	onAddSet: ExerciseCardProps['onAddSet']
	onRemoveSetAnimated: ExerciseCardProps['onRemoveSetAnimated']
	onUpdateSet: ExerciseCardProps['onUpdateSet']
	onValidateMinMaxReps: ExerciseCardProps['onValidateMinMaxReps']
	onStepFixedReps: ExerciseCardProps['onStepFixedReps']
	onStepRangeReps: ExerciseCardProps['onStepRangeReps']
	onStepWeight: ExerciseCardProps['onStepWeight']
	isRemovingSet: ExerciseCardProps['isRemovingSet']
	disableTimeBasedProgressions?: boolean
	registerRef: (key: string, node: HTMLDivElement | null) => void
	exercises?: Exercise[]
	isExercisesLoading?: boolean
}

function ReorderableExerciseRow({
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
	onUpdateProgramTMKg,
	onUpdateProgramRoundingKg,
	onAddSet,
	onRemoveSetAnimated,
	onUpdateSet,
	onValidateMinMaxReps,
	onStepFixedReps,
	onStepRangeReps,
	onStepWeight,
	isRemovingSet,
	disableTimeBasedProgressions = false,
	registerRef,
	exercises,
	isExercisesLoading,
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
			ref={node => registerRef(exerciseKey, node)}
		>
			<ExerciseCard
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
				onUpdateProgramTMKg={onUpdateProgramTMKg}
				onUpdateProgramRoundingKg={onUpdateProgramRoundingKg}
				onAddSet={onAddSet}
				onRemoveSetAnimated={onRemoveSetAnimated}
				onUpdateSet={onUpdateSet}
				onValidateMinMaxReps={onValidateMinMaxReps}
				onStepFixedReps={onStepFixedReps}
				onStepRangeReps={onStepRangeReps}
				onStepWeight={onStepWeight}
				isRemovingSet={isRemovingSet}
				disableTimeBasedProgressions={disableTimeBasedProgressions}
				exercises={exercises}
				isExercisesLoading={isExercisesLoading}
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
						className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/50 hover:bg-muted hover:text-foreground cursor-grab active:cursor-grabbing touch-none transition-colors"
					>
						<GripVertical className="h-4 w-4" />
					</button>
				}
			/>
		</Reorder.Item>
	)
}

export default ExerciseList
