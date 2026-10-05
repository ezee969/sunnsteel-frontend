import type {
	CorrectSessionSetRequest,
	SessionCorrectionClosedReason,
	SessionCorrectionWindow,
	SessionSetCorrection,
	SetLogValues,
	WeightUnit,
} from '@sunsteel/contracts'
import { SESSION_CORRECTION_WINDOW_HOURS } from '@sunsteel/contracts'

import type { Locale } from '@/i18n/config'
import { dateFormatter } from '@/i18n/date-locale'
import type { Translator } from '@/i18n/translator'

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

/** Why the window is open until when, or why it is closed. */
export function describeCorrectionWindow(
	window: SessionCorrectionWindow,
	t: Translator<'workout.corrections'>,
	locale: Locale,
): string | null {
	if (window.correctableUntil) {
		return t('windowOpenUntil', {
			until: dateFormatter(locale, {
				weekday: 'short',
				day: 'numeric',
				month: 'short',
				hour: 'numeric',
				minute: '2-digit',
			}).format(new Date(window.correctableUntil)),
		})
	}
	return describeClosedReason(window.closedReason, t)
}

export function describeClosedReason(
	reason: SessionCorrectionClosedReason | null,
	t: Translator<'workout.corrections'>,
): string | null {
	switch (reason) {
		case 'WINDOW_PASSED':
			return t('closedReasonWindowPassed', {
				hours: SESSION_CORRECTION_WINDOW_HOURS,
			})
		case 'LATER_SESSION':
			return t('closedReasonLaterSession')
		case 'LIMIT_REACHED':
			return t('closedReasonLimitReached')
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
	t: Translator<'workout.corrections'>,
): string {
	const load =
		values.weight === null || values.weight === 0
			? t('bodyweight')
			: `${formatWeightInput(values.weight, unit)} ${getWeightUnitLabel(unit)}`
	const reps = values.reps === null ? t('noReps') : `${values.reps}`
	const parts = [`${load} × ${reps}`]
	if (values.rpe !== null) parts.push(t('rpeValue', { rpe: values.rpe }))
	if (!values.isCompleted) parts.push(t('notDone'))
	return parts.join(' · ')
}

export function describeSetCorrection(
	change: SessionSetCorrection,
	unit: WeightUnit,
	t: Translator<'workout.corrections'>,
): string {
	return t('setCorrectionLine', {
		exerciseName: change.exerciseName,
		setNumber: change.setNumber,
		before: describeSetValues(change.before, unit, t),
		after: describeSetValues(change.after, unit, t),
	})
}

function listNames(
	names: string[],
	t: Translator<'workout.corrections'>,
): string {
	return names.length === 1
		? names[0]
		: `${names.slice(0, -1).join(', ')}${t('listConjunction')}${names.at(-1)}`
}

export function describeKeptProgression(
	names: string[],
	t: Translator<'workout.corrections'>,
): string | null {
	if (names.length === 0) return null
	return t('keptProgressionOne', { list: listNames(names, t) })
}

/**
 * ROUT-17: the 8-week blocks a correction left where they are, because they
 * have moved on since this workout.
 */
export function describeKeptLinearBlock(
	names: string[],
	t: Translator<'workout.corrections'>,
): string | null {
	if (names.length === 0) return null
	return t('keptLinearBlockOne', { list: listNames(names, t) })
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
 * converting that back would read as a correction nobody made. A set whose
 * load is fixed (ROUT-17: a working set of an 8-week block, whose load the
 * server refuses to change) always sends its stored weight.
 */
export function buildCorrectionRequest(
	draft: Record<string, CorrectionDraftSet>,
	logs: CorrectableSetLog[],
	unit: WeightUnit,
	t: Translator<'workout.corrections'>,
	fixedWeightIds: ReadonlySet<string> = new Set(),
): { sets: CorrectSessionSetRequest[]; problems: DraftProblem[] } {
	const sets: CorrectSessionSetRequest[] = []
	const problems: DraftProblem[] = []
	for (const log of logs) {
		const row = draft[log.id]
		if (!row) continue
		const original = log.weight ?? null
		let weight: number | null = null
		if (fixedWeightIds.has(log.id)) {
			weight = original
		} else if (row.weight.trim() !== '') {
			const parsed = parseWeightInput(row.weight, unit)
			if (parsed === undefined) {
				problems.push({
					setLogId: log.id,
					message: t('problemInvalidWeight'),
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
				message: t('problemInvalidReps'),
			})
			continue
		}
		const rpe = row.rpe.trim() === '' ? null : Number(row.rpe)
		if (rpe !== null && (!Number.isFinite(rpe) || rpe < 0 || rpe > 10)) {
			problems.push({
				setLogId: log.id,
				message: t('problemInvalidRpe'),
			})
			continue
		}
		if (row.isCompleted && (reps === null || reps < 1)) {
			problems.push({
				setLogId: log.id,
				message: t('problemCompletedNeedsReps'),
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
