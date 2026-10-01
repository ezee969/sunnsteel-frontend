import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { RENAISSANCE_RANK_DEFINITIONS } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	RANK_DECORATION_DRAW_MS,
	RANK_GROUND_OPACITY,
	rankDecoration,
} from './rank-decoration'

const LADDER = RENAISSANCE_RANK_DEFINITIONS.map(rank => rank.id)
const GENERATED = join(
	__dirname,
	'..',
	'..',
	'features',
	'profile',
	'rank-decoration',
	'generated',
)

function generated(slug: string) {
	return JSON.parse(readFileSync(join(GENERATED, `${slug}.json`), 'utf8')) as {
		pieces: Record<string, { w: number; h: number; svg: string }>
		tiles: Record<string, { w: number; h: number; uri: string }>
	}
}

describe('rank decoration (ACH-11)', () => {
	it('decorates nothing without a rank the header shows', () => {
		expect(rankDecoration(null)).toBeNull()
		expect(rankDecoration(undefined)).toBeNull()
		expect(rankDecoration({ id: 'EMPEROR' })).toBeNull()
		// keyed by the stable ID, never by the title
		expect(rankDecoration({ id: 'Laureate' })).toBeNull()
	})

	it('dresses every rank on the ladder in its own pigment, in ladder order', () => {
		const decorations = LADDER.map(id => rankDecoration({ id })!)
		expect(decorations.map(d => d.tier)).toEqual([0, 1, 2, 3, 4, 5])
		for (const d of decorations) {
			const pigment = `var(--rank-${d.rankId.toLowerCase()})`
			expect(d.style).toMatchObject({
				'--rank-pigment': pigment,
				'--corner-bracket': pigment,
			})
			expect(JSON.stringify(d.style)).not.toMatch(
				/honour|success|warning|destructive/,
			)
		}
	})

	it('frames the header as a panel from Artisan up, cut into a neutral ground', () => {
		const framed = LADDER.map(id => rankDecoration({ id })!.framed)
		expect(framed).toEqual([false, false, true, true, true, true])
		const grounds = LADDER.map(
			id =>
				(rankDecoration({ id })!.style as Record<string, string>)['--rank-cut'],
		)
		expect(grounds).toEqual([
			'var(--background)',
			'var(--background)',
			'var(--surface)',
			'var(--surface)',
			'var(--surface-sunk)',
			'var(--surface)',
		])
	})

	it('draws the frame with the rule draw at Initiate and longer up the ladder', () => {
		expect(RANK_DECORATION_DRAW_MS[0]).toBe(240)
		for (let i = 1; i < RANK_DECORATION_DRAW_MS.length; i++)
			expect(RANK_DECORATION_DRAW_MS[i]).toBeGreaterThan(
				RANK_DECORATION_DRAW_MS[i - 1],
			)
		// the whole entrance stays within about 1.3s at the top rank (§24.4)
		expect(RANK_DECORATION_DRAW_MS[5] + 640).toBeLessThanOrEqual(1300)
	})

	it('gives a ground pattern only to the framed ranks, faint in both themes', () => {
		for (const theme of ['day', 'night'] as const) {
			expect(RANK_GROUND_OPACITY[theme].slice(0, 2)).toEqual([0, 0])
			for (const value of RANK_GROUND_OPACITY[theme].slice(2)) {
				expect(value).toBeGreaterThan(0)
				expect(value).toBeLessThanOrEqual(0.3)
			}
		}
	})
})

describe('generated rank decoration assets', () => {
	const slugs = LADDER.map(id => id.toLowerCase())

	it('exist for every rank, each with the portrait ring it shows', () => {
		for (const slug of slugs) expect(generated(slug).pieces.ring).toBeDefined()
	})

	it('draw pieces only in the placeholder colours the stylesheet maps to tokens', () => {
		for (const slug of slugs) {
			for (const [name, piece] of Object.entries(generated(slug).pieces)) {
				const colours = piece.svg.match(/#[0-9a-fA-F]{3,6}\b/g) ?? []
				for (const colour of colours)
					expect(
						['#010101', '#020202', '#030303'],
						`${slug}.${name} uses ${colour}`,
					).toContain(colour)
			}
		}
	})

	it('ship tiles as SVG masks of the size they repeat at', () => {
		for (const slug of slugs) {
			for (const tile of Object.values(generated(slug).tiles)) {
				expect(tile.uri.startsWith('url("data:image/svg+xml,')).toBe(true)
				expect(tile.w).toBeGreaterThan(0)
				expect(tile.h).toBeGreaterThan(0)
			}
		}
	})

	it('give every rank the same amount of ambient motion: two motifs (§24.4)', () => {
		const motifs = (slug: string) => {
			const data = generated(slug)
			const svg = Object.values(data.pieces)
				.map(p => p.svg)
				.join('')
			return {
				turns: /class="spin"/.test(svg),
				breathes: /class="breathe"/.test(svg),
			}
		}
		// Initiate: the compass ring turns, the fleuron breathes.
		expect(motifs('initiate')).toEqual({ turns: true, breathes: true })
		// Laureate: the aureole turns and breathes, the corner flowers turn.
		expect(motifs('laureate')).toEqual({ turns: true, breathes: true })
		// Virtuoso's second motif is its twinkling vault, a tile.
		expect(generated('virtuoso').tiles.twinkleA).toBeDefined()
		expect(generated('virtuoso').tiles.twinkleB).toBeDefined()
		// Apprentice's second motif is its rolling wave band, a tile.
		expect(generated('apprentice').tiles.band).toBeDefined()
		for (const slug of ['apprentice', 'artisan', 'maestro', 'virtuoso'])
			expect(motifs(slug).turns).toBe(true)
	})
})
