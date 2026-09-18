import type { FeaturedProfileSelection } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	addFeaturedProfileItem,
	buildFeaturedProfileRequest,
	moveFeaturedProfileItem,
	reachedRenaissanceRanks,
	removeFeaturedProfileItem,
} from '@/lib/utils/featured-profile-items'

const items: FeaturedProfileSelection[] = [
	{ kind: 'ACHIEVEMENT', referenceId: 'sessions:10', position: 0 },
	{ kind: 'RECORD', referenceId: 'squat', position: 1 },
]

describe('featured profile selections', () => {
	it('reorders the whole mixed list and owns sequential positions', () => {
		expect(moveFeaturedProfileItem(items, 1, 0)).toEqual([
			{ kind: 'RECORD', referenceId: 'squat', position: 0 },
			{ kind: 'ACHIEVEMENT', referenceId: 'sessions:10', position: 1 },
		])
	})

	it('adds unique mixed items and removes one without losing other kinds', () => {
		const added = addFeaturedProfileItem(items, 'RECORD', 'bench')
		expect(addFeaturedProfileItem(added, 'RECORD', 'bench')).toBe(added)
		expect(removeFeaturedProfileItem(added, 'RECORD:squat')).toEqual([
			{ kind: 'ACHIEVEMENT', referenceId: 'sessions:10', position: 0 },
			{ kind: 'RECORD', referenceId: 'bench', position: 1 },
		])
	})

	it('allows one reached rank while preserving the shared six-slot limit', () => {
		const withRank = addFeaturedProfileItem(items, 'RANK', 'APPRENTICE')
		expect(addFeaturedProfileItem(withRank, 'RANK', 'INITIATE')).toBe(withRank)

		const full: FeaturedProfileSelection[] = Array.from(
			{ length: 6 },
			(_, position) => ({
				kind: 'RECORD',
				referenceId: `exercise-${position}`,
				position,
			}),
		)
		expect(addFeaturedProfileItem(full, 'ACHIEVEMENT', 'sessions:10')).toBe(
			full,
		)
	})

	it('offers every rank through the current one and never a future title', () => {
		expect(reachedRenaissanceRanks('ARTISAN').map(rank => rank.id)).toEqual([
			'INITIATE',
			'APPRENTICE',
			'ARTISAN',
		])
		expect(reachedRenaissanceRanks('UNKNOWN')).toEqual([])
	})

	it('sends only stable references and array order to the API', () => {
		expect(buildFeaturedProfileRequest(items)).toEqual({
			items: [
				{ kind: 'ACHIEVEMENT', referenceId: 'sessions:10' },
				{ kind: 'RECORD', referenceId: 'squat' },
			],
		})
	})

	it('treats a routine as one more slot, deduplicated and not rank-limited', () => {
		// PROF-08: a routine is a fourth kind in the same ordered six, so two
		// routines are allowed where two ranks are not.
		const withRoutine = addFeaturedProfileItem(items, 'ROUTINE', 'routine-1')
		const withTwo = addFeaturedProfileItem(withRoutine, 'ROUTINE', 'routine-2')
		expect(withTwo.map(item => [item.kind, item.referenceId])).toEqual([
			['ACHIEVEMENT', 'sessions:10'],
			['RECORD', 'squat'],
			['ROUTINE', 'routine-1'],
			['ROUTINE', 'routine-2'],
		])
		expect(addFeaturedProfileItem(withTwo, 'ROUTINE', 'routine-1')).toBe(
			withTwo,
		)
		expect(buildFeaturedProfileRequest(withRoutine).items).toContainEqual({
			kind: 'ROUTINE',
			referenceId: 'routine-1',
		})
	})
})
