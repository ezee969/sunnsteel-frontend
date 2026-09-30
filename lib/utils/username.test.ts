import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import { getUsernameValidationError, normalizeUsername } from './username'

const t = translatorFor('en', 'settings.username')
const tEs = translatorFor('es', 'settings.username')

describe('username presentation rules', () => {
	it('normalizes pasted handles before saving or searching', () => {
		expect(normalizeUsername('  @Strong_Lifter  ')).toBe('strong_lifter')
	})

	it('shares format and reserved-name rules with the backend', () => {
		expect(getUsernameValidationError('strong_lifter', t)).toBeNull()
		expect(getUsernameValidationError('ab', t)).toContain('3–30')
		expect(getUsernameValidationError('_strong', t)).toContain('starting')
		expect(getUsernameValidationError('settings', t)).toBe(
			'This username is reserved.',
		)
	})

	it('says the same in Spanish', () => {
		expect(getUsernameValidationError('strong_lifter', tEs)).toBeNull()
		expect(getUsernameValidationError('ab', tEs)).toContain('de 3 a 30')
		expect(getUsernameValidationError('_strong', tEs)).toContain('empezando')
		expect(getUsernameValidationError('settings', tEs)).toBe(
			'Este nombre de usuario está reservado.',
		)
	})
})
