import type { TrainingLocationPreference } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	buildWarmUpRamp,
	describeBasis,
	describePlates,
	equipmentBasis,
	isBarLoaded,
	PLATE_SETS,
	saveEquipmentRequest,
} from './warm-up-ramp'

const standard = PLATE_SETS.KG.STANDARD
const ramp = (overrides: Partial<Parameters<typeof buildWarmUpRamp>[0]>) =>
	buildWarmUpRamp({
		workingWeightKg: 100,
		barLoaded: true,
		barWeightKg: 20,
		platePairs: standard,
		incrementKg: 2.5,
		room: 10,
		...overrides,
	})

describe('the warm-up ramp (LIVE-13)', () => {
	it('builds the bar ramp at 40, 60 and 80 % with loadable plates', () => {
		const { sets } = ramp({})
		expect(sets.map(set => [set.weightKg, set.reps])).toEqual([
			[20, 10],
			[40, 5],
			[60, 3],
			[80, 2],
		])
		expect(sets[0].platesPerSide).toEqual([])
		expect(describePlates(sets[1].platesPerSide, 'KG')).toBe('10 per side')
		expect(sets.every(set => !set.limited)).toBe(true)
	})

	it('rounds each step down to what the plates can make', () => {
		const { sets } = ramp({ workingWeightKg: 87.5 })
		// 35, 52.5, 70 exactly with 1.25 kg pairs.
		expect(sets.map(set => set.weightKg)).toEqual([20, 35, 52.5, 70])
		const coarse = ramp({
			workingWeightKg: 87.5,
			platePairs: [{ weightKg: 10, pairCount: 4 }],
		})
		expect(coarse.sets.map(set => set.weightKg)).toEqual([20, 40, 60])
		expect(coarse.sets.map(set => set.limited)).toEqual([false, true, true])
	})

	it('drops steps that repeat a load or reach the working load', () => {
		const { sets } = ramp({ workingWeightKg: 30 })
		// 40 % and 60 % are below the bar, 80 % is 22.5.
		expect(sets.map(set => set.weightKg)).toEqual([20, 22.5])
		expect(ramp({ workingWeightKg: 20 }).sets).toEqual([])
	})

	it('loads each step heaviest plate first', () => {
		const { sets } = ramp({ platePairs: PLATE_SETS.KG.LIGHT })
		// 80 kg: 30 per side is 20 + 10, not 15 + 15.
		expect(describePlates(sets[3].platesPerSide, 'KG')).toBe('20 + 10 per side')
		expect(describePlates(ramp({}).sets[3].platesPerSide, 'KG')).toBe(
			'25 + 5 per side',
		)
	})

	it('keeps the heaviest steps when the exercise is short of room', () => {
		const { sets, leftOut } = ramp({ room: 2 })
		expect(sets.map(set => set.weightKg)).toEqual([60, 80])
		expect(leftOut).toBe(2)
		expect(ramp({ room: 0 }).sets).toEqual([])
	})

	it('uses 50 and 75 % on the exercise step for anything not bar-loaded', () => {
		const { sets } = ramp({
			barLoaded: false,
			workingWeightKg: 32,
			incrementKg: 2,
		})
		expect(sets.map(set => [set.weightKg, set.reps])).toEqual([
			[16, 8],
			[24, 3],
		])
		expect(sets[0].platesPerSide).toBeUndefined()
	})

	it('builds nothing for an unloaded set', () => {
		expect(ramp({ workingWeightKg: 0 }).sets).toEqual([])
	})

	it('knows which exercises take a bar', () => {
		expect(isBarLoaded(['barbell', 'rack'])).toBe(true)
		expect(isBarLoaded(['smith-machine'])).toBe(true)
		expect(isBarLoaded(['dumbbell', 'bench'])).toBe(false)
		expect(isBarLoaded(undefined)).toBe(false)
	})
})

const location = (
	overrides: Partial<TrainingLocationPreference> = {},
): TrainingLocationPreference => ({
	id: 'loc-1',
	name: 'Home Gym',
	isDefault: true,
	barWeightKg: 20,
	availablePlatePairs: [{ weightKg: 20, pairCount: 2 }],
	equipment: ['barbell'],
	createdAt: '2026-09-25T08:00:00.000Z',
	updatedAt: '2026-09-25T08:00:00.000Z',
	...overrides,
})

describe('what the ramp is built from (LIVE-13)', () => {
	it('says which equipment it used, or what it assumed', () => {
		const words = (basis: ReturnType<typeof equipmentBasis>) =>
			describeBasis({
				barLoaded: true,
				basis,
				barWeightKg: 20,
				plateSet: 'STANDARD',
				incrementKg: 2.5,
				unit: 'KG',
			})
		expect(words(equipmentBasis(location()))).toBe(
			'Home Gym · 20 kg bar · your plates.',
		)
		expect(
			words(equipmentBasis(location({ availablePlatePairs: [] }))),
		).toContain('no plates saved there, so standard plates are assumed')
		expect(words(equipmentBasis(undefined))).toBe(
			'No gym saved yet: 20 kg bar and standard plates.',
		)
		expect(
			describeBasis({
				barLoaded: false,
				basis: { kind: 'NO_LOCATION' },
				barWeightKg: 20,
				plateSet: 'STANDARD',
				incrementKg: 2,
				unit: 'KG',
			}),
		).toBe("Rounded down to this exercise's 2 kg step.")
	})

	it('saves a new gym, or plates into the one that had none', () => {
		const created = saveEquipmentRequest({
			locations: [],
			basis: { kind: 'NO_LOCATION' },
			barWeightKg: 15,
			platePairs: PLATE_SETS.KG.LIGHT,
		})
		expect(created?.locations).toEqual([
			expect.objectContaining({
				name: 'Home Gym',
				isDefault: true,
				barWeightKg: 15,
				equipment: [],
			}),
		])

		const other = location({ id: 'loc-2', name: 'Work', isDefault: false })
		const bare = location({ availablePlatePairs: [] })
		const filled = saveEquipmentRequest({
			locations: [bare, other],
			basis: equipmentBasis(bare),
			barWeightKg: 20,
			platePairs: standard,
		})
		expect(filled?.locations).toHaveLength(2)
		expect(filled?.locations[0].availablePlatePairs).toEqual(standard)
		expect(filled?.locations[0].barWeightKg).toBe(20)
		expect(filled?.locations[1]).toMatchObject({
			id: 'loc-2',
			availablePlatePairs: other.availablePlatePairs,
		})

		expect(
			saveEquipmentRequest({
				locations: [location()],
				basis: equipmentBasis(location()),
				barWeightKg: 20,
				platePairs: standard,
			}),
		).toBeNull()
	})

	it('offers pound plates in pounds', () => {
		expect(
			describePlates(
				[
					{ weightKg: PLATE_SETS.LB.STANDARD[0].weightKg, platesPerSide: 1 },
					{ weightKg: PLATE_SETS.LB.STANDARD[4].weightKg, platesPerSide: 1 },
				],
				'LB',
			),
		).toBe('45 + 5 per side')
	})
})
