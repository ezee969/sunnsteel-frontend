'use client'

import type {
	CorrectSessionSetRequest,
	SessionCorrection,
	SessionCorrectionWindow,
	WeightUnit,
} from '@sunsteel/contracts'
import { History, Loader2, PencilLine } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useCorrectSession } from '@/lib/api/hooks/useWorkoutSession'
import { formatTimeAgo } from '@/lib/utils/date'
import type { ExerciseGroup } from '@/lib/utils/exercise-groups'
import {
	buildCorrectionRequest,
	changedSets,
	CORRECTION_EFFECTS,
	type CorrectionDraftSet,
	describeCorrectionWindow,
	describeKeptProgression,
	describeSetCorrection,
	describeSetValues,
	draftFromLogs,
	type DraftProblem,
} from '@/lib/utils/session-corrections'
import { getWeightUnitLabel } from '@/lib/utils/weight-unit'

/**
 * LIVE-17: the invitation to correct and the trail of corrections. The
 * invitation shows only while the server says the window is open; the trail
 * shows on any workout that has one, because a changed record deserves to
 * say it was changed.
 */
export function SessionCorrectionSummary({
	correctionWindow,
	corrections,
	weightUnit,
	onStart,
	editing,
}: {
	correctionWindow: SessionCorrectionWindow | undefined
	corrections: SessionCorrection[]
	weightUnit: WeightUnit
	onStart: () => void
	editing: boolean
}) {
	const note = correctionWindow
		? describeCorrectionWindow(correctionWindow)
		: null
	if (!note && corrections.length === 0) return null
	return (
		<section
			aria-labelledby="session-corrections-heading"
			className="space-y-3"
		>
			<h2
				id="session-corrections-heading"
				className="type-section rule-heading flex items-center gap-2 pb-2 text-foreground"
			>
				<History className="size-4 text-ink-3" aria-hidden />
				Corrections
			</h2>
			{note ? (
				<div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
					<p className="type-body-sm max-w-[68ch] text-ink-3">{note}</p>
					{correctionWindow?.correctableUntil && !editing ? (
						<Button type="button" variant="outline" size="sm" onClick={onStart}>
							<PencilLine className="size-4" aria-hidden />
							Correct sets
						</Button>
					) : null}
				</div>
			) : null}
			{corrections.length ? (
				<ol
					aria-label="Saved corrections"
					className="border-t border-rule-faint"
				>
					{[...corrections].reverse().map(correction => (
						<li key={correction.id} className="rule-row space-y-1 py-3">
							<p className="type-body-sm text-ink-3">
								Corrected{' '}
								<time dateTime={correction.createdAt}>
									{formatTimeAgo(correction.createdAt)}
								</time>
							</p>
							<ul className="space-y-0.5">
								{correction.changes.map(change => (
									<li
										key={`${correction.id}-${change.setLogId}`}
										className="type-body-sm text-ink-2"
									>
										{describeSetCorrection(change, weightUnit)}
									</li>
								))}
							</ul>
						</li>
					))}
				</ol>
			) : null}
		</section>
	)
}

// Tight padding so a value like 92.5 fits the narrow phone column.
const FIELD =
	'px-1 md:max-w-[var(--field-max)] text-center font-mono tabular-nums'
// One grid for the caption row and every set row; capped so a wide screen
// does not stretch a two-digit number across the page (§10.2).
const ROW =
	'grid max-w-[var(--cluster-max)] grid-cols-[2.5rem_repeat(3,minmax(0,1fr))_2.75rem] gap-2'

/**
 * The logged sets of one finished workout as editable rows. Only sets that
 * were logged can be corrected; a planned set never touched has nothing to
 * correct.
 */
export function SessionCorrectionEditor({
	sessionId,
	groups,
	weightUnit,
	onDone,
}: {
	sessionId: string
	groups: ExerciseGroup[]
	weightUnit: WeightUnit
	onDone: () => void
}) {
	const { push } = useToast()
	const correct = useCorrectSession(sessionId)
	const logs = useMemo(
		() =>
			groups.flatMap(group =>
				[...group.performedSets].sort((a, b) => a.setNumber - b.setNumber),
			),
		[groups],
	)
	const [draft, setDraft] = useState<Record<string, CorrectionDraftSet>>(() =>
		draftFromLogs(logs, weightUnit),
	)
	const [problems, setProblems] = useState<DraftProblem[]>([])
	const [pending, setPending] = useState<CorrectSessionSetRequest[] | null>(
		null,
	)
	const unit = getWeightUnitLabel(weightUnit)
	const logById = useMemo(() => new Map(logs.map(log => [log.id, log])), [logs])
	const nameByLog = useMemo(() => {
		const names = new Map<string, string>()
		for (const group of groups)
			for (const log of group.performedSets)
				names.set(log.id, group.exercise.name)
		return names
	}, [groups])

	const update = (id: string, patch: Partial<CorrectionDraftSet>) =>
		setDraft(current => ({ ...current, [id]: { ...current[id], ...patch } }))

	const review = () => {
		const { sets, problems: found } = buildCorrectionRequest(
			draft,
			logs,
			weightUnit,
		)
		setProblems(found)
		if (found.length) return
		const changes = changedSets(sets, logs)
		if (changes.length === 0) {
			push({
				title: 'Nothing to correct',
				description: 'Every set already reads that way.',
			})
			return
		}
		setPending(changes)
	}

	const save = () => {
		if (!pending) return
		correct.mutate(
			{ sets: pending },
			{
				onSuccess: result => {
					setPending(null)
					push({
						title: 'Workout corrected',
						description:
							describeKeptProgression(
								result.progressionKept.map(item => item.exerciseName),
							) ?? 'Everything this workout fed has been recalculated.',
						variant: 'success',
					})
					onDone()
				},
				onError: error => {
					setPending(null)
					push({
						title: 'Could not correct this workout',
						description: error.message,
						variant: 'destructive',
					})
				},
			},
		)
	}

	const problemFor = (id: string) =>
		problems.find(problem => problem.setLogId === id)?.message

	return (
		<section aria-labelledby="correct-sets-heading" className="space-y-4">
			<div>
				<h2
					id="correct-sets-heading"
					className="type-section rule-heading pb-2 text-foreground"
				>
					Correct Sets
				</h2>
				<p className="type-body-sm mt-2 max-w-[68ch] text-ink-3">
					Change what you actually did. Weights are in {unit}.
				</p>
			</div>
			<div className="border-y border-rule">
				{groups
					.filter(group => group.performedSets.length > 0)
					.map(group => (
						<div
							key={group.routineExerciseId}
							role="group"
							aria-labelledby={`correct-${group.routineExerciseId}`}
							className="rule-row space-y-2 py-4"
						>
							<h3
								id={`correct-${group.routineExerciseId}`}
								className="type-panel text-foreground"
							>
								{group.exercise.name}
							</h3>
							<div
								className={`type-body-sm ${ROW} items-end text-ink-3`}
								aria-hidden
							>
								<span>Set</span>
								<span>Weight</span>
								<span>Reps</span>
								<span>RPE</span>
								<span className="text-center">Done</span>
							</div>
							{[...group.performedSets]
								.sort((a, b) => a.setNumber - b.setNumber)
								.map(log => {
									const row = draft[log.id]
									const problem = problemFor(log.id)
									const errorId = `correct-${log.id}-error`
									const label = `${group.exercise.name}, set ${log.setNumber}`
									return (
										<div key={log.id} className="space-y-1">
											<div className={`${ROW} items-center`}>
												<span className="type-data text-ink-2">
													{log.setNumber}
												</span>
												<Input
													type="number"
													inputMode="decimal"
													min="0"
													step={weightUnit === 'LB' ? 1 : 0.5}
													aria-label={`${label}: weight in ${unit}`}
													aria-invalid={problem ? true : undefined}
													aria-describedby={problem ? errorId : undefined}
													value={row.weight}
													onChange={event =>
														update(log.id, { weight: event.target.value })
													}
													className={FIELD}
												/>
												<Input
													type="number"
													inputMode="numeric"
													min="0"
													step="1"
													aria-label={`${label}: reps`}
													aria-invalid={problem ? true : undefined}
													aria-describedby={problem ? errorId : undefined}
													value={row.reps}
													onChange={event =>
														update(log.id, { reps: event.target.value })
													}
													className={FIELD}
												/>
												<Input
													type="number"
													inputMode="decimal"
													min="0"
													max="10"
													step="0.5"
													aria-label={`${label}: RPE, 0 to 10`}
													aria-invalid={problem ? true : undefined}
													aria-describedby={problem ? errorId : undefined}
													value={row.rpe}
													onChange={event =>
														update(log.id, { rpe: event.target.value })
													}
													className={FIELD}
												/>
												<div className="flex justify-center">
													<Checkbox
														checked={row.isCompleted}
														onCheckedChange={checked =>
															update(log.id, { isCompleted: checked === true })
														}
														aria-label={`${label}: done`}
														className="size-5"
													/>
												</div>
											</div>
											{problem ? (
												<p
													id={errorId}
													role="alert"
													className="type-body-sm text-destructive"
												>
													{problem}
												</p>
											) : null}
										</div>
									)
								})}
						</div>
					))}
			</div>
			<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<Button type="button" variant="outline" onClick={onDone}>
					Cancel
				</Button>
				<Button type="button" onClick={review}>
					Review correction
				</Button>
			</div>

			<Dialog
				open={pending !== null}
				onOpenChange={open => {
					if (!open && !correct.isPending) setPending(null)
				}}
			>
				<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Save this correction?</DialogTitle>
						<DialogDescription>{CORRECTION_EFFECTS}</DialogDescription>
					</DialogHeader>
					<ul className="space-y-1 border-t border-rule-faint pt-3">
						{(pending ?? []).map(set => {
							const log = logById.get(set.setLogId)
							if (!log) return null
							return (
								<li key={set.setLogId} className="type-body-sm text-ink-2">
									{nameByLog.get(set.setLogId)}, set {log.setNumber}:{' '}
									{describeSetValues(
										{
											weight: log.weight ?? null,
											reps: log.reps ?? null,
											rpe: log.rpe ?? null,
											isCompleted: log.isCompleted,
										},
										weightUnit,
									)}{' '}
									→ {describeSetValues(set, weightUnit)}
								</li>
							)
						})}
					</ul>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setPending(null)}
							disabled={correct.isPending}
						>
							Keep editing
						</Button>
						<Button type="button" onClick={save} disabled={correct.isPending}>
							{correct.isPending ? (
								<Loader2 className="size-4 animate-spin" aria-hidden />
							) : null}
							Save correction
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</section>
	)
}
