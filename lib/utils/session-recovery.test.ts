import { describe, expect, it } from 'vitest'

import type { WorkoutSession } from '@/lib/api/types/workout.type'

import {
	getSessionRecoverySummary,
	STALE_SESSION_THRESHOLD_MS,
} from './session-recovery'

const NOW = Date.parse('2026-09-07T12:00:00Z')

function makeSession(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
	return {
		id: 'session-1',
		userId: 'owner',
		routineId: 'routine-1',
		routineDayId: 'day-1',
		status: 'IN_PROGRESS',
		startedAt: '2026-09-05T11:59:59Z',
		lastActivityAt: '2026-09-05T11:59:59Z',
		routineDay: {
			id: 'day-1',
			exercises: [
				{
					id: 'routine-exercise-1',
					order: 1,
					progressionScheme: 'NONE',
					minWeightIncrement: 2.5,
					exercise: {
						id: 'exercise-1',
						name: 'Squat',
						primaryMuscles: ['QUADRICEPS'],
					},
					sets: [
						{ id: 'set-1', setNumber: 1, repType: 'FIXED' },
						{ id: 'set-2', setNumber: 2, repType: 'FIXED' },
					],
				},
			],
		},
		setLogs: [
			{
				id: 'log-1',
				sessionId: 'session-1',
				routineExerciseId: 'routine-exercise-1',
				exerciseId: 'exercise-1',
				setNumber: 1,
				reps: 8,
				isCompleted: true,
				createdAt: '2026-09-05T12:00:00Z',
				updatedAt: '2026-09-05T12:00:00Z',
			},
		],
		...overrides,
	}
}

describe('stale-session recovery', () => {
	it('offers recovery once the last activity reaches 48 hours', () => {
		const summary = getSessionRecoverySummary(makeSession(), NOW)

		expect(summary).toEqual({
			lastActivityAt: '2026-09-05T11:59:59Z',
			idleMs: STALE_SESSION_THRESHOLD_MS + 1000,
			completedSets: 1,
			totalSets: 2,
		})
	})

	it('does not interrupt a session that is still recent', () => {
		const session = makeSession({
			lastActivityAt: '2026-09-05T12:00:01Z',
		})

		expect(getSessionRecoverySummary(session, NOW)).toBeNull()
	})

	it('uses the start time when no activity timestamp exists', () => {
		const session = makeSession({ lastActivityAt: null })

		expect(getSessionRecoverySummary(session, NOW)?.lastActivityAt).toBe(
			session.startedAt,
		)
	})

	it('ignores finished sessions and invalid timestamps', () => {
		expect(
			getSessionRecoverySummary(makeSession({ status: 'COMPLETED' }), NOW),
		).toBeNull()
		expect(
			getSessionRecoverySummary(
				makeSession({ lastActivityAt: 'invalid' }),
				NOW,
			),
		).toBeNull()
	})

	it('counts only completed logs that belong to planned sets', () => {
		const session = makeSession()
		session.setLogs?.push({
			...session.setLogs[0],
			id: 'unplanned-log',
			setNumber: 99,
		})

		expect(getSessionRecoverySummary(session, NOW)?.completedSets).toBe(1)
	})
})
