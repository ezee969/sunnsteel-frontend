import {
	ROUTINE_DRAFT_REQUEST_MAX,
	ROUTINE_DRAFT_REQUEST_MIN,
	type RoutineDraft,
	type RoutineDraftUsage,
} from '@sunsteel/contracts'

import type { RoutineWizardData } from '@/features/routines/wizard/types'

/**
 * INTEL-03: a draft the server wrote, opened in the routine wizard. Like a
 * starter template it carries no load -- the member's first logged weight is
 * where progression starts -- and nothing is stored until the member saves it.
 */

const STORAGE_KEY = 'ss-routine-draft'

let clientIds = 0
const makeClientId = () => `draft-${Date.now()}-${(clientIds += 1)}`

export function draftToWizard(draft: RoutineDraft): RoutineWizardData {
	return {
		name: draft.name,
		description: draft.description,
		scheduleMode: draft.scheduleMode,
		trainingDays: draft.days.map(day => day.slot),
		restDays: [],
		rotationWeekdays: [],
		days: draft.days.map(day => ({
			slot: day.slot,
			name: day.name,
			exercises: day.exercises.map(exercise => ({
				clientId: makeClientId(),
				exerciseId: exercise.exerciseId,
				progressionScheme: 'DOUBLE_PROGRESSION',
				minWeightIncrement: exercise.minWeightIncrement,
				restSeconds: exercise.restSeconds,
				sets: Array.from({ length: exercise.sets }, (_, index) => ({
					setNumber: index + 1,
					repType: 'RANGE' as const,
					reps: null,
					minReps: exercise.minReps,
					maxReps: exercise.maxReps,
					weight: null,
					rir: 2,
				})),
			})),
		})),
	}
}

/** The text, measured as the server measures it. */
export function draftRequestFits(text: string): boolean {
	const { length } = text.trim()
	return (
		length >= ROUTINE_DRAFT_REQUEST_MIN && length <= ROUTINE_DRAFT_REQUEST_MAX
	)
}

/** How many drafts remain, never below none. */
export function draftsLeft(usage: RoutineDraftUsage): number {
	return Math.max(0, usage.limit - usage.used)
}

type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/**
 * A delivered draft outlives a reload of this tab, because it used one of the
 * month's drafts. Only the draft is kept, never what the member typed, and
 * blocked storage only loses that convenience.
 */
export function keepDraft(storage: DraftStorage, draft: RoutineDraft): void {
	try {
		storage.setItem(STORAGE_KEY, JSON.stringify(draft))
	} catch {
		// The draft is still open on the page.
	}
}

export function readKeptDraft(storage: DraftStorage): RoutineDraft | null {
	try {
		const stored = storage.getItem(STORAGE_KEY)
		if (!stored) return null
		const draft = JSON.parse(stored) as RoutineDraft
		return Array.isArray(draft?.days) && typeof draft.name === 'string'
			? draft
			: null
	} catch {
		return null
	}
}

export function forgetDraft(storage: DraftStorage): void {
	try {
		storage.removeItem(STORAGE_KEY)
	} catch {
		// Nothing more to do.
	}
}
