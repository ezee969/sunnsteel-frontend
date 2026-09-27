import { describe, expect, it } from 'vitest'

import {
	collapseStorageKey,
	parseStoredOpen,
	resolveOpen,
	serializeOpen,
	showMoreLabel,
	visibleRows,
} from './long-content'

describe('collapsible sections (UX-01)', () => {
	it('stores a choice per section under its own key', () => {
		expect(collapseStorageKey('progress-plateaus')).toBe(
			'ss-open:progress-plateaus',
		)
	})

	it('round-trips a stored choice and ignores anything else', () => {
		expect(parseStoredOpen(serializeOpen(true))).toBe(true)
		expect(parseStoredOpen(serializeOpen(false))).toBe(false)
		expect(parseStoredOpen(null)).toBeNull()
		expect(parseStoredOpen('true')).toBeNull()
		expect(parseStoredOpen('')).toBeNull()
	})

	it("keeps the member's choice over the default", () => {
		expect(resolveOpen(false, true, true)).toBe(false)
		expect(resolveOpen(true, false, false)).toBe(true)
		expect(resolveOpen(true, 'wide', false)).toBe(true)
	})

	it('opens a wide-default section only from md', () => {
		expect(resolveOpen(null, 'wide', true)).toBe(true)
		expect(resolveOpen(null, 'wide', false)).toBe(false)
		expect(resolveOpen(null, true, false)).toBe(true)
		expect(resolveOpen(null, false, true)).toBe(false)
	})
})

describe('bounded lists (UX-01)', () => {
	const rows = ['a', 'b', 'c', 'd', 'e']

	it('shows the first rows until expanded', () => {
		expect(visibleRows(rows, 3, false)).toEqual(['a', 'b', 'c'])
		expect(visibleRows(rows, 3, true)).toEqual(rows)
		expect(visibleRows(rows, 5, false)).toEqual(rows)
	})

	it('names how many rows the control reveals', () => {
		expect(showMoreLabel(5, 3, false)).toBe('Show 2 more')
		expect(showMoreLabel(5, 3, true)).toBe('Show fewer')
	})

	it('offers nothing when every row fits', () => {
		expect(showMoreLabel(3, 3, false)).toBeNull()
		expect(showMoreLabel(0, 3, true)).toBeNull()
	})
})
