import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	describeTrainingBlockSource,
	formatTrainingBlockRange,
	trainingBlockChangeNote,
	trainingBlockStateLabel,
} from './routine-training-blocks'

const en = translatorFor('en', 'routines.trainingBlocks')
const es = translatorFor('es', 'routines.trainingBlocks')

describe('routine training blocks', () => {
	it('formats their date range without shifting calendar dates', () => {
		expect(formatTrainingBlockRange('2026-09-01', '2026-10-05', 'en')).toBe(
			'Sep 1, 2026 – Oct 5, 2026',
		)
	})

	it('labels every server-derived state and its editing rule', () => {
		expect(trainingBlockStateLabel('FUTURE', en)).toBe('Upcoming')
		expect(trainingBlockStateLabel('ACTIVE', en)).toBe('In progress')
		expect(trainingBlockStateLabel('COMPLETE', en)).toBe('Complete')
		expect(trainingBlockChangeNote('ACTIVE', en)).toContain('new revision')
		expect(trainingBlockChangeNote('COMPLETE', en)).toContain('read-only')
	})

	it('keeps saved-version provenance useful after the source is deleted', () => {
		expect(
			describeTrainingBlockSource(
				{
					kind: 'SAVED_VERSION',
					versionId: null,
					versionNumber: 7,
					versionName: 'Volume base',
				},
				en,
			),
		).toBe('Based on Volume base')
		expect(
			describeTrainingBlockSource(
				{
					kind: 'CURRENT_ROUTINE',
					versionId: null,
					versionNumber: null,
					versionName: null,
				},
				en,
			),
		).toBe('Based on the routine at creation')
	})

	it('says the same in Spanish (I18N-03)', () => {
		expect(formatTrainingBlockRange('2026-09-01', '2026-10-05', 'es')).toBe(
			'1 sept 2026 – 5 oct 2026',
		)
		expect(trainingBlockStateLabel('FUTURE', es)).toBe('Próximo')
		expect(trainingBlockStateLabel('ACTIVE', es)).toBe('En curso')
		expect(trainingBlockStateLabel('COMPLETE', es)).toBe('Completado')
		expect(trainingBlockChangeNote('ACTIVE', es)).toContain('revisión')
		expect(
			describeTrainingBlockSource(
				{
					kind: 'CURRENT_ROUTINE',
					versionId: null,
					versionNumber: null,
					versionName: null,
				},
				es,
			),
		).toBe('Basado en la rutina al crearlo')
	})
})
