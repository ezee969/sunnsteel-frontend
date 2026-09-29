import type { DiscoverableRoutine } from '@sunsteel/contracts'
import { ROUTINE_DURATION_BANDS } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'
import { buildDiscoveryParams } from '@/lib/api/services/routineDiscoveryService'

import {
	describeClassification,
	describeDiscoveredAuthor,
	describeDiscoveredRoutine,
	discoveryScopeNote,
	durationBandLabel,
	durationEstimateNote,
	hasActiveFilters,
} from './routine-discovery'

const en = translatorFor('en', 'routines.discovery')
const es = translatorFor('es', 'routines.discovery')
const enId = translatorFor('en', 'routines.identity')
const esId = translatorFor('es', 'routines.identity')

const routine = (
	overrides: Partial<DiscoverableRoutine> = {},
): DiscoverableRoutine => ({
	routineId: 'routine-1',
	name: 'Upper / Lower',
	description: null,
	scheduleMode: 'WEEKLY',
	goal: 'STRENGTH',
	experienceLevel: 'INTERMEDIATE',
	dayCount: 4,
	exerciseCount: 20,
	muscles: ['PECTORAL'],
	equipment: ['barbell'],
	longestDayMinutes: 62,
	author: {
		username: 'ada',
		name: 'Ada',
		lastName: 'Lovelace',
		avatarUrl: null,
	},
	updatedAt: '2026-09-19T10:00:00.000Z',
	...overrides,
})

describe('discovery scope copy', () => {
	it('says browsing reveals nothing that was private', () => {
		// Discovery is not a visibility tier; the page has to say so, or a
		// member could reasonably assume sharing now means "listed publicly".
		expect(discoveryScopeNote(en)).toMatch(/chose to share/i)
		expect(discoveryScopeNote(en)).toMatch(
			/does not reveal anything that was private/i,
		)
	})

	it('labels the session length an estimate, never a measurement', () => {
		expect(durationEstimateNote(en)).toMatch(/estimated/i)
		expect(durationEstimateNote(en)).toMatch(/not measured/i)
	})

	it('labels every duration band the contract defines', () => {
		for (const band of ROUTINE_DURATION_BANDS) {
			expect(durationBandLabel(band, en)).toBeTruthy()
			expect(durationBandLabel(band, es)).toBeTruthy()
		}
	})
})

describe('discovery copy in Spanish (I18N-03)', () => {
	it('keeps the scope and estimate rules', () => {
		expect(discoveryScopeNote(es)).toMatch(/decidieron compartir/i)
		expect(discoveryScopeNote(es)).toMatch(/no revela nada que fuera privado/i)
		expect(durationEstimateNote(es)).toMatch(/se estima/i)
		expect(durationEstimateNote(es)).toMatch(/no se mide/i)
	})

	it('words the facts and claims in Spanish', () => {
		expect(describeDiscoveredRoutine(routine(), es)).toBe(
			'4 días · 20 ejercicios · Semanal · ~62 min',
		)
		expect(
			describeDiscoveredRoutine(
				routine({ dayCount: 1, exerciseCount: 1, scheduleMode: 'ROTATION' }),
				es,
			),
		).toBe('1 día · 1 ejercicio · Rotación · ~62 min')
		expect(describeClassification(routine(), esId)).toBe('Fuerza · Intermedio')
	})
})

describe('describing a discovered routine', () => {
	it('states days, exercises, mode and the estimate as approximate', () => {
		expect(describeDiscoveredRoutine(routine(), en)).toBe(
			'4 days · 20 exercises · Weekly · ~62 min',
		)
	})

	it('reads singular counts as singular and names a rotation', () => {
		expect(
			describeDiscoveredRoutine(
				routine({ dayCount: 1, exerciseCount: 1, scheduleMode: 'ROTATION' }),
				en,
			),
		).toBe('1 day · 1 exercise · Rotation · ~62 min')
	})

	it('prefers a real name and falls back to the handle', () => {
		expect(describeDiscoveredAuthor(routine())).toBe('Ada Lovelace')
		expect(
			describeDiscoveredAuthor(
				routine({
					author: {
						username: 'ada',
						name: '',
						lastName: null,
						avatarUrl: null,
					},
				}),
			),
		).toBe('@ada')
	})
})

describe('declared classification', () => {
	it('shows what was declared', () => {
		expect(describeClassification(routine(), enId)).toMatch(/Strength/i)
		expect(describeClassification(routine(), enId)).toMatch(/Intermediate/i)
	})

	it('returns nothing rather than inventing "not specified"', () => {
		// An undeclared goal is unknown. A routine is not worse for making no
		// claim, so the row simply omits the line.
		expect(
			describeClassification({ goal: null, experienceLevel: null }, enId),
		).toBeNull()
		expect(describeClassification({}, enId)).toBeNull()
	})

	it('shows one claim when only one was made', () => {
		expect(
			describeClassification({ goal: 'FAT_LOSS', experienceLevel: null }, enId),
		).toMatch(/Fat/i)
	})
})

describe('the discovery query string', () => {
	it('omits every filter that was left unset', () => {
		expect(buildDiscoveryParams({})).toBe('')
		expect(buildDiscoveryParams({ q: '   ' })).toBe('')
	})

	it('repeats equipment rather than joining it', () => {
		// The server reads a repeated parameter; a comma-joined one would
		// arrive as a single nonexistent equipment value.
		expect(buildDiscoveryParams({ equipment: ['barbell', 'bench'] })).toBe(
			'?equipment=barbell&equipment=bench',
		)
	})

	it('serializes the rest of the filters', () => {
		const params = buildDiscoveryParams({
			q: 'upper',
			goal: 'STRENGTH',
			experienceLevel: 'BEGINNER',
			days: 4,
			muscle: 'PECTORAL',
			duration: 'MEDIUM',
			limit: 10,
			cursor: 'abc',
		})
		expect(params).toContain('q=upper')
		expect(params).toContain('goal=STRENGTH')
		expect(params).toContain('experienceLevel=BEGINNER')
		expect(params).toContain('days=4')
		expect(params).toContain('muscle=PECTORAL')
		expect(params).toContain('duration=MEDIUM')
		expect(params).toContain('limit=10')
		expect(params).toContain('cursor=abc')
	})
})

describe('whether the viewer narrowed anything', () => {
	it('is false for an untouched page and true for any single filter', () => {
		expect(hasActiveFilters({})).toBe(false)
		expect(hasActiveFilters({ q: '  ' })).toBe(false)
		expect(hasActiveFilters({ q: 'push' })).toBe(true)
		expect(hasActiveFilters({ days: 3 })).toBe(true)
		expect(hasActiveFilters({ equipment: [] })).toBe(false)
		expect(hasActiveFilters({ equipment: ['barbell'] })).toBe(true)
		expect(hasActiveFilters({ duration: 'SHORT' })).toBe(true)
	})
})
