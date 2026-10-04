import type { WeekStartsOn } from '@sunsteel/contracts'

import type { RoutineWizardData } from '../types'

/**
 * The weekday a control stands for. Its label is looked up from the messages
 * with `weekdayName` (I18N-01); the number is the stored value.
 */
export interface TrainingDayInfo {
	readonly id: number
}

export type TrainingSplitKey =
	'pushPullLegs' | 'pushPullLegsX6' | 'upperLower' | 'fullBody' | 'broSplit'

export interface TrainingSplit {
	readonly key: TrainingSplitKey
	readonly days: number[]
}

export const DAYS_OF_WEEK: readonly TrainingDayInfo[] = [
	{ id: 0 },
	{ id: 1 },
	{ id: 2 },
	{ id: 3 },
	{ id: 4 },
	{ id: 5 },
	{ id: 6 },
] as const

/**
 * PREF-04: the weekday controls in the member's week order, Monday or Sunday
 * first. Only the order changes; each control keeps its stored number.
 */
export const daysOfWeekInOrder = (
	weekStartsOn: WeekStartsOn,
): readonly TrainingDayInfo[] =>
	[...DAYS_OF_WEEK].sort(
		(a, b) => ((a.id - weekStartsOn + 7) % 7) - ((b.id - weekStartsOn + 7) % 7),
	)

export const COMMON_SPLITS: readonly TrainingSplit[] = [
	{ key: 'pushPullLegs', days: [1, 3, 5] },
	{ key: 'pushPullLegsX6', days: [1, 2, 3, 4, 5, 6] },
	{ key: 'upperLower', days: [1, 2, 4, 5] },
	{ key: 'fullBody', days: [1, 3, 5] },
	{ key: 'broSplit', days: [1, 2, 3, 4, 5] },
] as const

export const isSameTrainingSplit = (
	currentDays: RoutineWizardData['trainingDays'],
	candidateDays: number[],
): boolean => {
	if (currentDays.length !== candidateDays.length) {
		return false
	}

	return currentDays.every(day => candidateDays.includes(day))
}

const SPLIT_NAME_KEYS = {
	pushPullLegs: 'splitPushPullLegsName',
	pushPullLegsX6: 'splitPushPullLegsX6Name',
	upperLower: 'splitUpperLowerName',
	fullBody: 'splitFullBodyName',
	broSplit: 'splitBroSplitName',
} as const

export const SPLIT_NAME_KEY_BY_SPLIT = SPLIT_NAME_KEYS
