'use client'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useSetLogForm } from '@/hooks/use-set-log-form'
import { saveStateLabel } from '@/lib/utils/save-status-store'
import type { LogRowProps } from '@/lib/utils/workout-session.types'

interface SetLogInputProps extends LogRowProps {
	plannedReps?: number | null
	plannedMinReps?: number | null
	plannedMaxReps?: number | null
	plannedWeight?: number | null
	rpe?: number
}

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
	})

	const showStatus = saveState !== 'idle'
	const statusText = saveStateLabel(saveState)
	const statusDotClass =
		saveState === 'saving' || saveState === 'pending'
			? 'bg-amber-500 animate-pulse'
			: saveState === 'saved'
				? 'bg-green-500'
				: saveState === 'error'
					? 'bg-red-500'
					: 'bg-transparent'

	const plannedRepsText =
		plannedMinReps && plannedMaxReps
			? `${plannedMinReps}-${plannedMaxReps}`
			: (plannedReps ?? '—')

	return (
		<div
			data-testid="set-log-container"
			className={`rounded-lg border p-2.5 transition-all duration-200 ${
				isCompletedState
					? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
					: 'border-border bg-card'
			}`}
		>
			<div className="flex items-center justify-between gap-2 sm:gap-4">
				{/* Set Badge & RIR */}
				<div className="flex flex-col items-start gap-1 shrink-0 min-w-[56px]">
					<Badge
						variant={isCompletedState ? 'default' : 'outline'}
						className="text-[11px] px-1.5 py-0.5"
					>
						Set {setNumber}
					</Badge>
					{plannedRir !== undefined && plannedRir !== null && (
						<span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium px-1">
							RIR {plannedRir}
						</span>
					)}
				</div>

				{/* Reps Column */}
				<div className="flex-1 flex flex-col items-center gap-1 min-w-[70px]">
					<Input
						type="number"
						inputMode="numeric"
						aria-label="Performed reps"
						placeholder="Reps"
						value={repsState}
						onChange={e => setReps(e.target.value)}
						disabled={saveState === 'saving'}
						className={`text-center text-sm font-semibold h-9 px-1 ${
							!isValid && validationError?.includes('reps')
								? 'border-red-500 focus:border-red-500'
								: ''
						}`}
					/>
					<span className="text-[10px] text-muted-foreground whitespace-nowrap">
						Target: {plannedRepsText}
					</span>
				</div>

				{/* Weight Column */}
				<div className="flex-1 flex flex-col items-center gap-1 min-w-[80px]">
					<Input
						type="number"
						inputMode="numeric"
						step="0.5"
						aria-label="Performed weight"
						placeholder="Weight"
						value={weightState}
						onChange={e => setWeight(e.target.value)}
						disabled={saveState === 'saving'}
						className={`text-center text-sm font-semibold h-9 px-1 ${
							!isValid && validationError?.includes('weight')
								? 'border-red-500 focus:border-red-500'
								: ''
						}`}
					/>
					<span className="text-[10px] text-muted-foreground whitespace-nowrap">
						Target: {plannedWeight ? `${plannedWeight}kg` : '—'}
					</span>
				</div>

				{/* RPE Column (LIVE-04). Optional: the set log and the history view
				    have always carried RPE, but nothing could enter it, so the
				    history column was permanently empty. */}
				<div className="flex-1 flex flex-col items-center gap-1 min-w-[52px]">
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
						className={`text-center text-sm font-semibold h-9 px-1 ${
							!isValid && validationError?.includes('RPE')
								? 'border-red-500 focus:border-red-500'
								: ''
						}`}
					/>
					<span className="text-[10px] text-muted-foreground whitespace-nowrap">
						Optional
					</span>
				</div>

				{/* Save Status & Completion Checkbox */}
				<div className="flex items-center gap-2 shrink-0">
					{showStatus && (
						<div
							className="hidden xs:flex items-center gap-1 text-[10px] text-muted-foreground"
							aria-live="polite"
						>
							<span
								className={`inline-block w-1 h-1 rounded-full ${statusDotClass}`}
							/>
							<span className="max-w-[40px] truncate">{statusText}</span>
						</div>
					)}
					<Checkbox
						checked={isCompletedState}
						onCheckedChange={(checked: boolean | 'indeterminate') =>
							handleCompletionToggle(Boolean(checked))
						}
						aria-label="Mark set as complete"
						disabled={saveState === 'saving'}
						className="h-5 w-5"
					/>
				</div>
			</div>

			{/* Validation error */}
			{!isValid && validationError && (
				<div className="mt-2 text-xs text-red-600 text-center">
					{validationError}
				</div>
			)}

			{/* Save state error footer (silent unless error) */}
			{saveState === 'error' && (
				<div
					className="flex items-center justify-center mt-2 text-xs text-red-600 dark:text-red-400"
					role="status"
				>
					<span className="inline-block w-1.5 h-1.5 bg-current rounded-full mr-2" />
					<span>Error saving set. Please try again.</span>
				</div>
			)}
		</div>
	)
}
