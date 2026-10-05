import type { LinearPeriodizationState, WeightUnit } from '@sunsteel/contracts'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatTime, isValidTimeFormat, parseTime } from '@/lib/utils/time'

import type { ProgressionScheme, RoutineWizardExercise } from '../types'
import { requiresWeightIncrementField } from '../utils/progression.helpers'
import { ExerciseNoteRow } from './ExerciseNoteRow'
import { LinearBlockField } from './LinearBlockField'
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
	/** UX-20: progression and rest show with the exercise's "More options". */
	advanced: boolean
	/** Null while options in use keep them open (`usesAdvancedOptions`). */
	onToggleAdvanced: (() => void) | null
	exerciseName: string
	/** ROUT-17: the routine is a rotation, so a block counts sessions. */
	rotation: boolean
	onSetLinearPeriodization: (
		exerciseIndex: number,
		state: LinearPeriodizationState,
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
	advanced,
	onToggleAdvanced,
	exerciseName,
	rotation,
	onSetLinearPeriodization,
}: ExerciseConfigSectionProps) {
	const t = useTranslations('routines.builder')
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
		<div className="mb-3 p-2 sm:p-3 bg-muted/30 rounded-md space-y-2 sm:space-y-3">
			<ExerciseNoteRow
				note={exercise.note}
				onSave={note => onUpdateNote(exerciseIndex, note)}
			/>

			{/* UX-20 (§23.6): sets, reps and load first; the rest one tap away,
			    and kept open while the exercise uses any of it. */}
			{onToggleAdvanced ? (
				<div className="flex flex-wrap items-center gap-x-2">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						aria-expanded={advanced}
						aria-label={t(advanced ? 'fewerOptionsAria' : 'moreOptionsAria', {
							exercise: exerciseName,
						})}
						onClick={onToggleAdvanced}
						className="-ml-3 h-11 sm:h-9"
					>
						{t(advanced ? 'fewerOptions' : 'moreOptions')}
						<ChevronDown aria-hidden className={advanced ? 'rotate-180' : ''} />
					</Button>
					{advanced ? null : (
						<span className="type-body-sm text-ink-3">
							{t('moreOptionsCaption')}
						</span>
					)}
				</div>
			) : null}

			{advanced ? (
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
			) : null}

			{advanced ? (
				<ProgressionSelect
					progressionScheme={exercise.progressionScheme}
					exerciseIndex={exerciseIndex}
					onUpdateProgressionScheme={onUpdateProgressionScheme}
				/>
			) : null}

			{advanced && requiresWeightIncrementField(exercise.progressionScheme) && (
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<Label className="text-sm font-medium text-muted-foreground">
							{t('weightIncrement', {
								unit: weightUnit === 'LB' ? 'lb' : 'kg',
							})}
						</Label>
					</div>
					<div className="flex items-center gap-2 sm:gap-2">
						<Input
							type="text"
							inputMode="decimal"
							pattern="[0-9]*[.]?[0-9]*"
							autoComplete="off"
							aria-label={t('minimumWeightIncrement')}
							placeholder="2.5"
							value={weightIncInput}
							onChange={event => onWeightIncChange(event.target.value)}
							onBlur={onWeightIncBlur}
							className="w-32 sm:w-40 h-9 text-sm text-center"
						/>
					</div>
				</div>
			)}

			{advanced && exercise.progressionScheme === 'LINEAR_PERIODIZATION' ? (
				<LinearBlockField
					exercise={exercise}
					exerciseIndex={exerciseIndex}
					exerciseName={exerciseName}
					weightUnit={weightUnit}
					rotation={rotation}
					onSetLinearPeriodization={onSetLinearPeriodization}
				/>
			) : null}
		</div>
	)
}
