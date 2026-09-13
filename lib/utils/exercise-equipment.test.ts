import type { TrainingLocationPreference } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	defaultTrainingLocation,
	listedEquipmentAt,
	normalizeLocationEquipment,
} from './exercise-equipment'

const location = (
	equipment: string[],
	overrides: Partial<TrainingLocationPreference> = {},
): TrainingLocationPreference => ({
	id: 'home',
	name: 'Home Gym',
	isDefault: true,
	barWeightKg: 20,
	availablePlatePairs: [],
	equipment,
	createdAt: '2026-09-13T00:00:00.000Z',
	updatedAt: '2026-09-13T00:00:00.000Z',
	...overrides,
})

describe('normalizeLocationEquipment', () => {
	it('maps free-text location equipment onto the catalog vocabulary', () => {
		expect([
			...normalizeLocationEquipment([
				'Dumbbells',
				'Power Rack',
				'adjustable bench',
				'cables',
				'pull up bar',
				'kettlebell',
			]),
		]).toEqual([
			'dumbbell',
			'rack',
			'bench',
			'incline-bench',
			'cable',
			'pull-up-bar',
		])
	})
})

describe('default location equipment', () => {
	it('prefers the default location and falls back to the first', () => {
		const other = location(['rack'], { id: 'other', isDefault: false })
		expect(defaultTrainingLocation([other, location(['bench'])])?.id).toBe(
			'home',
		)
		expect(defaultTrainingLocation([other])?.id).toBe('other')
		expect(defaultTrainingLocation(undefined)).toBeUndefined()
	})

	it('treats a location with nothing listed as unknown', () => {
		expect(listedEquipmentAt(location([]))).toBeNull()
		expect(listedEquipmentAt(undefined)).toBeNull()
		expect([...(listedEquipmentAt(location(['barbells'])) ?? [])]).toEqual([
			'barbell',
		])
	})
})
