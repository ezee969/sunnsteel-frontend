'use client'

import type { WeightUnit } from '@sunsteel/contracts'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useSetLogForm } from '@/hooks/use-set-log-form'
import type { PreviousSetPerformance } from '@/lib/api/types/workout.type'
import {
	formatPreviousPerformance,
	isSetPerformanceImproved,
} from '@/lib/utils/previous-performance.utils'
import { saveStateLabel } from '@/lib/utils/save-status-store'
import { formatWeight, parseWeightInput } from '@/lib/utils/weight-unit'
import type { LogRowProps } from '@/lib/utils/workout-session.types'

interface SetLogInputProps extends LogRowProps {
	plannedReps?: number | null
	plannedMinReps?: number | null
	plannedMaxReps?: number | null
	plannedWeight?: number | null
	rpe?: number
	previousPerformance?: PreviousSetPerformance
	weightUnit: WeightUnit
}

/**
 * A numeric field keeps its own size classes so the 16px-below-`md` rule
 * survives: that is an iOS zoom-on-focus mitigation (TD-29), not a type choice,
 * so `font-mono` sets only the family and never the size.
 *
 * a11y review 1: 44px tall below `md`, where this row is touched mid-workout.
 * Final review 5 / v1.0 §10.2: capped at `--field-max` above it, so a two-digit
 * number is never stretched across a third of the screen at 1440.
 *
 * TD-35: below `sm` the field drops its side padding — it has no border and
 * centres its value — which is what lets a five-character weight ("102.5") fit
 * the weight column at 320.
 */
const FIELD_CLASS =
	'h-11 md:h-9 md:max-w-[var(--field-max)] rounded-none border-0 bg-transparent px-0 sm:px-1 text-center font-mono font-normal tabular-nums shadow-none focus-visible:ring-2 focus-visible:ring-ring/40'

const FIELD_INVALID_CLASS = 'text-destructive ring-2 ring-destructive/50'

/**
 * Reusable component for logging workout set data with auto-save functionality
 */
export const SetLogInput = ({
	sessionId,
	routineExerciseId,
	exerciseId,
	setNumber,
	reps,
	weight,
	isCompleted,
	plannedReps,
	plannedMinReps,
	plannedMaxReps,
	plannedWeight,
	plannedRir,
	rpe,
	previousPerformance,
	weightUnit,
	onSave,
	onSetCompleted,
}: SetLogInputProps) => {
	const {
		repsState,
		weightState,
		rpeState,
		isCompletedState,
		saveState,
		setReps,
		setWeight,
		setRpe,
		handleCompletionToggle,
		isValid,
		validationError,
	} = useSetLogForm({
		sessionId,
		routineExerciseId,
		exerciseId,
		setNumber,
		initialReps: reps,
		initialWeight: weight,
		initialRpe: rpe,
		initialIsCompleted: isCompleted,
		onSave,
		onSetCompleted,
		weightUnit,
	})

	const statusText = saveStateLabel(saveState)
	// a11y review 7: the invalid field and its message are linked, so a screen
	// reader user editing one of several repeated rows hears which one failed.
	const errorId = `set-${routineExerciseId}-${setNumber}-error`
	const repsInvalid = !isValid && Boolean(validationError?.includes('reps'))
	const weightInvalid = !isValid && Boolean(validationError?.includes('weight'))
	const rpeInvalid = !isValid && Boolean(validationError?.includes('RPE'))
	// TD-28: the save state is drawn on the completion checkbox instead of in
	// its own column -- after the RPE input there is no width left for one. A
	// Tailwind ring is a box-shadow, so it costs no layout space. The focus
	// ring still wins while focused, because that rule is variant-scoped.
	//
	// These are genuine system states rather than earned marks, which is what
	// `success` and `warning` are for. Completion is `--success` too (§4.3
	// rule 2); gold is reserved for the improvement line below.
	const saveRingClass =
		saveState === 'saving' || saveState === 'pending'
			? 'ring-2 ring-warning-strong'
			: saveState === 'saved'
				? 'ring-2 ring-success'
				: saveState === 'error'
					? 'ring-2 ring-destructive'
					: ''

	const plannedRepsText =
		plannedMinReps && plannedMaxReps
			? `${plannedMinReps}-${plannedMaxReps}`
			: (plannedReps ?? '—')
	const hasImproved = previousPerformance
		? isSetPerformanceImproved(
				{
					reps: Number(repsState) || 0,
					weight: parseWeightInput(weightState, weightUnit),
				},
				previousPerformance,
			)
		: false

	return (
		// The second of the three things v0.1 keeps boxed (§11.5): a dense grid of
		// editable numeric fields needs edges to stay parseable. It is a `sunk`
		// well — square, no resting border, separated from the ground by tone.
		<div
			data-testid="set-log-container"
			className={`mark bg-surface-sunk py-2 pl-2 pr-2.5 transition-colors duration-[var(--motion-base)] ease-standard ${
				isCompletedState ? 'mark-success' : 'mark'
			}`}
		>
			{/* TD-35: the fixed column minimums (46 + 62 + 72 + 48px) plus the
			    checkbox column needed 273px, and at 320 this row has 228. Below `sm`
			    the three field columns drop their minimums and size to their
			    captions instead, and the weight column takes the larger share
			    because it carries the longest value. The gap and the checkbox
			    column's padding stay: together they keep the checkbox's 44px hit
			    area clear of the RPE field. From `sm` nothing changes. */}
			<div className="flex items-stretch justify-between gap-1 sm:gap-2">
				{/* Set number & RIR */}
				<div className="flex min-w-[40px] shrink-0 flex-col justify-center gap-0.5 sm:min-w-[46px]">
					<span
						className={`type-label ${
							isCompletedState ? 'text-success' : 'text-ink-3'
						}`}
					>
						Set {setNumber}
					</span>
					{plannedRir !== undefined && plannedRir !== null && (
						<span className="type-data leading-none text-ink-3">
							RIR {plannedRir}
						</span>
					)}
				</div>

				{/* Reps */}
				<div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 border-l border-rule-faint pl-1 sm:min-w-[62px]">
					<Input
						type="number"
						inputMode="numeric"
						aria-label="Performed reps"
						placeholder="Reps"
						aria-invalid={repsInvalid || undefined}
						aria-describedby={repsInvalid ? errorId : undefined}
						value={repsState}
						onChange={e => setReps(e.target.value)}
						disabled={saveState === 'saving'}
						className={`${FIELD_CLASS} ${
							repsInvalid ? FIELD_INVALID_CLASS : ''
						}`}
					/>
					<span className="type-body-sm text-center text-ink-3">
						Target: {plannedRepsText}
					</span>
				</div>

				{/* Weight */}
				<div className="flex min-w-0 flex-[1.4] flex-col items-center gap-0.5 border-l border-rule-faint pl-1 sm:min-w-[72px] sm:flex-1">
					<Input
						type="number"
						inputMode="decimal"
						step={weightUnit === 'LB' ? 1 : 0.5}
						aria-label={`Performed weight in ${weightUnit === 'LB' ? 'pounds' : 'kilograms'}`}
						placeholder="Weight"
						aria-invalid={weightInvalid || undefined}
						aria-describedby={weightInvalid ? errorId : undefined}
						value={weightState}
						onChange={e => setWeight(e.target.value)}
						disabled={saveState === 'saving'}
						className={`${FIELD_CLASS} ${
							weightInvalid ? FIELD_INVALID_CLASS : ''
						}`}
					/>
					<span className="type-body-sm text-center text-ink-3">
						Target: {formatWeight(plannedWeight, weightUnit)}
					</span>
				</div>

				{/* RPE (LIVE-04). Optional: the set log and the history view have
				    always carried RPE, but nothing could enter it, so the history
				    column was permanently empty. */}
				<div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 border-l border-rule-faint pl-1 sm:min-w-[48px]">
					<Input
						type="number"
						inputMode="decimal"
						step="0.5"
						min="0"
						max="10"
						aria-label="Rate of perceived exertion, 0 to 10"
						placeholder="RPE"
						aria-invalid={rpeInvalid || undefined}
						aria-describedby={rpeInvalid ? errorId : undefined}
						value={rpeState}
						onChange={e => setRpe(e.target.value)}
						disabled={saveState === 'saving'}
						className={`${FIELD_CLASS} ${
							rpeInvalid ? FIELD_INVALID_CLASS : ''
						}`}
					/>
					<span className="type-body-sm text-center text-ink-3">Optional</span>
				</div>

				{/* Completion checkbox, doubling as the save-state indicator */}
				<div className="flex shrink-0 items-center border-l border-rule-faint pl-2">
					{/* Colour alone must not carry this, so the same state is announced
					    to screen readers. The visible error footer below is unaffected. */}
					<span className="sr-only" role="status" aria-live="polite">
						{statusText}
					</span>
					<Checkbox
						checked={isCompletedState}
						onCheckedChange={(checked: boolean | 'indeterminate') =>
							handleCompletionToggle(Boolean(checked))
						}
						aria-label="Mark set as complete"
						disabled={saveState === 'saving'}
						// Checked colour comes from the primitive (`--success-strong`,
						// v1.0 §4.3 rule 2). This call site only sizes the box and draws
						// the save-state ring; it must not re-specify the fill.
						className={`relative size-5 after:absolute after:-inset-3 after:content-[''] ${saveRingClass}`}
					/>
				</div>
			</div>

			{previousPerformance ? (
				<div
					className={`type-body-sm mt-2 flex items-center justify-between border-t border-rule-faint pt-1.5 ${
						hasImproved ? 'text-honour' : 'text-ink-3'
					}`}
				>
					<span>Last time</span>
					<span className="type-data flex items-center gap-2">
						{formatPreviousPerformance(previousPerformance, weightUnit)}
						{/* An improvement is earned, so it is one of the few places
						    gold belongs. */}
						{hasImproved ? (
							<span className="type-body-sm text-honour">↑ Improvement</span>
						) : null}
					</span>
				</div>
			) : null}

			{/* Validation error */}
			{!isValid && validationError && (
				<div
					id={errorId}
					role="alert"
					className="type-body-sm mt-2 text-center text-destructive"
				>
					{validationError}
				</div>
			)}

			{/* Save state error footer (silent unless error) */}
			{saveState === 'error' && (
				<div
					className="type-body-sm mt-2 flex items-center justify-center text-destructive"
					role="alert"
				>
					<span className="mr-2 inline-block h-1.5 w-1.5 bg-current" />
					<span>Error saving set. Please try again.</span>
				</div>
			)}
		</div>
	)
}
