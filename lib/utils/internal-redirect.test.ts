import { describe, expect, it } from 'vitest'

import {
	DEFAULT_AUTH_REDIRECT,
	sanitizeInternalRedirect,
} from './internal-redirect'

describe('sanitizeInternalRedirect', () => {
	it('preserves valid app paths, query strings and hashes', () => {
		expect(sanitizeInternalRedirect('/routines')).toBe('/routines')
		expect(
			sanitizeInternalRedirect('/workouts/history?status=COMPLETED#latest'),
		).toBe('/workouts/history?status=COMPLETED#latest')
	})

	it('uses the dashboard when no redirect was supplied', () => {
		expect(sanitizeInternalRedirect(undefined)).toBe(DEFAULT_AUTH_REDIRECT)
		expect(sanitizeInternalRedirect(null)).toBe(DEFAULT_AUTH_REDIRECT)
		expect(sanitizeInternalRedirect('')).toBe(DEFAULT_AUTH_REDIRECT)
	})

	it('rejects absolute and protocol-relative URLs', () => {
		expect(sanitizeInternalRedirect('https://evil.example')).toBe(
			DEFAULT_AUTH_REDIRECT,
		)
		expect(sanitizeInternalRedirect('//evil.example')).toBe(
			DEFAULT_AUTH_REDIRECT,
		)
		expect(sanitizeInternalRedirect('///evil.example')).toBe(
			DEFAULT_AUTH_REDIRECT,
		)
	})

	it('rejects backslash and encoded-separator URL variants', () => {
		expect(sanitizeInternalRedirect('/\\evil.example')).toBe(
			DEFAULT_AUTH_REDIRECT,
		)
		expect(sanitizeInternalRedirect('/%5Cevil.example')).toBe(
			DEFAULT_AUTH_REDIRECT,
		)
		expect(sanitizeInternalRedirect('/%2F%2Fevil.example')).toBe(
			DEFAULT_AUTH_REDIRECT,
		)
	})

	it('rejects whitespace-wrapped paths', () => {
		expect(sanitizeInternalRedirect(' /routines')).toBe(DEFAULT_AUTH_REDIRECT)
		expect(sanitizeInternalRedirect('/routines ')).toBe(DEFAULT_AUTH_REDIRECT)
	})

	it('rejects auth entry routes that would create redirect loops', () => {
		expect(sanitizeInternalRedirect('/login')).toBe(DEFAULT_AUTH_REDIRECT)
		expect(sanitizeInternalRedirect('/signup?source=login')).toBe(
			DEFAULT_AUTH_REDIRECT,
		)
		expect(sanitizeInternalRedirect('/auth/callback/nested')).toBe(
			DEFAULT_AUTH_REDIRECT,
		)
	})
})
