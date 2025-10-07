import { describe, it, expect } from 'vitest'
import {
	getFriendlyErrorMessage,
	getErrorMessage,
	getFullErrorMessage,
} from '../error-messages'

describe('Error Message Utilities', () => {
	describe('getFriendlyErrorMessage', () => {
		it('should map "user already registered" error', () => {
			const result = getFriendlyErrorMessage('User already registered')
			expect(result.message).toBe('This email is already registered')
			expect(result.guidance).toContain('try logging in')
		})

		it('should map "email already registered" error', () => {
			const result = getFriendlyErrorMessage('email already registered')
			expect(result.message).toBe('This email is already registered')
		})

		it('should map invalid email errors', () => {
			const result = getFriendlyErrorMessage('Invalid email format')
			expect(result.message).toBe('Invalid email address')
			expect(result.guidance).toContain('valid email address')
		})

		it('should map weak password errors', () => {
			const result = getFriendlyErrorMessage(
				'Password should be at least 6 characters',
			)
			expect(result.message).toBe('Password is too weak')
			expect(result.guidance).toContain('at least 6 characters')
		})

		it('should map rate limit errors', () => {
			const result = getFriendlyErrorMessage('Rate limit exceeded')
			expect(result.message).toBe('Too many attempts')
			expect(result.guidance).toContain('wait a few minutes')
		})

		it('should map email not verified errors', () => {
			const result = getFriendlyErrorMessage('Email not confirmed')
			expect(result.message).toBe('Email not verified')
			expect(result.guidance).toContain('verification link')
		})

		it('should map invalid credentials errors', () => {
			const result = getFriendlyErrorMessage('Invalid login credentials')
			expect(result.message).toBe('Incorrect email or password')
			expect(result.guidance).toContain('case-sensitive')
		})

		it('should map network errors', () => {
			const result = getFriendlyErrorMessage('Failed to fetch')
			expect(result.message).toBe('Connection error')
			expect(result.guidance).toContain('internet connection')
		})

		it('should map session expired errors', () => {
			const result = getFriendlyErrorMessage('JWT expired')
			expect(result.message).toBe('Session expired')
			expect(result.guidance).toContain('log in again')
		})

		it('should handle null/undefined errors', () => {
			const result1 = getFriendlyErrorMessage(null)
			expect(result1.message).toBe('An unexpected error occurred')

			const result2 = getFriendlyErrorMessage(undefined)
			expect(result2.message).toBe('An unexpected error occurred')
		})

		it('should sanitize technical errors', () => {
			const technicalError =
				'Database error: 550e8400-e29b-41d4-a716-446655440000 at Object.execute (db.ts:42)'
			const result = getFriendlyErrorMessage(technicalError)

			// Should remove UUIDs and stack traces
			expect(result.message).not.toContain('550e8400')
			expect(result.message).not.toContain('at Object.execute')
		})

		it('should handle unknown errors gracefully', () => {
			const unknownError = 'Some completely unknown error message'
			const result = getFriendlyErrorMessage(unknownError)

			expect(result.message).toBeDefined()
			expect(result.message.length).toBeGreaterThan(0)
			expect(result.guidance).toContain('contact support')
		})
	})

	describe('getErrorMessage', () => {
		it('should return only the message without guidance', () => {
			const message = getErrorMessage('User already registered')
			expect(message).toBe('This email is already registered')
			expect(message).not.toContain('try logging in')
		})

		it('should handle null errors', () => {
			const message = getErrorMessage(null)
			expect(message).toBe('An unexpected error occurred')
		})
	})

	describe('getFullErrorMessage', () => {
		it('should combine message and guidance', () => {
			const fullMessage = getFullErrorMessage('User already registered')
			expect(fullMessage).toContain('This email is already registered')
			expect(fullMessage).toContain('try logging in')
		})

		it('should handle errors without guidance', () => {
			const fullMessage = getFullErrorMessage('Unknown error')
			expect(fullMessage).toBeDefined()
			expect(fullMessage.length).toBeGreaterThan(0)
		})

		it('should handle null errors', () => {
			const fullMessage = getFullErrorMessage(null)
			expect(fullMessage).toContain('An unexpected error occurred')
		})
	})

	describe('Case insensitivity', () => {
		it('should match errors regardless of case', () => {
			const lower = getFriendlyErrorMessage('user already registered')
			const upper = getFriendlyErrorMessage('USER ALREADY REGISTERED')
			const mixed = getFriendlyErrorMessage('UsEr AlReAdY ReGiStErEd')

			expect(lower.message).toBe(upper.message)
			expect(lower.message).toBe(mixed.message)
		})
	})

	describe('Pattern matching', () => {
		it('should match partial patterns', () => {
			const result1 = getFriendlyErrorMessage(
				'Error: email already registered in system',
			)
			expect(result1.message).toBe('This email is already registered')

			const result2 = getFriendlyErrorMessage(
				'Authentication failed due to invalid credentials',
			)
			expect(result2.message).toBe('Incorrect email or password')
		})

		it('should prioritize first matching pattern', () => {
			const result = getFriendlyErrorMessage('Invalid email format')
			// Should match "invalid email" before any other patterns
			expect(result.message).toBe('Invalid email address')
		})
	})

	describe('Real-world Supabase errors', () => {
		it('should handle Supabase duplicate email error', () => {
			const supabaseError =
				'duplicate key value violates unique constraint "users_email_key"'
			const result = getFriendlyErrorMessage(supabaseError)

			// Should have some friendly message (either email duplicate or generic)
			expect(result.message).toBeDefined()
			expect(result.message.length).toBeGreaterThan(0)
		})

		it('should handle Supabase auth error', () => {
			const supabaseError = 'Invalid login credentials'
			const result = getFriendlyErrorMessage(supabaseError)

			expect(result.message).toBe('Incorrect email or password')
		})
	})
})
