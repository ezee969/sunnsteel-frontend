import { describe, expect, it } from 'vitest'

import { linksAfterReorder, withLinks } from './exercise-links'

const make = (...links: boolean[]) =>
	links.map((linkedToNext, index) => ({
		id: String.fromCharCode(65 + index),
		linkedToNext,
	}))

describe('links after a reorder or removal (ROUT-12)', () => {
	it('keeps a link while its pair stays side by side', () => {
		const [a, b, c, d] = make(true, false, false, false)
		expect(linksAfterReorder([a, b, c, d], [c, a, b, d])).toEqual([
			false,
			true,
			false,
			false,
		])
	})

	it('drops a link when its pair is split', () => {
		const [a, b, c] = make(true, false, false)
		expect(linksAfterReorder([a, b, c], [a, c, b])).toEqual([
			false,
			false,
			false,
		])
	})

	it('keeps the rest of a group when its middle member moves away', () => {
		const [a, b, c, d] = make(true, true, false, false)
		// A–B–C, B dragged to the end: A stays linked to C, B stands alone.
		expect(linksAfterReorder([a, b, c, d], [a, c, d, b])).toEqual([
			true,
			false,
			false,
			false,
		])
	})

	it('drops the link to a group last member when it is removed', () => {
		const [a, b, c] = make(true, false, false)
		expect(linksAfterReorder([a, b, c], [a, c])).toEqual([false, false])
	})

	it('bridges a removed middle member', () => {
		const [a, b, c] = make(true, true, false)
		expect(linksAfterReorder([a, b, c], [a, c])).toEqual([true, false])
	})

	it('never links the day last exercise', () => {
		const [a, b] = make(true, false)
		expect(linksAfterReorder([a, b], [b, a])).toEqual([false, false])
	})

	it('copies only the exercises whose link changed', () => {
		const exercises = make(true, false)
		const next = withLinks(exercises, [true, false])
		expect(next[0]).toBe(exercises[0])
		expect(withLinks(exercises, [false, false])[0]).toEqual({
			id: 'A',
			linkedToNext: false,
		})
	})
})
