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
})
