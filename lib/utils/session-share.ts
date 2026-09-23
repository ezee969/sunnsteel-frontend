import type {
	SessionShareField,
	SharedSessionRecap,
	WorkoutSessionRecap,
} from '@sunsteel/contracts'
import { SESSION_SHARE_FIELDS } from '@sunsteel/contracts'

export const SESSION_SHARE_FIELD_COPY: Record<
	SessionShareField,
	{ label: string; description: string }
> = {
	duration: { label: 'Duration', description: 'How long the session took.' },
	volume: { label: 'Volume', description: 'Total external load you moved.' },
	completedSets: {
		label: 'Completed sets',
		description: 'How many sets you finished.',
	},
	records: {
		label: 'Personal records',
		description: 'Records set in this session, with their loads.',
	},
	progression: {
		label: 'Progression changes',
		description:
			'Prescriptions that advanced afterwards, with old and new loads.',
	},
	notes: {
		label: 'Session notes',
		description: 'Your written notes, exactly as saved.',
	},
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
): string {
	return fields.map(field => SESSION_SHARE_FIELD_COPY[field].label).join(' · ')
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
		},
	}
}
