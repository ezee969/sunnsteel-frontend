import { describe, expect, it } from 'vitest'

import { usesAdvancedOptions } from './advanced-options'

const set = (overrides: Record<string, unknown> = {}) =>
	({
		setNumber: 1,
		repType: 'FIXED',
		reps: 8,
		weight: 60,
		rir: 2,
		kind: 'WORKING',
		...overrides,
	}) as never

describe('usesAdvancedOptions (UX-20)', () => {
	it('is false for working sets alone, whatever their RIR', () => {
		expect(usesAdvancedOptions({ sets: [set(), set({ rir: 0 })] })).toBe(false)
	})

	it('is false for a set with no kind, which is a working set', () => {
		expect(usesAdvancedOptions({ sets: [set({ kind: undefined })] })).toBe(
			false,
		)
	})

	it.each(['WARMUP', 'DROP', 'OPTIONAL'])('is true with a %s set', kind => {
		expect(usesAdvancedOptions({ sets: [set(), set({ kind })] })).toBe(true)
	})

	it('is true for a generated warm-up share', () => {
		expect(usesAdvancedOptions({ sets: [set({ warmUpShare: 0.4 })] })).toBe(
			true,
		)
	})

	it('is true when the exercise is linked to the next one', () => {
		expect(usesAdvancedOptions({ sets: [set()], linkedToNext: true })).toBe(
			true,
		)
	})
})
