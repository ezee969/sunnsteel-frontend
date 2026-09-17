import type { Routine, WorkoutSessionSummary } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	addMonths,
	buildScheduleMonth,
	describeConsistency,
	describeMonth,
	describeMonthCell,
	scheduleDayState,
	scheduleMonthRange,
	startOfMonth,
} from './schedule-month'

// Wednesday 16 Sep 2026, local time.
const NOW = new Date(2026, 8, 16, 12, 0)
const SEPTEMBER = startOfMonth(NOW)
const at = (month: number, day: number, hour = 18) =>
	new Date(2026, month, day, hour).toISOString()

const routine: Routine = {
	id: 'split',
	userId: 'u',
	name: 'Split',
	description: null,
	isPeriodized: false,
	isFavorite: false,
	isCompleted: false,
	scheduleMode: 'WEEKLY',
	nextRotationDayId: null,
	restDays: [0],
	rotationWeekdays: [],
	visibility: 'PRIVATE',
	createdAt: new Date(2026, 7, 1).toISOString(),
	updatedAt: new Date(2026, 7, 1).toISOString(),
	days: [{ id: 'mon', dayOfWeek: 1, name: null, order: 0, exercises: [] }],
}

const session = (
	id: string,
	startedAt: string,
	status: WorkoutSessionSummary['status'] = 'COMPLETED',
): WorkoutSessionSummary => ({
	id,
	status,
	startedAt,
	endedAt: startedAt,
	routine: { id: 'split', name: 'Split', dayName: 'Monday' },
})

describe('schedule month', () => {
	it('lays the month out in Monday-based weeks and reads one day past them', () => {
		// 1 Sep 2026 is a Tuesday and 30 Sep a Wednesday: Aug 31 – Oct 4.
		const month = buildScheduleMonth({
			monthStart: SEPTEMBER,
			now: NOW,
			routines: [],
			sessions: [],
		})
		expect(month.weeks).toHaveLength(5)
		expect(month.weeks[0][0].date).toBe('2026-08-31')
		expect(month.weeks[0][0].inMonth).toBe(false)
		expect(month.weeks[4][6].date).toBe('2026-10-04')
		const { from, to } = scheduleMonthRange(SEPTEMBER)
		expect(new Date(from).getDate()).toBe(31)
		expect(new Date(to).getMonth()).toBe(9)
		expect(new Date(to).getDate()).toBe(6)
		expect(addMonths(SEPTEMBER, 1).getMonth()).toBe(9)
	})

	it('marks each day by its strongest entry and counts only the month', () => {
		const month = buildScheduleMonth({
			monthStart: SEPTEMBER,
			now: NOW,
			routines: [routine],
			sessions: [
				session('s1', at(8, 7)),
				// Aug 31 is outside September: shown but never counted.
				session('s0', at(7, 31)),
				session('s2', at(8, 9), 'ABORTED'),
			],
		})
		const cell = (date: string) =>
			month.weeks.flat().find(c => c.date === date)!
		expect(cell('2026-09-07').state).toBe('COMPLETED')
		expect(cell('2026-09-09').state).toBe('ABORTED')
		expect(cell('2026-09-14').state).toBe('NOT_LOGGED')
		expect(cell('2026-09-21').state).toBe('PLANNED')
		expect(cell('2026-09-13').state).toBe('REST')
		expect(cell('2026-09-10').state).toBe('EMPTY')
		expect(cell('2026-08-31').state).toBe('EMPTY')
		// Mondays 7–28: one completed, one not logged, two planned.
		expect(month.totals).toEqual({
			completed: 1,
			aborted: 1,
			planned: 2,
			notLogged: 1,
			rest: 4,
			moved: 0,
			skipped: 0,
		})
		expect(month.includesToday).toBe(true)
		expect(month.trainedDays).toBe(1)
		expect(month.countedDays).toBe(16)
		expect(describeConsistency(month)).toBe('Trained on 1 of 16 days so far')
	})

	it('describes months, cells and consistency in plain words', () => {
		expect(describeMonth('2026-09-01', NOW)).toBe('This month')
		expect(describeMonth('2026-08-01', NOW)).toBe('Last month')
		expect(describeMonth('2026-10-01', NOW)).toBe('Next month')
		expect(describeMonth('2026-05-01', NOW)).toMatch(/2026/)
		expect(
			describeConsistency({
				trainedDays: 0,
				countedDays: 0,
				includesToday: false,
			}),
		).toBeNull()
		expect(
			describeConsistency({
				trainedDays: 12,
				countedDays: 30,
				includesToday: false,
			}),
		).toBe('Trained on 12 of 30 days')
		expect(
			scheduleDayState({
				entries: [
					{
						kind: 'PLANNED',
						routineId: 'a',
						routineDayId: 'd',
						routineName: 'A',
						dayName: 'Mon',
					},
					{ kind: 'REST', routineId: 'b', routineName: 'B', dayName: null },
				],
			}),
		).toBe('PLANNED')
		const label = describeMonthCell({
			date: '2026-09-16',
			isToday: true,
			entries: [
				{
					kind: 'PLANNED',
					routineId: 'a',
					routineDayId: 'd',
					routineName: 'A',
					dayName: 'Wed',
				},
				{
					kind: 'PLANNED',
					routineId: 'b',
					routineDayId: 'e',
					routineName: 'B',
					dayName: 'Wed',
				},
				{ kind: 'REST', routineId: 'c', routineName: 'C', dayName: null },
			],
		})
		expect(label).toMatch(/16/)
		expect(label).toMatch(/, today: 2 planned, 1 rest day$/)
		expect(
			describeMonthCell({ date: '2026-09-10', isToday: false, entries: [] }),
		).toMatch(/: nothing planned$/)
	})
})
