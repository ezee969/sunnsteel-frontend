import { describe, expect, it } from 'vitest'

import { formatDuration } from './time-format.utils'

describe('formatDuration', () => {
	it.each([
		{ seconds: -1, expected: '0s' },
		{ seconds: 0, expected: '0s' },
		{ seconds: 45, expected: '45s' },
		{ seconds: 120, expected: '2m' },
		{ seconds: 150, expected: '2m 30s' },
		{ seconds: 3600, expected: '1h' },
		{ seconds: 5400, expected: '1h 30m' },
		{ seconds: 79203, expected: '22h 3s' },
	])('formats $seconds seconds as $expected', ({ seconds, expected }) => {
		expect(formatDuration(seconds)).toBe(expected)
	})
})
