'use client'

import {
	isSetKind,
	SET_KINDS,
	type SetKind,
	type WeightUnit,
} from '@sunsteel/contracts'
import { ChevronDown, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useCompactWorkout } from '@/hooks/use-compact-workout'
import { type SetValues, useSetLogForm } from '@/hooks/use-set-log-form'
import type { Locale } from '@/i18n/config'
import type { PreviousSetPerformance } from '@/lib/api/types/workout.type'
import {
	formatPreviousPerformance,
	isSetPerformanceImproved,
} from '@/lib/utils/previous-performance.utils'
import { saveStateLabel } from '@/lib/utils/save-status-store'
import {
	formatWeight,
	formatWeightInput,
	parseWeightInput,
} from '@/lib/utils/weight-unit'
import type { LogRowProps } from '@/lib/utils/workout-session.types'

interface SetLogInputProps extends LogRowProps {
	plannedReps?: number | null
	plannedMinReps?: number | null
	plannedMaxReps?: number | null
	plannedWeight?: number | null
	rpe?: number
	previousPerformance?: PreviousSetPerformance
	weightUnit: WeightUnit
	/** LIVE-15: a set logged beyond the prescription. */
	isExtra?: boolean
	/** LIVE-15: the set above in this workout, offered as a one-tap fill. */
	setAbove?: SetValues & { setNumber: number }
	/** LIVE-15: present only on the last added set, the one that can go. */
	onRemove?: () => void
	/** LIVE-12: what the set is for in this workout. */
	kind?: SetKind
}

/** A LIVE-15 fill control: repeated on every row, so it is never primary. */
const FILL_CLASS = 'type-body-sm h-11 px-2 text-ink-2 md:h-8'

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
	'h-11 md:h-9 md:max-w-[var(--field-max)] rounded-none border-0 bg-transparent px-0 sm:px-1 text-center font-mono font-normal tabular-nums shadow-none focus-visible:ring-2 focus-visible:ring-ring/40 ' +
	// A11Y-02 / LIVE-18 (§22): gym mode's taller fields and larger digits, and
	// under higher contrast a visible boundary instead of the well's tone alone.
	'large-controls:h-14 large-controls:text-xl large-controls:placeholder:text-base contrast-more:border contrast-more:border-rule'

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
	isExtra,
	setAbove,
	onRemove,
	kind = 'WORKING',
	onSave,
	onSetCompleted,
}: SetLogInputProps) => {
	const locale = useLocale() as Locale
	const t = useTranslations('workout.setLogInput')
	const tKinds = useTranslations('workout.setKinds')
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
		fill,
		changeKind,
		isValid,
		validationError,
		validationField,
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

	const tSaveStatus = useTranslations('core.saveStatus')
	const tPrev = useTranslations('workout.previousPerformance')
	const statusText = saveStateLabel(saveState, tSaveStatus)
	// LIVE-18/UX-21: under larger controls, and always on a phone, the row
	// keeps only its fields and its tick; the fills and Remove move into the
	// set's own menu.
	const grouped = useCompactWorkout()
	// a11y review 7: the invalid field and its message are linked, so a screen
	// reader user editing one of several repeated rows hears which one failed.
	const errorId = `set-${routineExerciseId}-${setNumber}-error`
	const repsInvalid = !isValid && validationField === 'reps'
	const weightInvalid = !isValid && validationField === 'weight'
	const rpeInvalid = !isValid && validationField === 'rpe'
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

	// LIVE-15: a fill is offered only on a set not yet done, and only when it
	// would change what the fields hold.
	const holds = (values: SetValues) =>
		(values.reps > 0 ? String(values.reps) : '') === repsState &&
		formatWeightInput(values.weight ?? undefined, weightUnit) === weightState &&
		(values.rpe != null ? String(values.rpe) : '') === rpeState
	const canFillAbove =
		!isCompletedState &&
		setAbove !== undefined &&
		(setAbove.reps > 0 || (setAbove.weight ?? 0) > 0) &&
		!holds(setAbove)
	const canFillPrevious =
		!isCompletedState &&
		previousPerformance !== undefined &&
		!holds(previousPerformance)
	const previousText = previousPerformance
		? formatPreviousPerformance(previousPerformance, weightUnit, tPrev, locale)
		: ''

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
					{/* LIVE-12: the set number opens the kind menu. A warm-up never
					    counts as work; only working and optional sets progress. */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								aria-label={
									grouped
										? t('setKindMenuMoreAria', {
												number: setNumber,
												kind: tKinds(kind),
											})
										: t('setKindMenuChangeAria', {
												number: setNumber,
												kind: tKinds(kind),
											})
								}
								disabled={saveState === 'saving'}
								className={`type-label -mx-1 flex min-h-11 items-center gap-0.5 rounded-sm px-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:min-h-0 large-controls:min-h-12 ${
									isCompletedState ? 'text-success' : 'text-ink-3'
								}`}
							>
								{t('setLabel', { number: setNumber })}
								<ChevronDown className="h-3 w-3" aria-hidden />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							<DropdownMenuLabel>{t('setKindHeading')}</DropdownMenuLabel>
							<DropdownMenuRadioGroup
								value={kind}
								onValueChange={value => {
									if (isSetKind(value) && value !== kind) changeKind(value)
								}}
							>
								{SET_KINDS.map(option => (
									<DropdownMenuRadioItem key={option} value={option}>
										{tKinds(option)}
									</DropdownMenuRadioItem>
								))}
							</DropdownMenuRadioGroup>
							{grouped &&
							((canFillAbove && setAbove) ||
								(canFillPrevious && previousPerformance) ||
								onRemove) ? (
								<>
									<DropdownMenuSeparator />
									{canFillAbove && setAbove ? (
										<DropdownMenuItem onSelect={() => fill(setAbove)}>
											{t('sameAsSet', { number: setAbove.setNumber })}
										</DropdownMenuItem>
									) : null}
									{canFillPrevious && previousPerformance ? (
										<DropdownMenuItem
											onSelect={() => fill(previousPerformance)}
										>
											{t('useLastTimeWithValue', { value: previousText })}
										</DropdownMenuItem>
									) : null}
									{onRemove ? (
										<DropdownMenuItem variant="destructive" onSelect={onRemove}>
											<X className="h-4 w-4" aria-hidden />
											{t('removeSetAria', { number: setNumber })}
										</DropdownMenuItem>
									) : null}
								</>
							) : null}
						</DropdownMenuContent>
					</DropdownMenu>
					{kind !== 'WORKING' ? (
						<span className="type-body-sm leading-none text-ink-3">
							{tKinds(kind)}
						</span>
					) : isExtra ? (
						<span className="type-body-sm leading-none text-ink-3">
							{t('extra')}
						</span>
					) : plannedRir !== undefined && plannedRir !== null ? (
						<span className="type-data leading-none text-ink-3">
							{t('rir', { value: plannedRir })}
						</span>
					) : null}
				</div>

				{/* Reps */}
				<div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 border-l border-rule-faint pl-1 sm:min-w-[62px]">
					<Input
						type="number"
						inputMode="numeric"
						aria-label={t('performedRepsAria')}
						placeholder={t('repsPlaceholder')}
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
						{isExtra
							? t('noTarget')
							: plannedMinReps && plannedMaxReps
								? t('targetRange', { min: plannedMinReps, max: plannedMaxReps })
								: t('targetReps', { value: plannedRepsText })}
					</span>
				</div>

				{/* Weight */}
				<div className="flex min-w-0 flex-[1.4] flex-col items-center gap-0.5 border-l border-rule-faint pl-1 sm:min-w-[72px] sm:flex-1">
					<Input
						type="number"
						inputMode="decimal"
						step={weightUnit === 'LB' ? 1 : 0.5}
						aria-label={
							weightUnit === 'LB'
								? t('performedWeightLbAria')
								: t('performedWeightKgAria')
						}
						placeholder={t('weightPlaceholder')}
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
						{isExtra
							? t('noTarget')
							: t('targetWeight', {
									value: formatWeight(plannedWeight, weightUnit, locale),
								})}
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
						aria-label={t('rpeAria')}
						placeholder={t('rpePlaceholder')}
						aria-invalid={rpeInvalid || undefined}
						aria-describedby={rpeInvalid ? errorId : undefined}
						value={rpeState}
						onChange={e => setRpe(e.target.value)}
						disabled={saveState === 'saving'}
						className={`${FIELD_CLASS} ${
							rpeInvalid ? FIELD_INVALID_CLASS : ''
						}`}
					/>
					<span className="type-body-sm text-center text-ink-3">
						{t('optional')}
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
						aria-label={t('markCompleteAria')}
						disabled={saveState === 'saving'}
						// Checked colour comes from the primitive (`--success-strong`,
						// v1.0 §4.3 rule 2). This call site only sizes the box and draws
						// the save-state ring; it must not re-specify the fill.
						className={`relative size-5 after:absolute after:-inset-3 after:content-[''] large-controls:size-8 ${saveRingClass}`}
					/>
				</div>
			</div>

			{previousPerformance ? (
				<div
					className={`type-body-sm mt-2 flex items-center justify-between border-t border-rule-faint pt-1.5 ${
						hasImproved ? 'text-honour' : 'text-ink-3'
					}`}
				>
					<span>{t('lastTime')}</span>
					<span className="type-data flex items-center gap-2">
						{previousText}
						{/* An improvement is earned, so it is one of the few places
						    gold belongs. */}
						{hasImproved ? (
							<span className="type-body-sm text-honour">
								{t('improvement')}
							</span>
						) : null}
					</span>
				</div>
			) : null}

			{!grouped && (canFillAbove || canFillPrevious || onRemove) ? (
				<div className="mt-1 flex flex-wrap items-center gap-x-1">
					{canFillAbove && setAbove ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className={FILL_CLASS}
							onClick={() => fill(setAbove)}
						>
							{t('sameAsSet', { number: setAbove.setNumber })}
						</Button>
					) : null}
					{canFillPrevious && previousPerformance ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className={FILL_CLASS}
							aria-label={t('useLastTimeWithValue', { value: previousText })}
							onClick={() => fill(previousPerformance)}
						>
							{t('useLastTime')}
						</Button>
					) : null}
					{onRemove ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className={`${FILL_CLASS} ml-auto`}
							aria-label={t('removeSetAria', { number: setNumber })}
							onClick={onRemove}
						>
							<X className="h-4 w-4" aria-hidden />
							{t('remove')}
						</Button>
					) : null}
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
					<span>{t('errorSaving')}</span>
				</div>
			)}
		</div>
	)
}
