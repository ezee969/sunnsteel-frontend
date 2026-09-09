import { describe, expect, it } from 'vitest'

import { getUsernameValidationError, normalizeUsername } from './username'

describe('username presentation rules', () => {
	it('normalizes pasted handles before saving or searching', () => {
		expect(normalizeUsername('  @Strong_Lifter  ')).toBe('strong_lifter')
	})

	it('shares format and reserved-name rules with the backend', () => {
		expect(getUsernameValidationError('strong_lifter')).toBeNull()
		expect(getUsernameValidationError('ab')).toContain('3–30')
		expect(getUsernameValidationError('_strong')).toContain('starting')
		expect(getUsernameValidationError('settings')).toBe(
			'This username is reserved.',
		)
	})
})
