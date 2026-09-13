import { describe, expect, it } from 'vitest'

import {
	forgotPasswordSchema,
	resetPasswordSchema,
} from '@/schema/password-reset-schema'

import {
	buildPasswordResetRedirect,
	callbackWithoutSessionRedirect,
	isPasswordRecoveryCallback,
} from './password-reset'

describe('password reset redirects', () => {
	it('returns through the existing auth callback to the reset page', () => {
		expect(buildPasswordResetRedirect('https://sunnsteel.app')).toBe(
			'https://sunnsteel.app/auth/callback?callbackUrl=%2Freset-password',
		)
	})

	it('recognises only a reset-page callback as a recovery', () => {
		expect(isPasswordRecoveryCallback('/reset-password')).toBe(true)
		expect(isPasswordRecoveryCallback('/reset-password?x=1')).toBe(true)
		expect(isPasswordRecoveryCallback('/dashboard')).toBe(false)
		expect(isPasswordRecoveryCallback(null)).toBe(false)
		expect(isPasswordRecoveryCallback('//evil.example/reset-password')).toBe(
			false,
		)
	})

	it('sends an unusable recovery link back to the request form', () => {
		expect(callbackWithoutSessionRedirect('/reset-password')).toBe(
			'/forgot-password?link=expired',
		)
		expect(callbackWithoutSessionRedirect('/routines')).toBe(
			'/login?error=no_session',
		)
	})
})

describe('password reset forms', () => {
	it('requires a valid email to request a link', () => {
		expect(forgotPasswordSchema.safeParse({ email: 'a@b.co' }).success).toBe(
			true,
		)
		expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(
			false,
		)
	})

	it('requires a long-enough password typed twice', () => {
		expect(
			resetPasswordSchema.safeParse({
				password: 'secret1',
				confirmPassword: 'secret1',
			}).success,
		).toBe(true)
		const mismatch = resetPasswordSchema.safeParse({
			password: 'secret1',
			confirmPassword: 'secret2',
		})
		expect(mismatch.success).toBe(false)
		expect(mismatch.error?.issues[0].path).toEqual(['confirmPassword'])
		expect(
			resetPasswordSchema.safeParse({ password: '123', confirmPassword: '123' })
				.success,
		).toBe(false)
	})
})
