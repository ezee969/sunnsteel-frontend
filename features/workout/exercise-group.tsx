'use client'

import {
	type LinearPeriodizationState,
	type SetKind,
} from '@sunsteel/contracts'
import {
	ArrowLeftRight,
	Calculator,
	ChevronDown,
	ChevronRight,
	MoreHorizontal,
	NotebookPen,
	Plus,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusMark } from '@/components/ui/status-mark'
import { useCompactWorkout } from '@/hooks/use-compact-workout'
import { useWeightUnit } from '@/hooks/use-weight-unit'
import { exerciseLabel } from '@/i18n/catalog'
import type { Locale } from '@/i18n/config'
import type { PreviousSetPerformance } from '@/lib/api/types/workout.type'
import { lpSetTargetLabel } from '@/lib/utils/linear-periodization'
import {
	matchesPrescription,
	prescriptionLine,
	sharedPrescription,
} from '@/lib/utils/session-focus'
import { lpFinishedNote, lpSessionLine } from '@/lib/utils/session-linear-block'
import {
	isExerciseDone,
	MAX_EXTRA_SETS,
} from '@/lib/utils/session-progress.utils'
import { comparablePrevious } from '@/lib/utils/session-substitutions'
import type { UpsertSetLogPayload } from '@/lib/utils/workout-session.types'

import { PlateCalculatorDialog } from './plate-calculator-dialog'
import { ExerciseNoteButton } from './session-notes'
import {
	SetColumnsHeader,
	SetLogInput,
	type SetRowState,
} from './set-log-input'

interface ExerciseGroupProps {
	exerciseId: string
	exerciseName: string
	sets: Array<{
		id: string
		routineExerciseId: string
		sessionId: string
		exerciseId: string
		setNumber: number
		reps: number
		weight?: number
		rpe?: number
		isCompleted: boolean
		plannedReps?: number | null
		plannedMinReps?: number | null
		plannedMaxReps?: number | null
		plannedWeight?: number | null
		plannedRir?: number | null
		isExtra?: boolean
		kind: SetKind
		/** ROUT-17: 0-based place among the working sets; null for a warm-up. */
		workingIndex?: number | null
		/** LIVE-22: the weight shown is the prescription's, not a logged one. */
		weightIsSuggestion?: boolean
	}>
	/**
	 * ROUT-17: the 8-week block this slot trains in this workout, with whether
	 * the day is a rotation's (sessions, not weeks) and the routine whose page
	 * chooses what follows a finished block.
	 */
	linearBlock?: {
		state: LinearPeriodizationState
		rotation: boolean
		routineId?: string
	} | null
	/** ROUT-17: an LP slot without a reference max, trained as usual. */
	linearBlockUnset?: boolean
	isCollapsed: boolean
	onToggleCollapse: () => void
	completedSets: number
	totalSets: number
	onSave: (payload: UpsertSetLogPayload) => void
	previousSets?: ReadonlyMap<string, PreviousSetPerformance>
	/** Fired with the set's number when one is ticked complete (LIVE-01). */
	onSetCompleted?: (setNumber: number, viaKeyboard: boolean) => void
	/** LIVE-14: "Superset A1 · Round 2 of 3" while the exercise is in a group. */
	roundLine?: string | null
	/** LIVE-14: "Up next: set 2" while the next set of the rounds is this one's. */
	upNext?: string | null
	sessionId: string
	/** The routine's own note: the standing instruction, shown, never edited here. */
	instruction?: string | null
	/** LIVE-16: what the owner noted about this exercise in this workout. */
	sessionNote?: string | null
	/** LIVE-11: the routine's own exercise when this slot was swapped. */
	substitutedFrom?: string | null
	/** Opens the swap dialog; omitted when the session cannot change. */
	onSwapRequest?: () => void
	/**
	 * LIVE-15: take back an added set. Omitted when the session cannot change,
	 * which also hides Add set.
	 */
	onRemoveSet?: (routineExerciseId: string, setNumber: number) => void
	/**
	 * LIVE-21: the rounds just handed over to this exercise; the section is
	 * tinted briefly so the member sees where the screen went.
	 */
	arriving?: boolean
	/** LIVE-21: the arrival tint has run its course. */
	onArrivalEnd?: () => void
	/**
	 * LIVE-22 (§27.2): the exercise the current set belongs to. It is the one
	 * box on the screen; every other exercise is a ruled entry.
	 */
	isCurrent?: boolean
	/** LIVE-22: the set to do now, when it is this exercise's. */
	currentSetNumber?: number | null
	/** LIVE-22: the rest after each set, stated once in the prescription line. */
	restSeconds?: number | null
}

/**
 * Reusable component for displaying collapsible exercise groups with set logs
 */
export const ExerciseGroup = ({
	exerciseId,
	exerciseName: rawExerciseName,
	sets,
	isCollapsed,
	onToggleCollapse,
	completedSets,
	totalSets,
	onSave,
	previousSets,
	onSetCompleted,
	sessionId,
	instruction,
	sessionNote,
	substitutedFrom,
	onSwapRequest,
	onRemoveSet,
	roundLine,
	upNext,
	linearBlock,
	linearBlockUnset,
	arriving,
	onArrivalEnd,
	isCurrent = false,
	currentSetNumber = null,
	restSeconds,
}: ExerciseGroupProps) => {
	const t = useTranslations('workout.exerciseGroup')
	const tEx = useTranslations('catalog.exercises')
	const tBlock = useTranslations('workout.linearBlock')
	const tRoutineBlock = useTranslations('routines.linearBlock')
	const locale = useLocale() as Locale
	const blockState = linearBlock?.state ?? null
	const blockLine =
		linearBlock && blockState?.phase !== 'FINISHED'
			? lpSessionLine(
					linearBlock.state,
					linearBlock.rotation,
					locale,
					tBlock,
					tRoutineBlock,
				)
			: null
	// ROUT-17: a block's working set has a fixed load and the step's target.
	const blockSet = (set: ExerciseGroupProps['sets'][number]) =>
		blockState &&
		!set.isExtra &&
		set.workingIndex != null &&
		set.plannedWeight != null &&
		set.plannedWeight > 0
			? {
					loadKg: set.plannedWeight,
					target: lpSetTargetLabel(blockState, set.workingIndex, tRoutineBlock),
				}
			: undefined
	const exerciseName = exerciseLabel(rawExerciseName, tEx)
	const tLine = useTranslations('workout.prescriptionLine')
	const setsId = `exercise-${exerciseId}-sets`
	// LIVE-12: done once every required set is done; a skipped warm-up or
	// optional set does not hold the mark back.
	const isComplete = isExerciseDone(sets)
	const weightUnit = useWeightUnit()
	// LIVE-22 (§27.3): the prescription said once, under the name; a block
	// states its own step in `blockLine`.
	const prescription = blockState ? null : sharedPrescription(sets)
	const line = prescriptionLine(
		prescription,
		restSeconds,
		weightUnit,
		locale,
		tLine,
	)
	const rowState = (set: ExerciseGroupProps['sets'][number]): SetRowState =>
		set.setNumber === currentSetNumber
			? 'current'
			: set.isCompleted
				? 'done'
				: 'upcoming'
	// LIVE-18: under larger controls the swap, plate calculator and note move
	// into one More menu, so the header keeps the exercise and one control.
	// UX-21: one menu per exercise on a phone, as under larger controls.
	const grouped = useCompactWorkout()
	const [openTool, setOpenTool] = useState<'plates' | 'note' | null>(null)
	const nextWeightedSet =
		sets.find(
			set => !set.isCompleted && (set.plannedWeight ?? set.weight ?? 0) > 0,
		) ?? sets.find(set => (set.plannedWeight ?? set.weight ?? 0) > 0)
	const calculatorTarget = nextWeightedSet
		? (nextWeightedSet.plannedWeight ?? nextWeightedSet.weight)
		: undefined

	// LIVE-15: one more set at the end, saved at once with the last set's
	// values and not ticked. It is today's work; the prescription is unchanged.
	const lastSet = sets[sets.length - 1]
	const extraCount = sets.filter(set => set.isExtra).length
	// ROUT-17: a block prescribes its sets; the server refuses an extra one.
	const canAddSet =
		!blockState &&
		lastSet !== undefined &&
		Boolean(onRemoveSet) &&
		extraCount < MAX_EXTRA_SETS
	const addSet = () =>
		lastSet &&
		onSave({
			routineExerciseId: lastSet.routineExerciseId,
			exerciseId: lastSet.exerciseId,
			setNumber: lastSet.setNumber + 1,
			reps: lastSet.reps,
			weight: lastSet.weight,
			rpe: lastSet.rpe,
			isCompleted: false,
		})

	return (
		// De-boxed: a ruled entry on the page, not a card. The mark on the left
		// is what a completed exercise reads as at a glance — "done, as planned",
		// so it is `--success` (§4.3 rule 2), not gold.
		<section
			id={`exercise-${exerciseId}`}
			data-arriving={arriving || undefined}
			onAnimationEnd={event => {
				if (event.animationName === 'arrival-cue') onArrivalEnd?.()
			}}
			// Motion spec §2.9 signature 2: `mark-fill` makes the mark grow top to
			// bottom instead of appearing, and the row settles onto the completed
			// tone over the same 300ms. The fill is a transform on an overlay bar,
			// so completing a set never reflows the row.
			// LIVE-22 (§27.2): the current exercise is the screen's one box -- a
			// panel with the action colour as its mark; the others stay ruled
			// entries, a finished one keeping the completion mark. Inside a
			// superset or circuit the group's own rule already carries the
			// mark, so the member's panel keeps a plain border -- and below `sm`
			// none at its sides, whose width the set fields need.
			className={`mark mark-fill transition-colors duration-[var(--motion-slow)] ease-standard ${
				isCurrent && !isComplete
					? `my-2 rounded-sm border border-rule bg-surface px-2 py-4 sm:px-3 ${
							roundLine
								? 'max-sm:rounded-none max-sm:border-x-0 max-sm:px-0'
								: 'border-l-[3px] border-l-primary'
						}`
					: `rule-row py-4 pl-3 ${isComplete ? 'mark-success' : ''}`
			}`}
		>
			<div className="flex items-center justify-between gap-2">
				{/* LIVE-22: the heading holds the toggle, as `CollapsibleSection`'s does
			(§20.1): a button may hold only phrasing content, so the lines inside
			are spans, and its state is `aria-expanded`, never the chevron alone. */}
				<h3 className="type-panel min-w-0 flex-1">
					<Button
						id={`exercise-${exerciseId}-toggle`}
						variant="ghost"
						onClick={onToggleCollapse}
						aria-expanded={!isCollapsed}
						aria-controls={setsId}
						className="h-auto min-h-11 w-full min-w-0 justify-between rounded-none p-0 hover:bg-transparent hover:no-underline large-controls:h-auto large-controls:min-h-12 large-controls:px-0"
					>
						<span className="flex min-w-0 flex-1 items-center gap-3">
							{isCollapsed ? (
								<ChevronRight
									className="h-4 w-4 shrink-0 text-ink-3"
									aria-hidden
								/>
							) : (
								<ChevronDown
									className="h-4 w-4 shrink-0 text-ink-3"
									aria-hidden
								/>
							)}
							<span className="min-w-0 text-left">
								{roundLine ? (
									<span className="type-body-sm block text-ink-3">
										{roundLine}
									</span>
								) : null}
								<span className="type-panel line-clamp-1 text-foreground">
									{exerciseName}
								</span>
								<span className="type-data mt-0.5 block text-ink-3">
									{t('setsCount', {
										completed: completedSets,
										total: totalSets,
									})}
								</span>
								{line ? (
									<span className="type-body-sm block whitespace-normal text-ink-2">
										{line}
									</span>
								) : null}
								{blockLine ? (
									<span className="type-body-sm block text-ink-2">
										{blockLine}
									</span>
								) : null}
								{linearBlockUnset ? (
									<span className="type-body-sm block whitespace-normal text-ink-3">
										{tRoutineBlock('noReference')}
									</span>
								) : null}
								{upNext ? (
									<span className="type-body-sm block text-foreground">
										{upNext}
									</span>
								) : null}
								{substitutedFrom ? (
									<span className="type-body-sm line-clamp-1 text-ink-3">
										{t('swappedFrom', {
											name: exerciseLabel(substitutedFrom, tEx),
										})}
									</span>
								) : null}
								{instruction ? (
									<span className="type-body-sm line-clamp-2 whitespace-normal text-ink-3">
										{t('routineNote', { note: instruction })}
									</span>
								) : null}
								{sessionNote ? (
									<span className="type-body-sm line-clamp-2 whitespace-normal text-ink-2">
										{t('yourNote', { note: sessionNote })}
									</span>
								) : null}
							</span>
						</span>
					</Button>
				</h3>

				<div className="flex shrink-0 items-center gap-3">
					{grouped ? (
						<>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										// LIVE-22: 44px on a phone, as every workout control is (§22.3).
										className="size-11 md:size-10"
										aria-label={t('moreForAria', { exercise: exerciseName })}
										onClick={event => event.stopPropagation()}
									>
										<MoreHorizontal className="size-5" aria-hidden />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{onSwapRequest ? (
										<DropdownMenuItem onSelect={() => onSwapRequest()}>
											<ArrowLeftRight aria-hidden />
											{t('swapExercise')}
										</DropdownMenuItem>
									) : null}
									{calculatorTarget ? (
										<DropdownMenuItem onSelect={() => setOpenTool('plates')}>
											<Calculator aria-hidden />
											{t('calculatePlates')}
										</DropdownMenuItem>
									) : null}
									<DropdownMenuItem onSelect={() => setOpenTool('note')}>
										<NotebookPen aria-hidden />
										{sessionNote ? t('editNote') : t('addNote')}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
							{calculatorTarget ? (
								<PlateCalculatorDialog
									exerciseName={exerciseName}
									initialTargetWeightKg={calculatorTarget}
									open={openTool === 'plates'}
									onOpenChange={open => setOpenTool(open ? 'plates' : null)}
								/>
							) : null}
							<ExerciseNoteButton
								sessionId={sessionId}
								routineExerciseId={exerciseId}
								exerciseName={exerciseName}
								note={sessionNote ?? null}
								instruction={instruction}
								open={openTool === 'note'}
								onOpenChange={open => setOpenTool(open ? 'note' : null)}
							/>
						</>
					) : (
						<>
							{onSwapRequest ? (
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="size-11 md:size-10"
									aria-label={t('swapAria', { exercise: exerciseName })}
									title={t('swapTitle')}
									onClick={event => {
										event.stopPropagation()
										onSwapRequest()
									}}
								>
									<ArrowLeftRight className="h-4 w-4" aria-hidden />
								</Button>
							) : null}

							{calculatorTarget ? (
								<PlateCalculatorDialog
									exerciseName={exerciseName}
									initialTargetWeightKg={calculatorTarget}
								/>
							) : null}

							{/* LIVE-16: a note for this workout. It used to write the
					    routine's own note, so a remark about today overwrote the
					    standing instruction for every workout after it. */}
							<ExerciseNoteButton
								sessionId={sessionId}
								routineExerciseId={exerciseId}
								exerciseName={exerciseName}
								note={sessionNote ?? null}
								instruction={instruction}
							/>
						</>
					)}

					{/* LIVE-22 (§27.1): a glyph and a word, sentence case and unclipped,
					rather than tracked capitals in success text. */}
					{isComplete ? (
						<StatusMark state="done" label={t('complete')} />
					) : null}
				</div>
			</div>

			{/* ROUT-17: a finished block's sets repeat its last step and move
			    nothing; what follows is chosen on the routine page. Outside the
			    header, which is a button and cannot hold a link. */}
			{linearBlock && blockState?.phase === 'FINISHED' ? (
				<p className="type-body-sm mt-2 max-w-[68ch] text-ink-2">
					{lpFinishedNote(linearBlock.rotation, tBlock)}
					{linearBlock.routineId ? (
						<>
							{' '}
							<Link
								href={`/routines/${linearBlock.routineId}`}
								className="inline-flex min-h-11 items-center text-foreground underline underline-offset-4 md:min-h-0"
							>
								{tBlock('chooseNext')}
							</Link>
						</>
					) : null}
				</p>
			) : null}

			{!isCollapsed && (
				<div id={setsId} className="mt-3">
					<SetColumnsHeader
						weightUnit={weightUnit}
						linearBlock={Boolean(blockState)}
					/>
					{sets.map((set, index) => (
						<SetLogInput
							// The exercise is part of the key: a LIVE-11 swap must remount the
							// inputs, or values typed for the replaced exercise carry over.
							key={`${set.routineExerciseId}-${set.exerciseId}-${set.setNumber}`}
							sessionId={set.sessionId}
							routineExerciseId={set.routineExerciseId}
							exerciseId={set.exerciseId}
							setNumber={set.setNumber}
							reps={set.reps}
							weight={
								set.weightIsSuggestion && !set.isCompleted
									? undefined
									: set.weight
							}
							suggestedWeight={
								set.weightIsSuggestion ? set.plannedWeight : null
							}
							state={rowState(set)}
							showRepsTarget={!matchesPrescription(set, prescription).reps}
							showWeightTarget={!matchesPrescription(set, prescription).weight}
							showRir={
								!(
									prescription?.rir != null &&
									set.kind === 'WORKING' &&
									!set.isExtra
								)
							}
							isCompleted={set.isCompleted}
							plannedReps={set.plannedReps}
							plannedMinReps={set.plannedMinReps}
							plannedMaxReps={set.plannedMaxReps}
							plannedWeight={set.plannedWeight}
							plannedRir={set.plannedRir}
							weightUnit={weightUnit}
							exerciseName={exerciseName}
							// LIVE-11: last time counts only if it was the same exercise.
							previousPerformance={comparablePrevious(
								previousSets?.get(`${set.routineExerciseId}:${set.setNumber}`),
								set.exerciseId,
							)}
							rpe={set.rpe}
							isExtra={set.isExtra}
							kind={set.kind}
							linearBlock={blockSet(set)}
							// LIVE-12: only a set of the same kind is worth copying.
							setAbove={
								index > 0 && sets[index - 1].kind === set.kind
									? {
											setNumber: sets[index - 1].setNumber,
											reps: sets[index - 1].reps,
											weight: sets[index - 1].weight,
											rpe: sets[index - 1].rpe,
										}
									: undefined
							}
							onRemove={
								onRemoveSet && set.isExtra && set === lastSet
									? () => onRemoveSet(set.routineExerciseId, set.setNumber)
									: undefined
							}
							onSave={onSave}
							onSetCompleted={
								onSetCompleted
									? viaKeyboard => onSetCompleted(set.setNumber, viaKeyboard)
									: undefined
							}
						/>
					))}
					{canAddSet ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="type-body-sm h-11 px-2 text-ink-2 md:h-8"
							aria-label={t('addSetAria', { exercise: exerciseName })}
							onClick={addSet}
						>
							<Plus className="h-4 w-4" aria-hidden />
							{t('addSet')}
						</Button>
					) : null}
				</div>
			)}
		</section>
	)
}
