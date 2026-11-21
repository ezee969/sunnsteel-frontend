import {
	ACHIEVEMENT_DEFINITIONS,
	RENAISSANCE_RANK_DEFINITIONS,
} from '@sunsteel/contracts'

import { LOCALES } from '@/i18n/config'

/**
 * SITE-01 §12.3: the proof band's four cells. Two usage figures are
 * placeholders the owner chose for the mock-up (2026-11-20) -- no real usage
 * figure exists -- so **a production build never shows them**: each becomes the
 * next reserve fact, true today and read from contracts rather than typed.
 */
export const PLACEHOLDER_FIGURES = { members: 12_400, workouts: 350_000 }

/** The seeded catalog holds 80 exercises; "80+" stays true as it grows. */
export const CATALOG_FLOOR = 80

export type ProofLabel =
	'members' | 'workouts' | 'exercises' | 'milestones' | 'ranks' | 'languages'

export type ProofCell =
	| { kind: 'number'; value: number; label: ProofLabel; mock: boolean }
	| { kind: 'floor'; value: number; label: 'exercises' }

const RESERVES: ProofCell[] = [
	{
		kind: 'number',
		value: ACHIEVEMENT_DEFINITIONS.length,
		label: 'milestones',
		mock: false,
	},
	{
		kind: 'number',
		value: RENAISSANCE_RANK_DEFINITIONS.length,
		label: 'ranks',
		mock: false,
	},
]

/** The cells in order; `production` swaps each placeholder for a reserve. */
export function proofCells(production: boolean): ProofCell[] {
	const placeholders: ProofCell[] = [
		{
			kind: 'number',
			value: PLACEHOLDER_FIGURES.members,
			label: 'members',
			mock: true,
		},
		{
			kind: 'number',
			value: PLACEHOLDER_FIGURES.workouts,
			label: 'workouts',
			mock: true,
		},
	]
	return [
		...(production ? RESERVES : placeholders),
		{ kind: 'floor', value: CATALOG_FLOOR, label: 'exercises' },
		// The owner, 2026-11-21: 'free' is said once in the first viewport, on
		// the account button, so the fourth cell is a fact of its own.
		{ kind: 'number', value: LOCALES.length, label: 'languages', mock: false },
	]
}
