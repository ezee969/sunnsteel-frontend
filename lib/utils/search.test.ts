import type { Exercise, Routine } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { exerciseLabel } from '@/i18n/catalog'
import { translatorFor } from '@/i18n/translator'

import { activeTabHref } from './page-tabs'
import {
	matchExercises,
	matchOwnRoutines,
	memberHref,
	parseSearchView,
	searchHref,
	searchTabs,
	sharedRoutineHref,
	workoutHref,
} from './search'

const exercise = (
	name: string,
	overrides: Partial<Exercise> = {},
): Exercise => ({
	id: name.toLowerCase().replace(/\W+/g, '-'),
	name,
	primaryMuscles: ['PECTORAL'],
	secondaryMuscles: [],
	equipment: 'Barbell',
	equipmentRequired: ['barbell'],
	movementPattern: null,
	mechanic: null,
	substitutionGroup: null,
	instructions: [],
	mediaUrl: null,
	createdAt: '2026-09-13T00:00:00.000Z',
	updatedAt: '2026-09-13T00:00:00.000Z',
	...overrides,
})

const routine = (name: string, overrides: Partial<Routine> = {}): Routine =>
	({
		id: name,
		userId: 'me',
		name,
		description: null,
		isPeriodized: false,
		isFavorite: false,
		isCompleted: false,
		scheduleMode: 'WEEKLY',
		days: [],
		createdAt: '2026-10-01T00:00:00.000Z',
		updatedAt: '2026-10-01T00:00:00.000Z',
		...overrides,
	}) as Routine

const esLabel = (name: string) =>
	exerciseLabel(name, translatorFor('es', 'catalog.exercises'))
const enLabel = (name: string) =>
	exerciseLabel(name, translatorFor('en', 'catalog.exercises'))

describe('NAV-01 search views and links', () => {
	it('reads the view from `type`, All for anything else', () => {
		expect(parseSearchView('members')).toBe('members')
		expect(parseSearchView('workouts')).toBe('workouts')
		expect(parseSearchView(null)).toBe('all')
		expect(parseSearchView('admin')).toBe('all')
	})

	it('keeps the query in every tab and marks the most specific one current', () => {
		const tabs = searchTabs('leg day & more', view => view)
		expect(tabs.map(tab => tab.href)).toEqual([
			'/search?q=leg+day+%26+more',
			'/search?q=leg+day+%26+more&type=members',
			'/search?q=leg+day+%26+more&type=exercises',
			'/search?q=leg+day+%26+more&type=routines',
			'/search?q=leg+day+%26+more&type=workouts',
		])
		expect(
			activeTabHref(tabs, '/search', '?q=leg+day+%26+more&type=routines'),
		).toBe(searchHref('leg day & more', 'routines'))
		expect(activeTabHref(tabs, '/search', '?q=leg+day+%26+more')).toBe(
			searchHref('leg day & more'),
		)
	})

	it('opens a member, their shared routine, and a workout where each lives', () => {
		expect(memberHref('ana.b')).toBe('/profile/ana.b')
		expect(sharedRoutineHref('ana', 'r1')).toBe('/profile/ana/routines/r1')
		expect(workoutHref({ id: 's1', status: 'COMPLETED' })).toBe(
			'/workouts/history/s1',
		)
		expect(workoutHref({ id: 's1', status: 'ABORTED' })).toBe(
			'/workouts/history/s1',
		)
		expect(workoutHref({ id: 's1', status: 'IN_PROGRESS' })).toBe(
			'/workouts/sessions/s1',
		)
	})
})

describe('NAV-01 exercises are matched in both languages', () => {
	const catalog = [
		exercise('Incline Bench Press'),
		exercise('Bench Press'),
		exercise('Squat'),
		exercise('Cable Fly'),
	]

	it('finds a catalog exercise by its Spanish name or its stored English one', () => {
		expect(matchExercises(catalog, 'banca', esLabel).map(e => e.name)).toEqual([
			'Bench Press',
			'Incline Bench Press',
		])
		expect(matchExercises(catalog, 'bench', esLabel).map(e => e.name)).toEqual([
			'Bench Press',
			'Incline Bench Press',
		])
		expect(matchExercises(catalog, 'SENTADILLA', esLabel)).toHaveLength(1)
	})

	it('puts a name that starts with the query before one that only contains it', () => {
		expect(matchExercises(catalog, 'press', enLabel).map(e => e.name)).toEqual([
			'Bench Press',
			'Incline Bench Press',
		])
		expect(
			matchExercises(catalog, 'press de', esLabel).map(e => e.name),
		).toEqual(['Bench Press', 'Incline Bench Press'])
	})

	it("finds the member's own exercises, archived ones too", () => {
		const own = [
			...catalog,
			exercise('Landmine Press', {
				isCustom: true,
				archivedAt: '2026-09-30T00:00:00.000Z',
			}),
		]
		expect(matchExercises(own, 'landmine', enLabel)).toHaveLength(1)
	})

	it('finds nothing for a query under two characters', () => {
		expect(matchExercises(catalog, ' b ', enLabel)).toEqual([])
	})
})

describe("NAV-01 the member's own routines", () => {
	const routines = [
		routine('Old Upper', { isCompleted: true }),
		routine('Push Pull Legs', { description: 'Upper body twice a week' }),
		routine('Upper / Lower'),
		routine('Full Body'),
	]

	it('match by name or description, ignoring case and accents', () => {
		expect(matchOwnRoutines(routines, 'UPPER').map(r => r.name)).toEqual([
			'Upper / Lower',
			'Push Pull Legs',
			'Old Upper',
		])
		expect(
			matchOwnRoutines([routine('Pierna pesada')], 'PIÉRNA').map(r => r.name),
		).toEqual(['Pierna pesada'])
	})

	it('list routines in use before archived ones', () => {
		const names = matchOwnRoutines(routines, 'upper').map(r => r.name)
		expect(names[names.length - 1]).toBe('Old Upper')
	})

	it('find nothing for a query under two characters', () => {
		expect(matchOwnRoutines(routines, 'u')).toEqual([])
	})
})
