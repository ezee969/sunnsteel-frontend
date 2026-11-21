import {
	ACHIEVEMENT_DEFINITIONS,
	RENAISSANCE_RANK_DEFINITIONS,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { proofCells } from './proof-figures'

describe('proof band cells (SITE-01 §12.3)', () => {
	it('shows the mock usage figures outside production, marked as mock', () => {
		const cells = proofCells(false)
		expect(cells.map(c => c.label)).toEqual([
			'members',
			'workouts',
			'exercises',
			'languages',
		])
		expect(cells.slice(0, 2).every(c => c.kind === 'number' && c.mock)).toBe(
			true,
		)
	})

	it('never shows a mock figure in production: the reserves are true facts', () => {
		const cells = proofCells(true)
		expect(cells.map(c => c.label)).toEqual([
			'milestones',
			'ranks',
			'exercises',
			'languages',
		])
		expect(cells.some(c => c.kind === 'number' && c.mock)).toBe(false)
		expect(cells[0]).toMatchObject({ value: ACHIEVEMENT_DEFINITIONS.length })
		expect(cells[1]).toMatchObject({
			value: RENAISSANCE_RANK_DEFINITIONS.length,
		})
	})
})
