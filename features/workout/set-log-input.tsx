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
 */
const FIELD_CLASS =
	'h-9 rounded-none border-0 bg-transparent px-1 text-center font-mono font-normal tabular-nums shadow-none focus-visible:ring-2 focus-visible:ring-ring/40'

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
	// TD-28: the save state is drawn on the completion checkbox instead of in
	// its own column -- after the RPE input there is no width left for one. A
	// Tailwind ring is a box-shadow, so it costs no layout space. The focus
	// ring still wins while focused, because that rule is variant-scoped.
	//
	// These are genuine system states rather than earned marks, which is what
	// `success` and `warning` are for; completion takes gold elsewhere.
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
			<div className="flex items-stretch justify-between gap-1 sm:gap-2">
				{/* Set number & RIR */}
				<div className="flex min-w-[46px] shrink-0 flex-col justify-center gap-0.5">
					<span
						className={`type-label ${
							isCompletedState ? 'text-honour' : 'text-ink-3'
						}`}
					>
						Set {setNumber}
					</span>
					{plannedRir !== undefined && plannedRir !== null && (
						<span className="type-data text-[11px] leading-none text-ink-3">
							RIR {plannedRir}
						</span>
					)}
				</div>

				{/* Reps */}
				<div className="flex min-w-[62px] flex-1 flex-col items-center gap-0.5 border-l border-rule-faint pl-1">
					<Input
						type="number"
						inputMode="numeric"
						aria-label="Performed reps"
						placeholder="Reps"
						value={repsState}
						onChange={e => setReps(e.target.value)}
						disabled={saveState === 'saving'}
						className={`${FIELD_CLASS} ${
							!isValid && validationError?.includes('reps')
								? FIELD_INVALID_CLASS
								: ''
						}`}
					/>
					<span className="type-label whitespace-nowrap text-[10px] text-ink-3">
						Target: {plannedRepsText}
					</span>
				</div>

				{/* Weight */}
				<div className="flex min-w-[72px] flex-1 flex-col items-center gap-0.5 border-l border-rule-faint pl-1">
					<Input
						type="number"
						inputMode="decimal"
						step={weightUnit === 'LB' ? 1 : 0.5}
						aria-label={`Performed weight in ${weightUnit === 'LB' ? 'pounds' : 'kilograms'}`}
						placeholder="Weight"
						value={weightState}
						onChange={e => setWeight(e.target.value)}
						disabled={saveState === 'saving'}
						className={`${FIELD_CLASS} ${
							!isValid && validationError?.includes('weight')
								? FIELD_INVALID_CLASS
								: ''
						}`}
					/>
					<span className="type-label whitespace-nowrap text-[10px] text-ink-3">
						Target: {formatWeight(plannedWeight, weightUnit)}
					</span>
				</div>

				{/* RPE (LIVE-04). Optional: the set log and the history view have
				    always carried RPE, but nothing could enter it, so the history
				    column was permanently empty. */}
				<div className="flex min-w-[48px] flex-1 flex-col items-center gap-0.5 border-l border-rule-faint pl-1">
					<Input
						type="number"
						inputMode="decimal"
						step="0.5"
						min="0"
						max="10"
						aria-label="Rate of perceived exertion, 0 to 10"
						placeholder="RPE"
						value={rpeState}
						onChange={e => setRpe(e.target.value)}
						disabled={saveState === 'saving'}
						className={`${FIELD_CLASS} ${
							!isValid && validationError?.includes('RPE')
								? FIELD_INVALID_CLASS
								: ''
						}`}
					/>
					<span className="type-label whitespace-nowrap text-[10px] text-ink-3">
						Optional
					</span>
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
						className={`size-5 ${saveRingClass}`}
					/>
				</div>
			</div>

			{previousPerformance ? (
				<div
					className={`mt-2 flex items-center justify-between border-t border-rule-faint pt-1.5 text-[11px] ${
						hasImproved ? 'text-honour' : 'text-ink-3'
					}`}
				>
					<span className="type-label">Last time</span>
					<span className="type-data flex items-center gap-2 text-[11px]">
						{formatPreviousPerformance(previousPerformance, weightUnit)}
						{/* An improvement is earned, so it is one of the few places
						    gold belongs. */}
						{hasImproved ? (
							<span className="type-label text-honour">↑ Improvement</span>
						) : null}
					</span>
				</div>
			) : null}

			{/* Validation error */}
			{!isValid && validationError && (
				<div className="mt-2 text-center text-xs text-destructive">
					{validationError}
				</div>
			)}

			{/* Save state error footer (silent unless error) */}
			{saveState === 'error' && (
				<div
					className="mt-2 flex items-center justify-center text-xs text-destructive"
					role="status"
				>
					<span className="mr-2 inline-block h-1.5 w-1.5 bg-current" />
					<span>Error saving set. Please try again.</span>
				</div>
			)}
		</div>
	)
}
