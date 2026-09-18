import type { SharedRoutineSummary } from '@sunsteel/contracts'
import { ROUTINE_VISIBILITY_VALUES } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	CLONE_ROUTINE_NOTE,
	CLONE_ROUTINE_PRIVACY_NOTE,
	describeNoFeaturableRoutines,
	describeRoutineSummary,
	describeVisibilityCap,
	effectiveRoutineVisibility,
	parseProfileRoutineId,
	profileRoutineHref,
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

const summary = (
	overrides: Partial<SharedRoutineSummary> = {},
): SharedRoutineSummary => ({
	routineId: 'routine-1',
	name: 'Upper / Lower',
	description: null,
	scheduleMode: 'WEEKLY',
	dayCount: 4,
	exerciseCount: 18,
	updatedAt: '2026-09-17T10:00:00.000Z',
	...overrides,
})

describe('a routine summary line', () => {
	it('states days, exercises and how the routine is scheduled', () => {
		expect(describeRoutineSummary(summary())).toBe(
			'4 days · 18 exercises · Weekly',
		)
	})

	it('reads singular counts as singular, and names a rotation', () => {
		expect(
			describeRoutineSummary(
				summary({ dayCount: 1, exerciseCount: 1, scheduleMode: 'ROTATION' }),
			),
		).toBe('1 day · 1 exercise · Rotation')
	})
})

describe('cloning copy', () => {
	it('says the copy is independent and reaches nobody else', () => {
		expect(CLONE_ROUTINE_NOTE).toMatch(/your own/i)
		expect(CLONE_ROUTINE_NOTE).toMatch(/original is untouched/i)
	})

	it('says a clone starts private, whoever could see the original', () => {
		// Inheriting PUBLIC would republish someone else's programme without
		// anyone choosing to; the copy says so before it is made.
		expect(CLONE_ROUTINE_PRIVACY_NOTE).toMatch(/private/i)
	})
})

describe('a member routine sub-path', () => {
	it('reads only /profile/<identifier>/routines/<routineId>', () => {
		expect(parseProfileRoutineId(['ezequiel', 'routines', 'r-1'])).toBe('r-1')
	})

	it('is not a page for anything else, rather than an alias of the profile', () => {
		expect(parseProfileRoutineId([])).toBeNull()
		expect(parseProfileRoutineId(['ezequiel'])).toBeNull()
		expect(parseProfileRoutineId(['ezequiel', 'followers'])).toBeNull()
		expect(parseProfileRoutineId(['ezequiel', 'routines'])).toBeNull()
		expect(parseProfileRoutineId(['ezequiel', 'routines', ''])).toBeNull()
		expect(
			parseProfileRoutineId(['ezequiel', 'routines', 'r-1', 'edit']),
		).toBeNull()
	})

	it('builds the href it parses, escaping both parts', () => {
		const href = profileRoutineHref('a b', 'r/1')
		expect(href).toBe('/profile/a%20b/routines/r%2F1')
	})
})

describe('why no routine can be featured', () => {
	it('names the account rule first, because it outranks every routine', () => {
		// Saying "no routine is shared yet" here would send the owner to change a
		// per-routine setting that the account rule would go on capping.
		const copy = describeNoFeaturableRoutines('PRIVATE', {
			routines: 3,
			shareable: 0,
		})
		expect(copy).toMatch(/keeps routines private/i)
		expect(copy).toMatch(/Settings/)
		expect(copy).not.toMatch(/No routine is shared yet/)
	})

	it('otherwise says which of the three things is actually missing', () => {
		expect(
			describeNoFeaturableRoutines('PUBLIC', { routines: 0, shareable: 0 }),
		).toMatch(/Create a routine/)
		expect(
			describeNoFeaturableRoutines('PUBLIC', { routines: 2, shareable: 0 }),
		).toMatch(/No routine is shared yet/)
		expect(
			describeNoFeaturableRoutines('FOLLOWERS', { routines: 2, shareable: 2 }),
		).toMatch(/already featured/)
	})
})
