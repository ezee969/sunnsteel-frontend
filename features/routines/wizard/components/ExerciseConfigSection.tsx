import type { WeightUnit } from '@sunsteel/contracts'
import { useEffect, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatTime, isValidTimeFormat, parseTime } from '@/lib/utils/time'

import type { ProgressionScheme, RoutineWizardExercise } from '../types'
import { requiresWeightIncrementField } from '../utils/progression.helpers'
import { ExerciseNoteRow } from './ExerciseNoteRow'
import { ProgressionSelect } from './ProgressionSelect'
import { RestTimeExerciseConfig } from './RestTimeExerciseConfig'

interface ExerciseConfigSectionProps {
	exercise: RoutineWizardExercise
	exerciseIndex: number
	weightIncInput: string
	weightUnit: WeightUnit
	onWeightIncChange: (value: string) => void
	onWeightIncBlur: () => void
	onUpdateRestTime: (exerciseIndex: number, value: string) => void
	onUpdateNote: (exerciseIndex: number, note: string) => void
	onUpdateProgressionScheme: (
		exerciseIndex: number,
		scheme: ProgressionScheme,
	) => void
}

/**
 * Render configuration controls for one routine exercise.
 *
 * Includes rest time, notes and progression. A minimum weight increment field
 * is shown when the selected progression scheme requires it.
 *
 * @param exercise - Exercise configuration being edited
 * @param exerciseIndex - Exercise index passed to update callbacks
 * @param weightIncInput - Current minimum weight increment input
 * @param onWeightIncChange - Update the local weight increment input
 * @param onWeightIncBlur - Validate and save the weight increment
 * @param onUpdateRestTime - Save a rest-time change
 * @param onUpdateNote - Save an exercise note
 * @param onUpdateProgressionScheme - Save a progression-scheme change
 * @returns The exercise configuration controls
 */
export function ExerciseConfigSection({
	exercise,
	exerciseIndex,
	weightIncInput,
	weightUnit,
	onWeightIncChange,
	onWeightIncBlur,
	onUpdateRestTime,
	onUpdateNote,
	onUpdateProgressionScheme,
}: ExerciseConfigSectionProps) {
	// Local state for rest time input: allow free typing (digits and ":")
	const [restFocused, setRestFocused] = useState(false)
	const [restInput, setRestInput] = useState<string>(
		formatTime(exercise.restSeconds),
	)

	// Keep input in sync with prop when not focused/typing
	useEffect(() => {
		if (!restFocused) {
			setRestInput(formatTime(exercise.restSeconds))
		}
	}, [exercise.restSeconds, restFocused])

	return (
		<div className="mb-3 p-2 sm:p-3 bg-muted/30 rounded-lg space-y-2 sm:space-y-3">
			<RestTimeExerciseConfig
				restInput={restInput}
				setRestInput={setRestInput}
				exerciseIndex={exerciseIndex}
				onUpdateRestTime={onUpdateRestTime}
				formatTime={formatTime}
				parseTime={parseTime}
				isValidTimeFormat={isValidTimeFormat}
				restSeconds={exercise.restSeconds}
				setRestFocused={setRestFocused}
			/>

			<ExerciseNoteRow
				note={exercise.note}
				onSave={note => onUpdateNote(exerciseIndex, note)}
			/>

			<ProgressionSelect
				progressionScheme={exercise.progressionScheme}
				exerciseIndex={exerciseIndex}
				onUpdateProgressionScheme={onUpdateProgressionScheme}
			/>

			{requiresWeightIncrementField(exercise.progressionScheme) && (
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<Label className="text-sm font-medium text-muted-foreground">
							Weight Inc. ({weightUnit === 'LB' ? 'lb' : 'kg'})
						</Label>
					</div>
					<div className="flex items-center gap-2 sm:gap-2">
						<Input
							type="text"
							inputMode="decimal"
							pattern="[0-9]*[.]?[0-9]*"
							autoComplete="off"
							aria-label="Minimum weight increment"
							placeholder="2.5"
							value={weightIncInput}
							onChange={event => onWeightIncChange(event.target.value)}
							onBlur={onWeightIncBlur}
							className="w-32 sm:w-40 h-9 text-sm text-center"
						/>
					</div>
				</div>
			)}
		</div>
	)
}
