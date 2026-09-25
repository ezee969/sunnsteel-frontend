import {
	followWorkingLoad,
	PLATE_SETS,
	type TrainingLocationPreference,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import type { RoutineWizardData } from '@/features/routines/wizard/types'
import { buildRoutineRequest } from '@/features/routines/wizard/utils/routine-summary'
import {
	builderWarmUpEquipment,
	isFollowingWarmUp,
	isWeightLocked,
} from '@/features/routines/wizard/utils/set-kinds'

const gym = (
	overrides: Partial<TrainingLocationPreference> = {},
): TrainingLocationPreference => ({
	id: 'loc-1',
	name: 'Home Gym',
	isDefault: true,
	barWeightKg: 15,
	availablePlatePairs: [{ weightKg: 10, pairCount: 4 }],
	equipment: [],
	createdAt: '2026-09-25T08:00:00.000Z',
	updatedAt: '2026-09-25T08:00:00.000Z',
	...overrides,
})

const sets = [
	{
		setNumber: 1,
		repType: 'FIXED' as const,
		reps: 10,
		weight: 20,
		kind: 'WARMUP' as const,
		warmUpShare: 0,
	},
	{
		setNumber: 2,
		repType: 'FIXED' as const,
		reps: 5,
		weight: 40,
		kind: 'WARMUP' as const,
		warmUpShare: 0.4,
	},
	{
		setNumber: 3,
		repType: 'FIXED' as const,
		reps: 8,
		weight: 30,
		kind: 'WARMUP' as const,
	},
	{
		setNumber: 4,
		repType: 'FIXED' as const,
		reps: 5,
		weight: 100,
		kind: 'WORKING' as const,
	},
]

describe('warm-ups that follow the working load in the builder (LIVE-20)', () => {
	it('locks only a generated warm-up, and only while following', () => {
		expect(sets.map((_, i) => isWeightLocked(sets, i, 'NONE', true))).toEqual([
			true,
			true,
			false,
			false,
		])
		expect(sets.map((_, i) => isWeightLocked(sets, i, 'NONE', false))).toEqual([
			false,
			false,
			false,
			false,
		])
		expect(isFollowingWarmUp(sets[2], true)).toBe(false)
	})

	it('loads from the gym as the server does', () => {
		const saved = builderWarmUpEquipment({
			equipmentRequired: ['barbell'],
			gym: gym(),
			unit: 'KG',
			incrementKg: 2.5,
		})
		expect(saved).toMatchObject({ barLoaded: true, barWeightKg: 15 })
		expect(saved.platePairs).toEqual([{ weightKg: 10, pairCount: 4 }])

		const bare = builderWarmUpEquipment({
			equipmentRequired: ['barbell'],
			gym: gym({ availablePlatePairs: [] }),
			unit: 'KG',
			incrementKg: 2.5,
		})
		expect(bare.barWeightKg).toBe(15)
		expect(bare.platePairs).toEqual(PLATE_SETS.KG.STANDARD)

		const none = builderWarmUpEquipment({
			equipmentRequired: ['dumbbell'],
			gym: undefined,
			unit: 'LB',
			incrementKg: 2,
		})
		expect(none.barLoaded).toBe(false)
		expect(none.platePairs).toEqual(PLATE_SETS.LB.STANDARD)
	})

	it('recalculates a following ramp when the working load moves', () => {
		const moved = sets.map(s =>
			s.kind === 'WORKING' ? { ...s, weight: 110 } : s,
		)
		const next = followWorkingLoad(
			moved,
			builderWarmUpEquipment({
				equipmentRequired: ['barbell'],
				gym: gym({
					barWeightKg: 20,
					availablePlatePairs: PLATE_SETS.KG.STANDARD,
				}),
				unit: 'KG',
				incrementKg: 2.5,
			}),
		)
		// 40 % of 110 is 44, loaded as 42.5; the hand-written warm-up keeps 30.
		expect(next.map(s => s.weight)).toEqual([20, 42.5, 30, 110])
	})

	it('sends the share and the choice with the routine', () => {
		const data = {
			name: 'Upper',
			scheduleMode: 'WEEKLY',
			restDays: [],
			rotationWeekdays: [],
			days: [
				{
					slot: 1,
					name: '',
					exercises: [
						{
							exerciseId: 'bench',
							progressionScheme: 'NONE',
							minWeightIncrement: 2.5,
							restSeconds: 90,
							warmUpsFollowLoad: true,
							sets: [{ ...sets[1] }, { ...sets[3], warmUpShare: 0.4 }],
						},
					],
				},
			],
		} as unknown as RoutineWizardData
		const exercise = buildRoutineRequest(data).days[0].exercises[0]
		expect(exercise.warmUpsFollowLoad).toBe(true)
		expect(exercise.sets.map(s => s.warmUpShare)).toEqual([0.4, undefined])
	})
})
