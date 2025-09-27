'use client'

import { FC } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { Exercise } from '@/lib/api/types'
import type { RoutineWizardData, ProgressionScheme } from './types'
import { ExerciseHeader } from './components/ExerciseHeader'
import { ExerciseConfigSection } from './components/ExerciseConfigSection'
import { SetListSection } from './components/SetListSection'
import { useExerciseCardState } from './hooks/useExerciseCardState'
import { useExerciseAccessibility } from './hooks/useExerciseAccessibility'
import { isRtFExercise } from './utils/progression.helpers'

export interface ExerciseCardProps {
	tabIndex: number
	exerciseIndex: number
	exercise: RoutineWizardData['days'][number]['exercises'][number]
	exerciseData?: Exercise
	expanded: boolean
	onToggleExpand: (exerciseIndex: number) => void
	onRemoveExercise: (exerciseIndex: number) => void
	onUpdateRestTime: (exerciseIndex: number, timeStr: string) => void
	onUpdateProgressionScheme: (exerciseIndex: number, scheme: ProgressionScheme) => void
	onUpdateMinWeightIncrement: (exerciseIndex: number, increment: number) => void
	onUpdateProgramTMKg: (exerciseIndex: number, tmKg: number) => void
	onUpdateProgramRoundingKg: (exerciseIndex: number, roundingKg: number) => void
	onAddSet: (exerciseIndex: number) => void
	isRemovingSet: (exerciseIndex: number, setIndex: number) => boolean
	onRemoveSetAnimated: (exerciseIndex: number, setIndex: number) => void
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
	disableTimeBasedProgressions?: boolean
}

export const ExerciseCard: FC<ExerciseCardProps> = ({
	tabIndex,
	exerciseIndex,
	exercise,
	exerciseData,
	expanded,
	onToggleExpand,
	onRemoveExercise,
	onUpdateRestTime,
	onUpdateProgressionScheme,
	onUpdateMinWeightIncrement,
	onUpdateProgramTMKg,
	onUpdateProgramRoundingKg,
	onAddSet,
	isRemovingSet,
	onRemoveSetAnimated,
	onUpdateSet,
	onValidateMinMaxReps,
	onStepFixedReps,
	onStepRangeReps,
	onStepWeight,
	disableTimeBasedProgressions,
}) => {
	const {
		registerSetRowRef,
		setsExpanded,
		toggleSetsExpanded,
		handleAddSet,
		tmInput,
		tmMissing,
		helpId,
		handleTmInputChange,
		handleTmBlur,
		weightIncInput,
		handleWeightIncChange,
		handleWeightIncBlur,
	} = useExerciseCardState({
		exercise,
		exerciseIndex,
		tabIndex,
		onAddSet,
		onUpdateProgramTMKg,
		onUpdateMinWeightIncrement,
	})

	const {
		controlsId,
		handleHeaderClick,
		handleHeaderKeyDown,
		handleToggleButtonClick,
		handleRemoveButtonClick,
	} = useExerciseAccessibility({
		tabIndex,
		exerciseIndex,
		expanded,
		onToggleExpand,
		onRemoveExercise,
	})

	const showSets = !isRtFExercise(exercise.progressionScheme)

	return (
		<Card className="border-muted overflow-hidden p-0">
			<ExerciseHeader
				exercise={exercise}
				exerciseData={exerciseData}
				expanded={expanded}
				controlsId={controlsId}
				onHeaderClick={handleHeaderClick}
				onHeaderKeyDown={handleHeaderKeyDown}
				onToggleButtonClick={handleToggleButtonClick}
				onRemoveButtonClick={handleRemoveButtonClick}
			/>
			<CardContent
				className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
					expanded ? 'max-h-[3000px]' : 'max-h-0'
				}`}
				aria-hidden={!expanded}
			>
				<div
					id={controlsId}
					className={`p-0 sm:p-1 transition-opacity duration-300 ease-in-out ${
						expanded ? 'opacity-100' : 'opacity-0'
					}`}
				>
					<ExerciseConfigSection
						exercise={exercise}
						exerciseIndex={exerciseIndex}
						disableTimeBasedProgressions={disableTimeBasedProgressions}
						tmInput={tmInput}
						tmMissing={tmMissing}
						tmHelpId={helpId}
						onTmInputChange={handleTmInputChange}
						onTmBlur={handleTmBlur}
						weightIncInput={weightIncInput}
						onWeightIncChange={handleWeightIncChange}
						onWeightIncBlur={handleWeightIncBlur}
						onUpdateRestTime={onUpdateRestTime}
						onUpdateProgressionScheme={onUpdateProgressionScheme}
						onUpdateProgramRoundingKg={onUpdateProgramRoundingKg}
					/>

					{showSets && (
						<SetListSection
							exercise={exercise}
							exerciseIndex={exerciseIndex}
							tabIndex={tabIndex}
							setsExpanded={setsExpanded}
							onToggleSets={toggleSetsExpanded}
							onAddSet={handleAddSet}
							registerSetRowRef={registerSetRowRef}
							onUpdateSet={onUpdateSet}
							onValidateMinMaxReps={onValidateMinMaxReps}
							onStepFixedReps={onStepFixedReps}
							onStepRangeReps={onStepRangeReps}
							onStepWeight={onStepWeight}
							onRemoveSetAnimated={onRemoveSetAnimated}
							isRemovingSet={isRemovingSet}
						/>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
