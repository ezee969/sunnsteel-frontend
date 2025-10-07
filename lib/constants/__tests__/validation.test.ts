import { describe, it, expect } from 'vitest'
import { VALIDATION_RULES, VALIDATION_MESSAGES } from '../validation'

describe('Validation Constants', () => {
	describe('VALIDATION_RULES', () => {
		it('should have correct password constraints', () => {
			expect(VALIDATION_RULES.PASSWORD_MIN_LENGTH).toBe(6)
			expect(VALIDATION_RULES.PASSWORD_MAX_LENGTH).toBe(128)
			expect(VALIDATION_RULES.PASSWORD_MIN_LENGTH).toBeLessThan(
				VALIDATION_RULES.PASSWORD_MAX_LENGTH,
			)
		})

		it('should have correct name constraints', () => {
			expect(VALIDATION_RULES.NAME_MIN_LENGTH).toBe(2)
			expect(VALIDATION_RULES.NAME_MAX_LENGTH).toBe(100)
			expect(VALIDATION_RULES.NAME_MIN_LENGTH).toBeLessThan(
				VALIDATION_RULES.NAME_MAX_LENGTH,
			)
		})

		it('should have email regex pattern', () => {
			expect(VALIDATION_RULES.EMAIL_REGEX).toBeInstanceOf(RegExp)
		})

		it('should validate correct email addresses', () => {
			const validEmails = [
				'user@example.com',
				'test.user@domain.co.uk',
				'name+tag@company.org',
				'123@numbers.com',
			]

			validEmails.forEach((email) => {
				expect(VALIDATION_RULES.EMAIL_REGEX.test(email)).toBe(true)
			})
		})

		it('should reject invalid email addresses', () => {
			const invalidEmails = [
				'notanemail',
				'@nodomain.com',
				'user@',
				'user @domain.com',
				'user..name@domain.com',
				'',
			]

			invalidEmails.forEach((email) => {
				expect(VALIDATION_RULES.EMAIL_REGEX.test(email)).toBe(false)
			})
		})
	})

	describe('VALIDATION_MESSAGES', () => {
		it('should have all required password messages', () => {
			expect(VALIDATION_MESSAGES.PASSWORD_TOO_SHORT).toContain('6')
			expect(VALIDATION_MESSAGES.PASSWORD_TOO_LONG).toContain('128')
			expect(VALIDATION_MESSAGES.PASSWORD_REQUIRED).toBeDefined()
		})

		it('should have all required name messages', () => {
			expect(VALIDATION_MESSAGES.NAME_TOO_SHORT).toContain('2')
			expect(VALIDATION_MESSAGES.NAME_TOO_LONG).toContain('100')
			expect(VALIDATION_MESSAGES.NAME_REQUIRED).toBeDefined()
		})

		it('should have all required email messages', () => {
			expect(VALIDATION_MESSAGES.EMAIL_INVALID).toBeDefined()
			expect(VALIDATION_MESSAGES.EMAIL_REQUIRED).toBeDefined()
		})

		it('should have password confirmation message', () => {
			expect(VALIDATION_MESSAGES.PASSWORDS_DONT_MATCH).toBeDefined()
			expect(VALIDATION_MESSAGES.PASSWORDS_DONT_MATCH).toContain('match')
		})

		it('should include constraint values in messages', () => {
			// Password messages should include the actual constraint values
			expect(VALIDATION_MESSAGES.PASSWORD_TOO_SHORT).toContain(
				String(VALIDATION_RULES.PASSWORD_MIN_LENGTH),
			)
			expect(VALIDATION_MESSAGES.PASSWORD_TOO_LONG).toContain(
				String(VALIDATION_RULES.PASSWORD_MAX_LENGTH),
			)

			// Name messages should include the actual constraint values
			expect(VALIDATION_MESSAGES.NAME_TOO_SHORT).toContain(
				String(VALIDATION_RULES.NAME_MIN_LENGTH),
			)
			expect(VALIDATION_MESSAGES.NAME_TOO_LONG).toContain(
				String(VALIDATION_RULES.NAME_MAX_LENGTH),
			)
		})
	})

	describe('Constants immutability', () => {
		it('should be read-only (const assertion)', () => {
			// TypeScript will prevent this at compile time
			// This test verifies runtime behavior
			expect(() => {
				// @ts-expect-error - testing immutability
				VALIDATION_RULES.PASSWORD_MIN_LENGTH = 10
			}).toThrow()
		})
	})

	describe('Integration with schemas', () => {
		it('should provide values suitable for Zod validation', () => {
			// Values should be positive integers suitable for min/max
			expect(VALIDATION_RULES.PASSWORD_MIN_LENGTH).toBeGreaterThan(0)
			expect(VALIDATION_RULES.PASSWORD_MAX_LENGTH).toBeGreaterThan(0)
			expect(VALIDATION_RULES.NAME_MIN_LENGTH).toBeGreaterThan(0)
			expect(VALIDATION_RULES.NAME_MAX_LENGTH).toBeGreaterThan(0)

			// Should be reasonable values
			expect(VALIDATION_RULES.PASSWORD_MIN_LENGTH).toBeGreaterThanOrEqual(6)
			expect(VALIDATION_RULES.PASSWORD_MAX_LENGTH).toBeLessThanOrEqual(256)
			expect(VALIDATION_RULES.NAME_MIN_LENGTH).toBeGreaterThanOrEqual(1)
			expect(VALIDATION_RULES.NAME_MAX_LENGTH).toBeLessThanOrEqual(500)
		})
	})
})
