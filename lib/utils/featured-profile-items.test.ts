import type { FeaturedProfileSelection } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	addFeaturedRecord,
	buildFeaturedProfileRequest,
	moveFeaturedProfileItem,
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

	it('adds unique records and removes items without losing other kinds', () => {
		const added = addFeaturedRecord(items, 'bench')
		expect(addFeaturedRecord(added, 'bench')).toBe(added)
		expect(removeFeaturedProfileItem(added, 'RECORD:squat')).toEqual([
			{ kind: 'ACHIEVEMENT', referenceId: 'sessions:10', position: 0 },
			{ kind: 'RECORD', referenceId: 'bench', position: 1 },
		])
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
