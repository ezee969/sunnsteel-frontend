import type {
	MeasurableGoal,
	MeasurableGoalDirection,
	MeasurableGoalInput,
	MeasurableGoalType,
	WeightUnit,
} from '@sunsteel/contracts'

import {
	displayWeightToKilograms,
	formatWeightInput,
	parseWeightInput,
} from './weight-unit'

export interface MeasurableGoalDraft {
	key: string
	id?: string
	type: MeasurableGoalType
	target: string
	direction: MeasurableGoalDirection
	exerciseId: string
}

export const MEASURABLE_GOAL_OPTIONS: ReadonlyArray<{
	value: MeasurableGoalType
	label: string
}> = [
	{ value: 'WEEKLY_SESSIONS', label: 'Weekly sessions' },
	{ value: 'WEEKLY_VOLUME', label: 'Weekly load volume' },
	{ value: 'STREAK_DAYS', label: 'Training streak' },
	{ value: 'EXERCISE_ESTIMATED_1RM', label: 'Exercise strength' },
	{ value: 'BODY_WEIGHT', label: 'Body weight' },
]

const WEIGHT_GOAL_TYPES = new Set<MeasurableGoalType>([
	'WEEKLY_VOLUME',
	'EXERCISE_ESTIMATED_1RM',
	'BODY_WEIGHT',
])

const LIMITS: Record<
	MeasurableGoalType,
	{ minimumKg: number; maximumKg: number; integer?: boolean }
> = {
	WEEKLY_SESSIONS: { minimumKg: 1, maximumKg: 14, integer: true },
	WEEKLY_VOLUME: { minimumKg: 1, maximumKg: 1_000_000_000 },
	STREAK_DAYS: { minimumKg: 1, maximumKg: 3650, integer: true },
	EXERCISE_ESTIMATED_1RM: { minimumKg: 0.1, maximumKg: 2000 },
	BODY_WEIGHT: { minimumKg: 20, maximumKg: 1000 },
}

let draftSequence = 0

export function isWeightGoal(type: MeasurableGoalType): boolean {
	return WEIGHT_GOAL_TYPES.has(type)
}

export function getMeasurableGoalLabel(type: MeasurableGoalType): string {
	return (
		MEASURABLE_GOAL_OPTIONS.find(option => option.value === type)?.label ?? type
	)
}

export function createMeasurableGoalDraft(
	type: MeasurableGoalType = 'WEEKLY_SESSIONS',
): MeasurableGoalDraft {
	draftSequence += 1
	return {
		key: `new-goal-${draftSequence}`,
		type,
		target: '',
		direction: 'AT_LEAST',
		exerciseId: '',
	}
}

export function measurableGoalsToDrafts(
	goals: MeasurableGoal[],
	weightUnit: WeightUnit,
): MeasurableGoalDraft[] {
	return goals.map(goal => ({
		key: goal.id,
		id: goal.id,
		type: goal.type,
		target: isWeightGoal(goal.type)
			? formatWeightInput(goal.targetValue, weightUnit)
			: String(goal.targetValue),
		direction: goal.direction,
		exerciseId: goal.exercise?.id ?? '',
	}))
}

export function convertMeasurableGoalDrafts(
	drafts: MeasurableGoalDraft[],
	fromUnit: WeightUnit,
	toUnit: WeightUnit,
): MeasurableGoalDraft[] {
	if (fromUnit === toUnit) return drafts
	return drafts.map(draft => {
		if (!isWeightGoal(draft.type) || !draft.target.trim()) return draft
		const targetKg = parseWeightInput(draft.target, fromUnit)
		return targetKg === undefined
			? draft
			: { ...draft, target: formatWeightInput(targetKg, toUnit) }
	})
}

export function buildMeasurableGoalsRequest(
	drafts: MeasurableGoalDraft[],
	weightUnit: WeightUnit,
): { goals: MeasurableGoalInput[] } {
	const keys = new Set<string>()
	return {
		goals: drafts.map(draft => {
			const parsed = Number.parseFloat(draft.target.trim())
			if (!Number.isFinite(parsed)) {
				throw new Error(
					`Enter a target for ${getMeasurableGoalLabel(draft.type)}.`,
				)
			}
			const targetValue = isWeightGoal(draft.type)
				? displayWeightToKilograms(parsed, weightUnit)
				: parsed
			const limits = LIMITS[draft.type]
			if (
				targetValue < limits.minimumKg ||
				targetValue > limits.maximumKg ||
				(limits.integer && !Number.isInteger(targetValue))
			) {
				throw new Error(
					`Check the target for ${getMeasurableGoalLabel(draft.type)}.`,
				)
			}
			if (draft.type === 'EXERCISE_ESTIMATED_1RM' && !draft.exerciseId) {
				throw new Error('Choose an exercise for every strength goal.')
			}
			const key = `${draft.type}:${draft.exerciseId}`
			if (keys.has(key)) {
				throw new Error('Each measurable goal must be unique.')
			}
			keys.add(key)
			return {
				...(draft.id ? { id: draft.id } : {}),
				type: draft.type,
				targetValue,
				direction: draft.type === 'BODY_WEIGHT' ? draft.direction : 'AT_LEAST',
				...(draft.type === 'EXERCISE_ESTIMATED_1RM'
					? { exerciseId: draft.exerciseId }
					: {}),
			}
		}),
	}
}
