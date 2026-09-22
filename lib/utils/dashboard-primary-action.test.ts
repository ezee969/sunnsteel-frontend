import { describe, expect, it } from 'vitest'

import {
	getDashboardPrimaryCopy,
	resolveDashboardPrimaryAction,
} from '@/lib/utils/dashboard-primary-action'

const entry = (routineId: string, dayId: string, canStartToday = true) => ({
	routine: { id: routineId },
	day: { id: dayId },
	canStartToday,
})

const active = {
	id: 'session-1',
	status: 'IN_PROGRESS' as const,
	routineDayId: 'day-9',
	routine: { id: 'routine-9', name: 'Upper / Lower' },
	routineDay: { id: 'day-9', name: 'Upper A', exercises: [] },
}

const completed = {
	id: 'session-0',
	routine: { id: 'routine-1', name: 'Push Pull Legs', dayName: 'Push' },
}

describe('dashboard primary action', () => {
	it('resumes an open session before anything scheduled or finished', () => {
		expect(
			resolveDashboardPrimaryAction({
				hasTrainableDay: false,
				active,
				entries: [entry('routine-1', 'day-1')],
				completedToday: completed,
			}),
		).toEqual({
			kind: 'RESUME',
			sessionId: 'session-1',
			routineDayId: 'day-9',
			routineName: 'Upper / Lower',
			dayName: 'Upper A',
		})
	})

	it('ignores a session that is no longer in progress', () => {
		expect(
			resolveDashboardPrimaryAction({
				hasTrainableDay: false,
				active: { ...active, status: 'COMPLETED' },
				entries: [entry('routine-1', 'day-1')],
			}).kind,
		).toBe('START')
	})

	it('starts the first workout that can actually be started today', () => {
		expect(
			resolveDashboardPrimaryAction({
				hasTrainableDay: false,
				entries: [
					entry('routine-1', 'day-1', false),
					entry('routine-2', 'day-2'),
				],
				completedToday: completed,
			}),
		).toEqual({ kind: 'START', routineId: 'routine-2', routineDayId: 'day-2' })
	})

	it('reviews today’s finished workout once nothing is left to start', () => {
		expect(
			resolveDashboardPrimaryAction({
				hasTrainableDay: false,
				entries: [entry('routine-1', 'day-1', false)],
				completedToday: completed,
			}),
		).toEqual({
			kind: 'REVIEW',
			sessionId: 'session-0',
			routineName: 'Push Pull Legs',
			dayName: 'Push',
		})
	})

	it('falls back to browsing routines when there is nothing to train', () => {
		expect(
			resolveDashboardPrimaryAction({ entries: [], hasTrainableDay: false }),
		).toEqual({ kind: 'BROWSE' })
	})

	it('offers a day to train when nothing is planned but one exists', () => {
		// LIVE-06. Sending someone to a routine list when they already have a
		// trainable day is three taps of nothing: the API never required a day
		// to be scheduled today.
		expect(
			resolveDashboardPrimaryAction({ entries: [], hasTrainableDay: true }),
		).toEqual({ kind: 'PICK_DAY' })
	})

	it('still prefers today’s plan over offering another day', () => {
		// The new branch is last but one; it must not displace the plan.
		expect(
			resolveDashboardPrimaryAction({
				entries: [entry('routine-1', 'day-1')],
				hasTrainableDay: true,
			}),
		).toMatchObject({ kind: 'START', routineDayId: 'day-1' })
	})

	it('still prefers reviewing a workout already finished today', () => {
		expect(
			resolveDashboardPrimaryAction({
				entries: [],
				completedToday: completed,
				hasTrainableDay: true,
			}),
		).toMatchObject({ kind: 'REVIEW' })
	})
})

describe('dashboard primary copy', () => {
	const context = { plannedCount: 1, todayName: 'Sunday' }

	it('names the open or finished workout when it is known', () => {
		expect(
			getDashboardPrimaryCopy(
				{
					kind: 'RESUME',
					sessionId: 's',
					routineDayId: 'd',
					routineName: 'Upper / Lower',
					dayName: 'Upper A',
				},
				context,
			).description,
		).toBe('Upper / Lower · Upper A is still open. Pick up where you left off.')
		expect(
			getDashboardPrimaryCopy(
				{ kind: 'RESUME', sessionId: 's', routineDayId: 'd' },
				context,
			).description,
		).toBe('Pick up where you left off.')
		expect(
			getDashboardPrimaryCopy(
				{ kind: 'REVIEW', sessionId: 's', routineName: 'Full Body' },
				context,
			).description,
		).toBe('Full Body is complete. Review how it went.')
	})

	it('pluralises the planned count and names the weekday', () => {
		const start = { kind: 'START', routineId: 'r', routineDayId: 'd' } as const
		expect(getDashboardPrimaryCopy(start, context).description).toBe(
			'You have 1 workout planned.',
		)
		expect(
			getDashboardPrimaryCopy(start, { ...context, plannedCount: 3 })
				.description,
		).toBe('You have 3 workouts planned.')
		expect(
			getDashboardPrimaryCopy({ kind: 'BROWSE' }, context).description,
		).toBe(
			'You don’t have any routines planned for Sunday. Start one from your routines.',
		)
	})
})
