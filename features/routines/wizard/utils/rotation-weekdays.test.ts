import { describe, expect, it } from 'vitest'

import type { RoutineWizardData } from '../types'
import { buildRoutineRequest } from './routine-summary'
import { changeScheduleMode, toggleRotationWeekday } from './schedule'

const weekly: RoutineWizardData = {
	name: 'Split',
	scheduleMode: 'WEEKLY',
	trainingDays: [1, 3, 5],
	restDays: [0],
	rotationWeekdays: [],
	days: [1, 3, 5].map(slot => ({ slot, name: '', exercises: [] })),
}

describe('rotation training weekdays in the wizard (SCHED-06)', () => {
	it('carries a weekly routine’s weekdays into a rotation and back out', () => {
		const rotation = { ...weekly, ...changeScheduleMode(weekly, 'ROTATION') }
		expect(rotation.rotationWeekdays).toEqual([1, 3, 5])
		expect(rotation.restDays).toEqual([])
		expect(buildRoutineRequest(rotation).rotationWeekdays).toEqual([1, 3, 5])

		const back = { ...rotation, ...changeScheduleMode(rotation, 'WEEKLY') }
		expect(back.rotationWeekdays).toEqual([])
		expect(buildRoutineRequest(back).rotationWeekdays).toEqual([])
	})

	it('toggles weekdays on a rotation only, kept sorted', () => {
		const rotation = {
			...weekly,
			...changeScheduleMode(weekly, 'ROTATION'),
			rotationWeekdays: [],
		}
		const withSaturday = toggleRotationWeekday(rotation, 6)
		expect(withSaturday.rotationWeekdays).toEqual([6])
		expect(
			toggleRotationWeekday({ ...rotation, rotationWeekdays: [2, 6] }, 4)
				.rotationWeekdays,
		).toEqual([2, 4, 6])
		expect(
			toggleRotationWeekday({ ...rotation, rotationWeekdays: [2, 6] }, 2)
				.rotationWeekdays,
		).toEqual([6])
		expect(toggleRotationWeekday(weekly, 2).rotationWeekdays).toEqual([])
	})
})
