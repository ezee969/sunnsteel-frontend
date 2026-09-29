import type { SharedRoutineSummary } from '@sunsteel/contracts'
import { ROUTINE_VISIBILITY_VALUES } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	cloneRoutineNote,
	cloneRoutinePrivacyNote,
	describeNoFeaturableRoutines,
	describeRoutineSummary,
	describeVisibilityCap,
	effectiveRoutineVisibility,
	parseProfileRoutineId,
	profileRoutineHref,
	routineShareUrl,
	routineVisibilityCopy,
	routineVisibilityOptions,
} from './routine-sharing'

const en = translatorFor('en', 'routines.sharing')
const es = translatorFor('es', 'routines.sharing')

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
		expect(describeVisibilityCap('PUBLIC', 'PUBLIC', en)).toBeNull()
		expect(describeVisibilityCap('PUBLIC', 'PRIVATE', en)).toBeNull()
		expect(describeVisibilityCap('FOLLOWERS', 'FOLLOWERS', en)).toBeNull()
	})

	it('names who it actually reaches', () => {
		const copy = describeVisibilityCap('FOLLOWERS', 'PUBLIC', en)
		expect(copy).toContain('followers')
		// Where to change it is a link beside the sentence (UX-08).
		expect(copy).not.toMatch(/Settings/)
	})

	it('says the same in Spanish, and still sends nobody to Settings', () => {
		const copy = describeVisibilityCap('FOLLOWERS', 'PUBLIC', es)
		expect(copy).toContain('seguidores')
		expect(copy).not.toMatch(/Ajustes/)
		expect(describeVisibilityCap('PRIVATE', 'PUBLIC', es)).toContain(
			'nadie más',
		)
	})

	it('says plainly that nobody else sees it when the account is private', () => {
		expect(describeVisibilityCap('PRIVATE', 'PUBLIC', en)).toContain(
			'nobody else',
		)
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
		for (const t of [en, es]) {
			for (const value of ROUTINE_VISIBILITY_VALUES) {
				expect(routineVisibilityCopy(value, t).label).toBeTruthy()
				expect(routineVisibilityCopy(value, t).description).toBeTruthy()
			}
			expect(routineVisibilityOptions(t)).toHaveLength(
				ROUTINE_VISIBILITY_VALUES.length,
			)
		}
	})

	it('never promises that a setting hides an existing link', () => {
		// A link ignores visibility; only revoking withdraws it.
		expect(routineVisibilityCopy('PRIVATE', en).description).toMatch(/link/i)
		expect(routineVisibilityCopy('PRIVATE', es).description).toMatch(/enlace/i)
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
		expect(describeRoutineSummary(summary(), en)).toBe(
			'4 days · 18 exercises · Weekly',
		)
		expect(describeRoutineSummary(summary(), es)).toBe(
			'4 días · 18 ejercicios · Semanal',
		)
	})

	it('reads singular counts as singular, and names a rotation', () => {
		expect(
			describeRoutineSummary(
				summary({ dayCount: 1, exerciseCount: 1, scheduleMode: 'ROTATION' }),
				en,
			),
		).toBe('1 day · 1 exercise · Rotation')
		expect(
			describeRoutineSummary(
				summary({ dayCount: 1, exerciseCount: 1, scheduleMode: 'ROTATION' }),
				es,
			),
		).toBe('1 día · 1 ejercicio · Rotación')
	})
})

describe('cloning copy', () => {
	it('says the copy is independent and reaches nobody else', () => {
		expect(cloneRoutineNote(en)).toMatch(/your own/i)
		expect(cloneRoutineNote(en)).toMatch(/original is untouched/i)
		expect(cloneRoutineNote(es)).toMatch(/una rutina tuya/i)
		expect(cloneRoutineNote(es)).toMatch(/original queda intacta/i)
	})

	it('says a clone starts private, whoever could see the original', () => {
		// Inheriting PUBLIC would republish someone else's programme without
		// anyone choosing to; the copy says so before it is made.
		expect(cloneRoutinePrivacyNote(en)).toMatch(/private/i)
		expect(cloneRoutinePrivacyNote(es)).toMatch(/privada/i)
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
		const copy = describeNoFeaturableRoutines(
			'PRIVATE',
			{
				routines: 3,
				shareable: 0,
			},
			en,
		)
		expect(copy).toMatch(/keeps routines private/i)
		expect(copy).toMatch(/Settings/)
		expect(copy).not.toMatch(/No routine is shared yet/)
	})

	it('otherwise says which of the three things is actually missing', () => {
		expect(
			describeNoFeaturableRoutines('PUBLIC', { routines: 0, shareable: 0 }, en),
		).toMatch(/Create a routine/)
		expect(
			describeNoFeaturableRoutines('PUBLIC', { routines: 2, shareable: 0 }, en),
		).toMatch(/No routine is shared yet/)
		expect(
			describeNoFeaturableRoutines(
				'FOLLOWERS',
				{ routines: 2, shareable: 2 },
				en,
			),
		).toMatch(/already featured/)
	})
})
