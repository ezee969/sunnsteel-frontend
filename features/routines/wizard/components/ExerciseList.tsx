'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { Exercise } from '@/lib/api/types'
import type { RoutineWizardData } from '../types'
import { ExerciseCard, type ExerciseCardProps } from '../ExerciseCard'

export interface ExerciseListProps {
	tabIndex: number
	day?: RoutineWizardData['days'][number]
	exercisesCatalog?: Exercise[]
	expandedMap: Record<number, boolean>
	onToggleExpand: (exerciseIndex: number) => void
	onRemoveExercise: (exerciseIndex: number) => void
	onUpdateExercise: ExerciseCardProps['onUpdateExercise']
	onUpdateRestTime: ExerciseCardProps['onUpdateRestTime']
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
	onUpdateExercise,
	onUpdateRestTime,
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
				No exercises added yet. Use &quot;Add Exercise&quot; to start building your day.
			</div>
		)
	}

	return (
		<div className="space-y-4">
			<AnimatePresence>
				{day.exercises.map((exercise, exerciseIndex) => {
					const exerciseData = exercisesCatalog?.find(
						(ex) => ex.id === exercise.exerciseId,
					)
					const expanded = expandedMap?.[exerciseIndex] ?? true
					const key = `${exercise.exerciseId}-${exerciseIndex}`

					return (
						<motion.div
							key={key}
							ref={(node) => registerRef(key, node)}
							className="scroll-mt-24"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2, ease: 'easeInOut' }}
						>
							<ExerciseCard
								tabIndex={tabIndex}
								exerciseIndex={exerciseIndex}
								exercise={exercise}
								exerciseData={exerciseData}
								expanded={expanded}
								onToggleExpand={onToggleExpand}
								onRemoveExercise={onRemoveExercise}
								onUpdateExercise={onUpdateExercise}
								onUpdateRestTime={onUpdateRestTime}
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
							/>
						</motion.div>
					)
				})}
			</AnimatePresence>
		</div>
	)
}

export default ExerciseList
