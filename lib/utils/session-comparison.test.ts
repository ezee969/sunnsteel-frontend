import type { SessionComparisonSession } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { buildSessionExerciseComparisons } from './session-comparison'

function session(
	sessionId: string,
	exercises: SessionComparisonSession['exercises'],
): SessionComparisonSession {
	return {
		sessionId,
		routineDayId: 'routine-day-1',
		routineName: 'Autumn block',
		dayName: 'Thursday',
		startedAt: '2026-09-10T00:00:00.000Z',
		endedAt: '2026-09-10T01:00:00.000Z',
		durationSec: 3600,
		totalVolumeKg: 1000,
		completedSets: 2,
		notes: null,
		exercises,
	}
}

describe('session exercise comparison', () => {
	it('matches exercises and sets by their stable prescription identities', () => {
		const latest = session('latest', [
			{
				routineExerciseId: 'bench-slot',
				exerciseId: 'bench',
				exerciseName: 'Barbell Bench Press',
				order: 0,
				sets: [
					{
						routineExerciseId: 'bench-slot',
						setNumber: 2,
						reps: 6,
						weightKg: 100,
						rpe: 8,
					},
				],
			},
		])
		const previous = session('previous', [
			{
				routineExerciseId: 'bench-slot',
				exerciseId: 'bench',
				exerciseName: 'Old bench name',
				order: 0,
				sets: [
					{
						routineExerciseId: 'bench-slot',
						setNumber: 1,
						reps: 8,
						weightKg: 90,
					},
					{
						routineExerciseId: 'bench-slot',
						setNumber: 2,
						reps: 7,
						weightKg: 95,
					},
				],
			},
		])

		const result = buildSessionExerciseComparisons(latest, previous)

		expect(result).toHaveLength(1)
		expect(result[0].exerciseName).toBe('Barbell Bench Press')
		expect(result[0].sets.map(set => set.setNumber)).toEqual([1, 2])
		expect(result[0].sets[0].latest).toBeNull()
		expect(result[0].sets[1].previous?.weightKg).toBe(95)
	})

	it('does not merge two prescription slots that use the same exercise', () => {
		const latest = session('latest', [
			{
				routineExerciseId: 'bench-slot-a',
				exerciseId: 'bench',
				exerciseName: 'Bench Press',
				order: 0,
				sets: [],
			},
		])
		const previous = session('previous', [
			{
				routineExerciseId: 'bench-slot-b',
				exerciseId: 'bench',
				exerciseName: 'Bench Press',
				order: 0,
				sets: [],
			},
		])

		const result = buildSessionExerciseComparisons(latest, previous)

		expect(result.map(item => item.routineExerciseId)).toEqual([
			'bench-slot-a',
			'bench-slot-b',
		])
		expect(result[0].previous).toBeNull()
		expect(result[1].latest).toBeNull()
	})
})
