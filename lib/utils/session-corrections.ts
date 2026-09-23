import type {
	CorrectSessionSetRequest,
	SessionCorrectionClosedReason,
	SessionCorrectionWindow,
	SessionSetCorrection,
	SetLogValues,
	WeightUnit,
} from '@sunsteel/contracts'
import { SESSION_CORRECTION_WINDOW_HOURS } from '@sunsteel/contracts'

import {
	areCanonicalWeightsEqual,
	formatWeightInput,
	getWeightUnitLabel,
	parseWeightInput,
} from './weight-unit'

/**
 * LIVE-17 copy and the editing draft. The server decides whether a workout
 * can be corrected and re-derives everything; this module only words it and
 * turns what the owner typed into the request.
 */

const DATE_TIME = new Intl.DateTimeFormat(undefined, {
	weekday: 'short',
	day: 'numeric',
	month: 'short',
	hour: 'numeric',
	minute: '2-digit',
})

export const CORRECTION_EFFECTS =
	'Your records, weekly totals, achievements and the loads this workout set for next time are recalculated from the corrected sets. A record or load change that no longer holds leaves your activity, with any reactions and comments on it. Every correction is kept with the values before and after.'

/** Why the window is open until when, or why it is closed. */
export function describeCorrectionWindow(
	window: SessionCorrectionWindow,
): string | null {
	if (window.correctableUntil) {
		return `You can correct this workout until ${DATE_TIME.format(new Date(window.correctableUntil))}, or until you start another one.`
	}
	return describeClosedReason(window.closedReason)
}

export function describeClosedReason(
	reason: SessionCorrectionClosedReason | null,
): string | null {
	switch (reason) {
		case 'WINDOW_PASSED':
			return `Corrections close ${SESSION_CORRECTION_WINDOW_HOURS} hours after a workout ends.`
		case 'LATER_SESSION':
			return 'Corrections closed when you started another workout, which was built on this one.'
		case 'LIMIT_REACHED':
			return 'This workout has been corrected as many times as allowed.'
		// Older workouts and unfinished ones say nothing: there is nothing the
		// owner could have done here.
		case 'NOT_LATEST':
		case 'NOT_COMPLETED':
		case null:
			return null
	}
}

/** One set's values in words, in the viewer's unit. */
export function describeSetValues(
	values: SetLogValues,
	unit: WeightUnit,
): string {
	const load =
		values.weight === null || values.weight === 0
			? 'Bodyweight'
			: `${formatWeightInput(values.weight, unit)} ${getWeightUnitLabel(unit)}`
	const reps = values.reps === null ? 'no reps' : `${values.reps}`
	const parts = [`${load} × ${reps}`]
	if (values.rpe !== null) parts.push(`RPE ${values.rpe}`)
	if (!values.isCompleted) parts.push('not done')
	return parts.join(' · ')
}

export function describeSetCorrection(
	change: SessionSetCorrection,
	unit: WeightUnit,
): string {
	return `${change.exerciseName}, set ${change.setNumber}: ${describeSetValues(change.before, unit)} → ${describeSetValues(change.after, unit)}`
}

export function describeKeptProgression(names: string[]): string | null {
	if (names.length === 0) return null
	const list =
		names.length === 1
			? names[0]
			: `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
	return `The load change for ${list} was kept, because you edited the routine after this workout.`
}

/** What the owner is typing, one row per logged set, in their unit. */
export interface CorrectionDraftSet {
	setLogId: string
	weight: string
	reps: string
	rpe: string
	isCompleted: boolean
}

export interface CorrectableSetLog {
	id: string
	weight?: number | null
	reps?: number | null
	rpe?: number | null
	isCompleted: boolean
}

export function draftFromLogs(
	logs: CorrectableSetLog[],
	unit: WeightUnit,
): Record<string, CorrectionDraftSet> {
	return Object.fromEntries(
		logs.map(log => [
			log.id,
			{
				setLogId: log.id,
				weight: formatWeightInput(log.weight ?? null, unit),
				reps: log.reps == null ? '' : String(log.reps),
				rpe: log.rpe == null ? '' : String(log.rpe),
				isCompleted: log.isCompleted,
			},
		]),
	)
}

export type DraftProblem = { setLogId: string; message: string }

/**
 * Turns the draft into the request. A weight the owner did not change is
 * sent back exactly as stored: in pounds the box shows a rounded value, and
 * converting that back would read as a correction nobody made.
 */
export function buildCorrectionRequest(
	draft: Record<string, CorrectionDraftSet>,
	logs: CorrectableSetLog[],
	unit: WeightUnit,
): { sets: CorrectSessionSetRequest[]; problems: DraftProblem[] } {
	const sets: CorrectSessionSetRequest[] = []
	const problems: DraftProblem[] = []
	for (const log of logs) {
		const row = draft[log.id]
		if (!row) continue
		const original = log.weight ?? null
		let weight: number | null = null
		if (row.weight.trim() !== '') {
			const parsed = parseWeightInput(row.weight, unit)
			if (parsed === undefined) {
				problems.push({
					setLogId: log.id,
					message: 'Enter a weight of 0 or more.',
				})
				continue
			}
			weight =
				original !== null && areCanonicalWeightsEqual(parsed, original)
					? original
					: parsed
		}
		const reps = row.reps.trim() === '' ? null : Number(row.reps)
		if (reps !== null && (!Number.isInteger(reps) || reps < 0)) {
			problems.push({
				setLogId: log.id,
				message: 'Reps must be a whole number.',
			})
			continue
		}
		const rpe = row.rpe.trim() === '' ? null : Number(row.rpe)
		if (rpe !== null && (!Number.isFinite(rpe) || rpe < 0 || rpe > 10)) {
			problems.push({
				setLogId: log.id,
				message: 'RPE must be between 0 and 10.',
			})
			continue
		}
		if (row.isCompleted && (reps === null || reps < 1)) {
			problems.push({
				setLogId: log.id,
				message: 'A done set needs at least one rep.',
			})
			continue
		}
		sets.push({
			setLogId: log.id,
			weight,
			reps,
			rpe,
			isCompleted: row.isCompleted,
		})
	}
	return { sets, problems }
}

/** The sets the request would change, compared with what is stored. */
export function changedSets(
	sets: CorrectSessionSetRequest[],
	logs: CorrectableSetLog[],
): CorrectSessionSetRequest[] {
	const byId = new Map(logs.map(log => [log.id, log]))
	return sets.filter(set => {
		const log = byId.get(set.setLogId)
		if (!log) return false
		return (
			(log.weight ?? null) !== set.weight ||
			(log.reps ?? null) !== set.reps ||
			(log.rpe ?? null) !== set.rpe ||
			log.isCompleted !== set.isCompleted
		)
	})
}
