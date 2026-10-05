import type {
	SessionShareField,
	SharedSessionRecap,
	WorkoutSessionRecap,
} from '@sunsteel/contracts'
import { SESSION_SHARE_FIELDS } from '@sunsteel/contracts'

import type { Translator } from '@/i18n/translator'

export function sessionShareFieldLabel(
	field: SessionShareField,
	t: Translator<'workout.share'>,
): string {
	return t(`fields.${field}.label`)
}

export function sessionShareFieldDescription(
	field: SessionShareField,
	t: Translator<'workout.share'>,
): string {
	return t(`fields.${field}.description`)
}

/** Recap regions `SessionRecapContent` can show or hide. */
export type RecapSection =
	| 'duration'
	| 'volume'
	| 'completedSets'
	| 'comparison'
	| 'records'
	| 'progression'
	| 'notes'
	/** ROUT-17/ROUT-18: owner-only, since a finished block names the reference max. */
	| 'linearBlock'

export type RecapSections = Record<RecapSection, boolean>

export function getSharedSessionPath(token: string): string {
	return `/shared/sessions/${encodeURIComponent(token)}`
}

export function getSharedSessionUrl(token: string, origin: string): string {
	return new URL(getSharedSessionPath(token), origin).toString()
}

/** Adds or removes one field and keeps the canonical order. */
export function toggleShareField(
	fields: readonly SessionShareField[],
	field: SessionShareField,
	include: boolean,
): SessionShareField[] {
	const next = new Set(fields)
	if (include) next.add(field)
	else next.delete(field)
	return SESSION_SHARE_FIELDS.filter(candidate => next.has(candidate))
}

export function describeShareFields(
	fields: readonly SessionShareField[],
	t: Translator<'workout.share'>,
): string {
	return fields.map(field => sessionShareFieldLabel(field, t)).join(' · ')
}

/**
 * Adapts the public, field-filtered response to the owner recap view so both
 * render through one component. Hidden regions are switched off rather than
 * shown with invented zeroes; the previous-session comparison is never shared.
 */
export function sharedRecapToRecapView(shared: SharedSessionRecap): {
	recap: WorkoutSessionRecap
	sections: RecapSections
} {
	const has = (field: SessionShareField) => shared.fields.includes(field)
	return {
		recap: {
			sessionId: '',
			routineName: shared.routineName,
			dayName: shared.dayName ?? null,
			startedAt: shared.endedAt,
			endedAt: shared.endedAt,
			durationSec: shared.durationSec ?? 0,
			totalVolumeKg: shared.totalVolumeKg ?? 0,
			completedSets: shared.completedSets ?? 0,
			notes: shared.notes ?? null,
			exerciseNotes: shared.exerciseNotes ?? [],
			records: shared.records ?? [],
			progressionChanges: shared.progressionChanges ?? [],
			// Never shared: a finished block names the owner's reference max.
			linearBlockChanges: [],
			routineId: null,
			previousSession: null,
		},
		sections: {
			duration: has('duration'),
			volume: has('volume'),
			completedSets: has('completedSets'),
			comparison: false,
			records: has('records'),
			progression: has('progression'),
			notes: has('notes'),
			linearBlock: false,
		},
	}
}
