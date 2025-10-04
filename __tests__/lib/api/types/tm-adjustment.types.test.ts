import { describe, it, expect } from 'vitest'
import {
	CreateTmEventRequest,
	TmEventResponse,
	TmEventSummary,
	TM_ADJUSTMENT_CONSTANTS,
	ProgramStyle,
} from '@/lib/api/types/tm-adjustment.types'

describe('TM Adjustment Types', () => {
	it('should define correct TM adjustment constants', () => {
		expect(TM_ADJUSTMENT_CONSTANTS.MAX_DELTA_KG).toBe(15)
		expect(TM_ADJUSTMENT_CONSTANTS.MIN_DELTA_KG).toBe(-15)
		expect(TM_ADJUSTMENT_CONSTANTS.MIN_WEEK).toBe(1)
		expect(TM_ADJUSTMENT_CONSTANTS.MAX_WEEK).toBe(21)
		expect(TM_ADJUSTMENT_CONSTANTS.MAX_REASON_LENGTH).toBe(160)
	})

	it('should validate CreateTmEventRequest structure', () => {
		const request: CreateTmEventRequest = {
			exerciseId: 'exercise-123',
			weekNumber: 3,
			deltaKg: 2.5,
			preTmKg: 100,
			postTmKg: 102.5,
			reason: 'Completed all reps with excellent form'
		}

		expect(request.exerciseId).toBe('exercise-123')
		expect(request.weekNumber).toBe(3)
		expect(request.deltaKg).toBe(2.5)
		expect(request.preTmKg).toBe(100)
		expect(request.postTmKg).toBe(102.5)
		expect(request.reason).toBe('Completed all reps with excellent form')
	})

	it('should validate TmEventResponse structure', () => {
		const response: TmEventResponse = {
			id: 'adjustment-123',
			routineId: 'routine-456',
			exerciseId: 'exercise-789',
			exerciseName: 'Bench Press',
			weekNumber: 5,
			deltaKg: -1.0,
			preTmKg: 120,
			postTmKg: 119,
			reason: 'Failed to complete target reps',
			style: 'HYPERTROPHY',
			createdAt: '2025-09-23T12:00:00.000Z'
		}

		expect(response.id).toBe('adjustment-123')
		expect(response.exerciseName).toBe('Bench Press')
		expect(response.style).toBe('HYPERTROPHY')
		expect(response.deltaKg).toBe(-1.0)
	})

	it('should validate TmEventSummary structure', () => {
		const summary: TmEventSummary = {
			exerciseId: 'exercise-456',
			exerciseName: 'Squat',
			totalDeltaKg: 7.5,
			averageDeltaKg: 2.5,
			adjustmentCount: 3,
			lastAdjustmentDate: '2025-09-23T12:00:00.000Z'
		}

		expect(summary.exerciseId).toBe('exercise-456')
		expect(summary.exerciseName).toBe('Squat')
		expect(summary.totalDeltaKg).toBe(7.5)
		expect(summary.adjustmentCount).toBe(3)
	})

	it('should support ProgramStyle enum values', () => {
		const standard: ProgramStyle = 'STANDARD'
		const hypertrophy: ProgramStyle = 'HYPERTROPHY'

		expect(standard).toBe('STANDARD')
		expect(hypertrophy).toBe('HYPERTROPHY')
	})

	it('should handle optional fields correctly', () => {
		const minimalRequest: CreateTmEventRequest = {
			exerciseId: 'exercise-123',
			weekNumber: 1,
			deltaKg: 0,
			preTmKg: 100,
			postTmKg: 100,
		}

		expect(minimalRequest.reason).toBeUndefined()
		expect(typeof minimalRequest.exerciseId).toBe('string')
		expect(typeof minimalRequest.weekNumber).toBe('number')
	})

	it('should validate delta calculation integrity', () => {
		const request: CreateTmEventRequest = {
			exerciseId: 'exercise-123',
			weekNumber: 2,
			deltaKg: 2.5,
			preTmKg: 97.5,
			postTmKg: 100,
		}

		// Verify the calculation: preTmKg + deltaKg = postTmKg
		expect(request.preTmKg + request.deltaKg).toBeCloseTo(request.postTmKg, 2)
	})
})
