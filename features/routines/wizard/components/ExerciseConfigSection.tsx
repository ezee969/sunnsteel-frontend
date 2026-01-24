import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEffect, useState } from 'react'
import { formatTime, parseTime, isValidTimeFormat } from '@/lib/utils/time'
import type { RoutineWizardExercise, ProgressionScheme } from '../types'
import {
	isRtFExercise,
	requiresWeightIncrementField,
} from '../utils/progression.helpers'
import { ExerciseNoteRow } from './ExerciseNoteRow'
import { ProgressionSelect } from './ProgressionSelect'
import { RtfExerciseConfig } from './RtfExerciseConfig'
import { RestTimeExerciseConfig } from './RestTimeExerciseConfig'

interface ExerciseConfigSectionProps {
	exercise: RoutineWizardExercise
	exerciseIndex: number
	disableTimeBasedProgressions?: boolean
	tmInput: string
	tmMissing: boolean
	tmHelpId: string
	onTmInputChange: (value: string) => void
	onTmBlur: () => void
	weightIncInput: string
	onWeightIncChange: (value: string) => void
	onWeightIncBlur: () => void
	onUpdateRestTime: (exerciseIndex: number, value: string) => void
	onUpdateNote: (exerciseIndex: number, note: string) => void
	onUpdateProgressionScheme: (
		exerciseIndex: number,
		scheme: ProgressionScheme,
	) => void
	onUpdateProgramRoundingKg: (exerciseIndex: number, roundingKg: number) => void
}

export function ExerciseConfigSection({
	exercise,
	exerciseIndex,
	disableTimeBasedProgressions,
	tmInput,
	tmMissing,
	tmHelpId,
	onTmInputChange,
	onTmBlur,
	weightIncInput,
	onWeightIncChange,
	onWeightIncBlur,
	onUpdateRestTime,
	onUpdateNote,
	onUpdateProgressionScheme,
	onUpdateProgramRoundingKg,
}: ExerciseConfigSectionProps) {
	const isRtF = isRtFExercise(exercise.progressionScheme)

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
				disableTimeBasedProgressions={disableTimeBasedProgressions}
				progressionScheme={exercise.progressionScheme}
				exerciseIndex={exerciseIndex}
				onUpdateProgressionScheme={onUpdateProgressionScheme}
			/>

			{isRtF && (
				<RtfExerciseConfig
					tmInput={tmInput}
					tmMissing={tmMissing}
					tmHelpId={tmHelpId}
					exerciseIndex={exerciseIndex}
					onTmInputChange={onTmInputChange}
					onTmBlur={onTmBlur}
					programRoundingKg={exercise.programRoundingKg}
					onUpdateProgramRoundingKg={onUpdateProgramRoundingKg}
				/>
			)}

			{requiresWeightIncrementField(exercise.progressionScheme) && (
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<Label className="text-sm font-medium text-muted-foreground">
							Weight Inc.
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
