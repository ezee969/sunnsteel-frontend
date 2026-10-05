import { lpRecommendation, startLinearPeriodization } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	lpChangeLabel,
	lpRecommendationLine,
	lpRecoveryChoiceLabel,
	lpRecoveryLine,
	lpReferenceHint,
	lpSharedSetLabel,
	lpSharedTableNote,
	progressionSchemeLabel,
} from './routine-progression'

const en = translatorFor('en', 'routines.linearBlock')
const es = translatorFor('es', 'routines.linearBlock')
const enBuilder = translatorFor('en', 'routines.builder')
const esBuilder = translatorFor('es', 'routines.builder')

describe('progression scheme names', () => {
	it('names all four schemes and nothing it does not know', () => {
		expect(
			[
				'NONE',
				'DOUBLE_PROGRESSION',
				'DYNAMIC_DOUBLE_PROGRESSION',
				'LINEAR_PERIODIZATION',
			].map(scheme => progressionSchemeLabel(scheme, enBuilder)),
		).toEqual([
			'None',
			'Double Progression',
			'Dynamic Double Progression',
			'8-week block (LP)',
		])
		expect(progressionSchemeLabel('LINEAR_PERIODIZATION', esBuilder)).toBe(
			'Bloque LP de 8 semanas',
		)
		expect(progressionSchemeLabel('SOMETHING_NEW', enBuilder)).toBeNull()
	})
})

describe('what follows a finished block (ROUT-19)', () => {
	it('states the rule that pre-filled the reference, with its numbers', () => {
		const line = (estimate: number | null, t = en, locale = 'en' as const) =>
			lpRecommendationLine(lpRecommendation(100, estimate, 2.5), locale, t)
		expect(line(104)).toBe(
			'The estimate is 2.5% or more above the reference, so a heavier block is pre-filled, at most 5% over it.',
		)
		expect(line(101)).toBe(
			'The estimate is within 2.5% of the reference, so the same reference is pre-filled.',
		)
		expect(line(null)).toBe(
			'Without an estimate, the same reference is pre-filled.',
		)
		expect(line(90)).toBe(
			'The estimate is more than 2.5% below the reference, so a block at the estimate is pre-filled.',
		)
		expect(lpRecommendationLine(lpRecommendation(100, 90, 2.5), 'es', es)).toBe(
			'La estimación está más de 2,5 % por debajo de la referencia, así que se propone un bloque en la estimación.',
		)
	})

	it('never names a cause', () => {
		for (const t of [en, es]) {
			for (const estimate of [110, 101, null, 90]) {
				const line = lpRecommendationLine(
					lpRecommendation(100, estimate, 2.5),
					'en',
					t,
				)
				expect(line).not.toMatch(/because|fatigue|recover|porque|fatiga/i)
			}
		}
	})

	it('signs the change and compares a typed reference', () => {
		expect(lpChangeLabel(0.04, 'en')).toBe('+4%')
		expect(lpChangeLabel(-0.1, 'es')).toBe('-10 %')
		expect(lpReferenceHint(100, 102.5, en)).toBe('Heavier than the last block')
		expect(lpReferenceHint(100, 100, es)).toBe('Igual que el último bloque')
		expect(lpReferenceHint(100, 90, en)).toBe('Lighter than the last block')
	})

	it('words the recovery step, before and once chosen', () => {
		expect(lpRecoveryChoiceLabel(100, 'KG', 'en', en)).toBe(
			'Recovery step first: 2 × 5 at 70% of 100 kg',
		)
		const recovery = {
			...startLinearPeriodization(100),
			phase: 'RECOVERY' as const,
			nextReferenceMaxKg: 105,
		}
		expect(lpRecoveryLine(recovery, 2.5, 'KG', 'en', en)).toBe(
			'Recovery step: 2 × 5 at 70 kg, then a new block from 105 kg',
		)
		expect(lpRecoveryLine(recovery, 2.5, 'KG', 'es', es)).toBe(
			'Sesión de recuperación: 2 × 5 con 70 kg, luego un bloque nuevo desde 105 kg',
		)
	})

	it('reads a shared block as shares of the reader’s own max', () => {
		expect(lpSharedSetLabel(2, 'en', en)).toBe(
			'63% of your own max · AMRAP · RIR 0',
		)
		expect(lpSharedSetLabel(0, 'es', es)).toBe(
			'63 % de tu propio máximo · RIR 2–3',
		)
		expect(lpSharedTableNote('en', en)).toBe(
			'Week 1 of the block shown; the share rises each week, to 85% in week 8.',
		)
	})
})
