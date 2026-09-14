import type { Exercise } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	catalogFilterOptions,
	EMPTY_CATALOG_FILTERS,
	filterCatalog,
	fitsListedEquipment,
	formatCatalogCount,
	getCatalogEmptyState,
	getGymFilterUnavailableState,
	hasActiveCatalogFilters,
	parseCatalogFilters,
	serializeCatalogFilters,
} from './exercise-catalog'

const exercise = (id: string, overrides: Partial<Exercise> = {}): Exercise => ({
	id,
	name: id,
	primaryMuscles: ['PECTORAL'],
	secondaryMuscles: [],
	equipment: 'Barbell',
	movementPattern: 'HORIZONTAL_PUSH',
	mechanic: 'COMPOUND',
	equipmentRequired: ['barbell', 'bench'],
	substitutionGroup: null,
	instructions: [],
	mediaUrl: null,
	createdAt: '2026-09-13T00:00:00.000Z',
	updatedAt: '2026-09-13T00:00:00.000Z',
	...overrides,
})

const bench = exercise('bench', { name: 'Bench Press' })
const pushUp = exercise('push-up', {
	name: 'Push-ups',
	secondaryMuscles: ['TRICEPS'],
	equipmentRequired: ['bodyweight'],
})
const dip = exercise('dip', {
	name: 'Dips',
	primaryMuscles: ['TRICEPS'],
	secondaryMuscles: ['PECTORAL'],
	movementPattern: 'VERTICAL_PUSH',
	equipmentRequired: ['dip-station'],
})
const curl = exercise('curl', {
	name: 'Cable Curl',
	primaryMuscles: ['BICEPS'],
	movementPattern: 'ELBOW_FLEXION',
	mechanic: 'ISOLATION',
	equipmentRequired: ['cable'],
})
const catalog = [curl, dip, pushUp, bench]
const none = { trainedIds: null, listedEquipment: null }
const names = (exercises: Exercise[]) => exercises.map(item => item.name)

describe('catalog filter URL state', () => {
	it('round-trips active filters and omits inactive ones', () => {
		const filters = {
			q: ' press ',
			muscle: 'TRICEPS',
			equipment: 'gym',
			pattern: 'VERTICAL_PUSH',
			trained: true,
		} as const
		const query = serializeCatalogFilters(filters)
		expect(query).toBe(
			'q=press&muscle=TRICEPS&equipment=gym&pattern=VERTICAL_PUSH&trained=1',
		)
		expect(parseCatalogFilters(new URLSearchParams(query))).toEqual({
			...filters,
			q: 'press',
		})
		expect(serializeCatalogFilters(EMPTY_CATALOG_FILTERS)).toBe('')
	})

	it('drops values outside the contract vocabularies', () => {
		expect(
			parseCatalogFilters(
				new URLSearchParams(
					'muscle=chest&equipment=kettlebell&pattern=push&trained=yes',
				),
			),
		).toEqual(EMPTY_CATALOG_FILTERS)
	})

	it('treats whitespace-only search as inactive', () => {
		expect(hasActiveCatalogFilters({ ...EMPTY_CATALOG_FILTERS, q: '  ' })).toBe(
			false,
		)
		expect(
			hasActiveCatalogFilters({ ...EMPTY_CATALOG_FILTERS, trained: true }),
		).toBe(true)
	})
})

describe('filterCatalog', () => {
	it('lists everything alphabetically without filters', () => {
		expect(names(filterCatalog(catalog, EMPTY_CATALOG_FILTERS, none))).toEqual([
			'Bench Press',
			'Cable Curl',
			'Dips',
			'Push-ups',
		])
	})

	it('matches names case-insensitively', () => {
		expect(
			names(
				filterCatalog(catalog, { ...EMPTY_CATALOG_FILTERS, q: 'PUSH' }, none),
			),
		).toEqual(['Push-ups'])
	})

	it('puts primary muscle matches before secondary ones', () => {
		expect(
			names(
				filterCatalog(
					catalog,
					{ ...EMPTY_CATALOG_FILTERS, muscle: 'TRICEPS' },
					none,
				),
			),
		).toEqual(['Dips', 'Push-ups'])
	})

	it('filters by movement pattern and single equipment item', () => {
		expect(
			names(
				filterCatalog(
					catalog,
					{ ...EMPTY_CATALOG_FILTERS, pattern: 'HORIZONTAL_PUSH' },
					none,
				),
			),
		).toEqual(['Bench Press', 'Push-ups'])
		expect(
			names(
				filterCatalog(
					catalog,
					{ ...EMPTY_CATALOG_FILTERS, equipment: 'bench' },
					none,
				),
			),
		).toEqual(['Bench Press'])
	})

	it('keeps only exercises whose equipment is listed at the gym', () => {
		const filters = { ...EMPTY_CATALOG_FILTERS, equipment: 'gym' } as const
		expect(
			names(
				filterCatalog(catalog, filters, {
					trainedIds: null,
					listedEquipment: new Set(['barbell', 'bench']),
				}),
			),
		).toEqual(['Bench Press', 'Push-ups'])
		// Unknown gym equipment matches nothing rather than everything.
		expect(filterCatalog(catalog, filters, none)).toEqual([])
	})

	it('keeps only trained exercises when that filter is on', () => {
		const filters = { ...EMPTY_CATALOG_FILTERS, trained: true }
		expect(
			names(
				filterCatalog(catalog, filters, {
					trainedIds: new Set(['dip', 'curl']),
					listedEquipment: null,
				}),
			),
		).toEqual(['Cable Curl', 'Dips'])
		expect(filterCatalog(catalog, filters, none)).toEqual([])
	})
})

describe('fitsListedEquipment', () => {
	it('never requires bodyweight to be listed and never claims unknowns fit', () => {
		const listed = new Set(['dumbbell'] as const)
		expect(fitsListedEquipment(pushUp, listed)).toBe(true)
		expect(fitsListedEquipment(bench, listed)).toBe(false)
		expect(fitsListedEquipment({ equipmentRequired: [] }, listed)).toBe(false)
	})
})

describe('catalogFilterOptions', () => {
	it('offers only values the catalog uses, in vocabulary order', () => {
		const options = catalogFilterOptions(catalog, EMPTY_CATALOG_FILTERS)
		expect(options.muscles.map(option => option.label)).toEqual([
			'Pecs',
			'Biceps',
			'Triceps',
		])
		expect(options.patterns.map(option => option.value)).toEqual([
			'HORIZONTAL_PUSH',
			'VERTICAL_PUSH',
			'ELBOW_FLEXION',
		])
		expect(options.equipment.map(option => option.label)).toEqual([
			'Barbell',
			'Cable station',
			'Flat bench',
			'Dip station',
			'Bodyweight',
		])
	})

	it('keeps a selected value the catalog no longer uses', () => {
		const options = catalogFilterOptions(catalog, {
			...EMPTY_CATALOG_FILTERS,
			pattern: 'SQUAT',
		})
		expect(options.patterns.map(option => option.value)).toContain('SQUAT')
	})
})

describe('catalog copy', () => {
	it('counts shown against total', () => {
		expect(formatCatalogCount(80, 80)).toBe('80 exercises')
		expect(formatCatalogCount(3, 80)).toBe('3 of 80 exercises')
		expect(formatCatalogCount(1, 1)).toBe('1 exercise')
	})

	it('explains when the gym filter has no equipment to compare', () => {
		expect(getGymFilterUnavailableState('Home Gym')).toMatchObject({
			title: 'Home Gym lists no equipment',
			action: { kind: 'link', href: '/settings' },
		})
		expect(getGymFilterUnavailableState(null).title).toBe(
			'No training location yet',
		)
	})

	it('explains why the list is empty', () => {
		expect(
			getCatalogEmptyState({
				catalogSize: 0,
				filters: EMPTY_CATALOG_FILTERS,
				hasTrainedExercises: null,
			}).title,
		).toBe('The catalog is empty')
		expect(
			getCatalogEmptyState({
				catalogSize: 80,
				filters: { ...EMPTY_CATALOG_FILTERS, trained: true },
				hasTrainedExercises: false,
			}).title,
		).toBe('No trained exercises yet')
		expect(
			getCatalogEmptyState({
				catalogSize: 80,
				filters: { ...EMPTY_CATALOG_FILTERS, trained: true, q: 'zzz' },
				hasTrainedExercises: true,
			}),
		).toMatchObject({
			title: 'No exercises match these filters',
			action: { kind: 'clear-filters' },
		})
	})
})
