import type { RoutineWizardData } from '../types'

export interface TrainingDayInfo {
	readonly id: number
	readonly name: string
	readonly short: string
}

export interface TrainingSplit {
	readonly name: string
	readonly days: number[]
	readonly description: string
}

export const DAYS_OF_WEEK: readonly TrainingDayInfo[] = [
	{ id: 0, name: 'Sunday', short: 'Sun' },
	{ id: 1, name: 'Monday', short: 'Mon' },
	{ id: 2, name: 'Tuesday', short: 'Tue' },
	{ id: 3, name: 'Wednesday', short: 'Wed' },
	{ id: 4, name: 'Thursday', short: 'Thu' },
	{ id: 5, name: 'Friday', short: 'Fri' },
	{ id: 6, name: 'Saturday', short: 'Sat' },
] as const

export const COMMON_SPLITS: readonly TrainingSplit[] = [
	{
		name: 'Push/Pull/Legs',
		days: [1, 3, 5],
		description: '3-day split: Mon, Wed, Fri',
	},
	{
		name: 'Push/Pull/Legs (x6)',
		days: [1, 2, 3, 4, 5, 6],
		description: '6-day split: Mon-Sat (Push, Pull, Legs, Push, Pull, Legs)',
	},
	{
		name: 'Upper/Lower',
		days: [1, 2, 4, 5],
		description: '4-day split: Mon, Tue, Thu, Fri',
	},
	{
		name: 'Full Body',
		days: [1, 3, 5],
		description: '3-day full body: Mon, Wed, Fri',
	},
	{
		name: 'Bro Split',
		days: [1, 2, 3, 4, 5],
		description: '5-day split: Mon-Fri',
	},
] as const

export const isSameTrainingSplit = (
	currentDays: RoutineWizardData['trainingDays'],
	candidateDays: number[],
): boolean => {
	if (currentDays.length !== candidateDays.length) {
		return false
	}

	return currentDays.every((day) => candidateDays.includes(day))
}
