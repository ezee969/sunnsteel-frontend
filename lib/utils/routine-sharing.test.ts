import { ROUTINE_VISIBILITY_VALUES } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	describeVisibilityCap,
	effectiveRoutineVisibility,
	ROUTINE_VISIBILITY_COPY,
	ROUTINE_VISIBILITY_OPTIONS,
	routineShareUrl,
} from './routine-sharing'

describe('the narrower of the two rules wins', () => {
	it('lets a routine be as open as the account allows', () => {
		expect(effectiveRoutineVisibility('PUBLIC', 'PUBLIC')).toBe('PUBLIC')
		expect(effectiveRoutineVisibility('PUBLIC', 'FOLLOWERS')).toBe('FOLLOWERS')
	})

	it('never lets a routine widen the account rule', () => {
		expect(effectiveRoutineVisibility('FOLLOWERS', 'PUBLIC')).toBe('FOLLOWERS')
		expect(effectiveRoutineVisibility('PRIVATE', 'PUBLIC')).toBe('PRIVATE')
		expect(effectiveRoutineVisibility('PRIVATE', 'FOLLOWERS')).toBe('PRIVATE')
	})

	it('keeps a private routine private however open the account is', () => {
		expect(effectiveRoutineVisibility('PUBLIC', 'PRIVATE')).toBe('PRIVATE')
	})
})

describe('telling the owner when the account rule is capping them', () => {
	it('says nothing when the routine setting is what applies', () => {
		expect(describeVisibilityCap('PUBLIC', 'PUBLIC')).toBeNull()
		expect(describeVisibilityCap('PUBLIC', 'PRIVATE')).toBeNull()
		expect(describeVisibilityCap('FOLLOWERS', 'FOLLOWERS')).toBeNull()
	})

	it('names who it actually reaches and where to change it', () => {
		const copy = describeVisibilityCap('FOLLOWERS', 'PUBLIC')
		expect(copy).toContain('followers')
		expect(copy).toMatch(/Settings/)
	})

	it('says plainly that nobody else sees it when the account is private', () => {
		expect(describeVisibilityCap('PRIVATE', 'PUBLIC')).toContain('nobody else')
	})
})

describe('share links', () => {
	it('builds the public url without doubling the slash', () => {
		expect(routineShareUrl('https://sunnsteel.app/', 'abc')).toBe(
			'https://sunnsteel.app/shared/routines/abc',
		)
		expect(routineShareUrl('https://sunnsteel.app', 'abc')).toBe(
			'https://sunnsteel.app/shared/routines/abc',
		)
	})
})

describe('visibility copy', () => {
	it('covers every value the contract defines', () => {
		for (const value of ROUTINE_VISIBILITY_VALUES) {
			expect(ROUTINE_VISIBILITY_COPY[value].label).toBeTruthy()
			expect(ROUTINE_VISIBILITY_COPY[value].description).toBeTruthy()
		}
		expect(ROUTINE_VISIBILITY_OPTIONS).toHaveLength(
			ROUTINE_VISIBILITY_VALUES.length,
		)
	})

	it('never promises that a setting hides an existing link', () => {
		// A link ignores visibility; only revoking withdraws it.
		expect(ROUTINE_VISIBILITY_COPY.PRIVATE.description).toMatch(/link/i)
	})
})
