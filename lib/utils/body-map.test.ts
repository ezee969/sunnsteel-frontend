import { MUSCLE_GROUPS, type MuscleGroupHeatmapWeek } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	BODY_MAP_BACK,
	BODY_MAP_BACK_DETAILS,
	BODY_MAP_FRONT,
	BODY_MAP_FRONT_DETAILS,
	BODY_MAP_OUTLINE,
	BODY_MAP_VIEWBOX,
} from '@/features/body-map/body-map-geometry'
import { translatorFor } from '@/i18n/translator'
import type { Exercise } from '@/lib/api/types'

import {
	bodyMapLevel,
	defaultBodyMapWeek,
	muscleSetsOfWeek,
	plannedMuscleSets,
	resolveBodyMapWeek,
	trainedMuscles,
	untrainedMuscles,
	weekEnd,
} from './body-map'

const week = (
	weekStart: string,
	isCurrentWeek: boolean,
	muscles: MuscleGroupHeatmapWeek['muscles'] = [],
): MuscleGroupHeatmapWeek => ({
	weekStart,
	isCurrentWeek,
	totalWeightedSets: muscles.reduce((sum, m) => sum + m.weightedSets, 0),
	muscles,
})

describe('body map bands (PROG-15, §31)', () => {
	it('bands weekly sets at fixed edges, never relative to the week', () => {
		expect(
			[0, -1, Number.NaN, 0.5, 4.5, 5, 9.5, 10, 14.5, 15, 19.5, 20, 40].map(
				bodyMapLevel,
			),
		).toEqual([0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5])
	})

	it('lists trained muscles most first, ties in catalog order, and the rest apart', () => {
		const sets = new Map([
			['BICEPS', 6],
			['PECTORAL', 6],
			['QUADRICEPS', 16],
			['CALVES', 0],
		] as const)
		expect(trainedMuscles(sets)).toEqual([
			{ muscle: 'QUADRICEPS', sets: 16 },
			{ muscle: 'PECTORAL', sets: 6 },
			{ muscle: 'BICEPS', sets: 6 },
		])
		const untrained = untrainedMuscles(sets)
		expect(untrained).toContain('CALVES')
		expect(untrained).not.toContain('BICEPS')
		expect(untrained).toHaveLength(MUSCLE_GROUPS.length - 3)
	})
})

describe('the week the map shows', () => {
	const weeks = [
		week('2026-11-02', false, [{ muscle: 'PECTORAL', weightedSets: 8 }]),
		week('2026-11-09', false),
		week('2026-11-16', true, [{ muscle: 'GLUTES', weightedSets: 4.5 }]),
	]

	it('opens on the current week, else the latest', () => {
		expect(defaultBodyMapWeek(weeks)).toBe('2026-11-16')
		expect(defaultBodyMapWeek(weeks.slice(0, 2))).toBe('2026-11-09')
		expect(defaultBodyMapWeek([])).toBeNull()
	})

	it('keeps a chosen week while the read has it', () => {
		expect(resolveBodyMapWeek(weeks, '2026-11-02')).toBe('2026-11-02')
		expect(resolveBodyMapWeek(weeks, '2026-10-26')).toBe('2026-11-16')
		expect(resolveBodyMapWeek(weeks, null)).toBe('2026-11-16')
	})

	it("reads a week's sets and ends it six days on, across a month", () => {
		expect(muscleSetsOfWeek(weeks[2]).get('GLUTES')).toBe(4.5)
		expect(weekEnd('2026-11-30')).toBe('2026-12-06')
		expect(weekEnd('2026-12-28')).toBe('2027-01-03')
	})
})

describe("a routine's planned sets", () => {
	const exercise = (
		id: string,
		primaryMuscles: Exercise['primaryMuscles'],
		secondaryMuscles: Exercise['secondaryMuscles'] = [],
	) => ({ id, primaryMuscles, secondaryMuscles }) as unknown as Exercise
	const catalog = {
		bench: exercise('bench', ['PECTORAL'], ['TRICEPS', 'ANTERIOR_DELTOIDS']),
		squat: exercise('squat', ['QUADRICEPS', 'GLUTES'], ['GLUTES']),
	}

	it('counts work sets, halves secondaries and skips warm-ups and unknowns', () => {
		const sets = plannedMuscleSets(
			[
				{
					exercises: [
						{
							exerciseId: 'bench',
							sets: [
								{ kind: 'WARMUP' },
								{},
								{ kind: 'WORKING' },
								{ kind: 'DROP' },
							],
						},
						{ exerciseId: 'missing', sets: [{}, {}] },
					],
				},
				{ exercises: [{ exerciseId: 'squat', sets: [{}, {}, {}] }] },
			],
			catalog,
		)
		expect(sets.get('PECTORAL')).toBe(3)
		expect(sets.get('TRICEPS')).toBe(1.5)
		// A muscle listed as both counts once, as primary.
		expect(sets.get('GLUTES')).toBe(3)
		expect(sets.has('BICEPS')).toBe(false)
	})
})

describe('the figure', () => {
	it('draws every muscle group on the front or the back, and nothing else', () => {
		const drawn = new Set(
			[...BODY_MAP_FRONT, ...BODY_MAP_BACK].map(region => region.muscle),
		)
		expect([...drawn].sort()).toEqual([...MUSCLE_GROUPS].sort())
	})

	it('is path data only, so colour always comes from the tokens', () => {
		const paths = [
			BODY_MAP_OUTLINE,
			BODY_MAP_FRONT_DETAILS,
			BODY_MAP_BACK_DETAILS,
			...BODY_MAP_FRONT.map(region => region.d),
			...BODY_MAP_BACK.map(region => region.d),
		]
		for (const d of paths) expect(d).toMatch(/^[MCLZ0-9 .-]+$/)
		expect(BODY_MAP_VIEWBOX).toMatch(/^0 0 \d+ \d+$/)
	})
})

describe('body map copy', () => {
	it.each(['en', 'es'] as const)('names sets and the legend in %s', locale => {
		const t = translatorFor(locale, 'progress.bodyMap')
		expect(t('sets', { sets: 1, formatted: '1' })).toBe(
			locale === 'en' ? '1 set' : '1 serie',
		)
		expect(t('sets', { sets: 4.5, formatted: '4,5' })).toBe(
			locale === 'en' ? '4,5 sets' : '4,5 series',
		)
		expect(t('band5')).toBe(locale === 'en' ? '20 or more' : '20 o más')
		expect(t('summary', { trained: 0, untrained: 17 })).toContain(
			locale === 'en' ? 'no muscle' : 'ningún músculo',
		)
	})
})
