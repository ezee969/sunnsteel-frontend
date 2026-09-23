import { describe, expect, it } from 'vitest'

import {
	describeTrainingBlockSource,
	formatTrainingBlockRange,
	trainingBlockChangeNote,
	trainingBlockStateLabel,
} from './routine-training-blocks'

describe('routine training blocks', () => {
	it('formats their date range without shifting calendar dates', () => {
		expect(formatTrainingBlockRange('2026-09-01', '2026-10-05')).toBe(
			'Sep 1, 2026 – Oct 5, 2026',
		)
	})

	it('labels every server-derived state and its editing rule', () => {
		expect(trainingBlockStateLabel('FUTURE')).toBe('Upcoming')
		expect(trainingBlockStateLabel('ACTIVE')).toBe('In progress')
		expect(trainingBlockStateLabel('COMPLETE')).toBe('Complete')
		expect(trainingBlockChangeNote('ACTIVE')).toContain('new revision')
		expect(trainingBlockChangeNote('COMPLETE')).toContain('read-only')
	})

	it('keeps saved-version provenance useful after the source is deleted', () => {
		expect(
			describeTrainingBlockSource({
				kind: 'SAVED_VERSION',
				versionId: null,
				versionNumber: 7,
				versionName: 'Volume base',
			}),
		).toBe('Based on Volume base')
		expect(
			describeTrainingBlockSource({
				kind: 'CURRENT_ROUTINE',
				versionId: null,
				versionNumber: null,
				versionName: null,
			}),
		).toBe('Based on the routine at creation')
	})
})
