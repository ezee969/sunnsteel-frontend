import { RENAISSANCE_RANK_DEFINITIONS } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	isRenaissanceRankId,
	RANK_CREST_COLOR_CLASS,
	rankCrestColorClass,
	rankCrestTier,
	UNREACHED_RANK_CREST_CLASS,
} from './rank-identity'

describe('rank identity', () => {
	it('gives every rank on the contract ladder its own pigment token', () => {
		const ids = RENAISSANCE_RANK_DEFINITIONS.map(rank => rank.id)
		expect(Object.keys(RANK_CREST_COLOR_CLASS).sort()).toEqual([...ids].sort())
		for (const id of ids) {
			expect(RANK_CREST_COLOR_CLASS[id]).toBe(`text-rank-${id.toLowerCase()}`)
		}
		expect(new Set(Object.values(RANK_CREST_COLOR_CLASS)).size).toBe(ids.length)
	})

	it('never borrows a locked semantic role', () => {
		for (const className of Object.values(RANK_CREST_COLOR_CLASS)) {
			expect(className).not.toMatch(/honour|success|warning|destructive/)
		}
	})

	it('escalates the crest in ladder order, keyed by ID rather than title', () => {
		expect(
			RENAISSANCE_RANK_DEFINITIONS.map(rank => rankCrestTier(rank.id)),
		).toEqual([0, 1, 2, 3, 4, 5])
		expect(rankCrestTier('Laureate')).toBe(-1)
		expect(rankCrestTier('EMPEROR')).toBe(-1)
	})

	it('draws a rank the member does not hold in ink-3', () => {
		expect(rankCrestColorClass('MAESTRO')).toBe('text-rank-maestro')
		expect(rankCrestColorClass('MAESTRO', false)).toBe(
			UNREACHED_RANK_CREST_CLASS,
		)
		expect(UNREACHED_RANK_CREST_CLASS).toBe('text-ink-3')
	})

	it('recognises only the ladder IDs', () => {
		expect(isRenaissanceRankId('ARTISAN')).toBe(true)
		expect(isRenaissanceRankId('toString')).toBe(false)
		expect(rankCrestColorClass('toString')).toBe(UNREACHED_RANK_CREST_CLASS)
	})
})
