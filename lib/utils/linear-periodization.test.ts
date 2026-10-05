import { startLinearPeriodization } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	lpNextLoadKg,
	lpPositionLabel,
	lpSetTargetLabel,
	lpSummary,
} from './linear-periodization'

const en = translatorFor('en', 'routines.linearBlock')
const es = translatorFor('es', 'routines.linearBlock')

const block = (step: number) => ({ ...startLinearPeriodization(100), step })

describe('linear periodization copy', () => {
	it('names a step by week on a weekly routine and by session on a rotation', () => {
		expect(lpPositionLabel(block(3), false, en)).toBe('Week 3 of 8')
		expect(lpPositionLabel(block(3), true, en)).toBe('Session 3 of 8')
		expect(lpPositionLabel(block(3), false, es)).toBe('Semana 3 de 8')
		expect(lpPositionLabel(block(3), true, es)).toBe('Sesión 3 de 8')
	})

	it('names the recovery step and the finished block', () => {
		const finished = { ...block(8), phase: 'FINISHED' as const }
		expect(lpPositionLabel(finished, false, en)).toBe('Block finished')
		expect(lpPositionLabel(finished, false, es)).toBe('Bloque terminado')
		const recovery = {
			...finished,
			phase: 'RECOVERY' as const,
			nextReferenceMaxKg: 105,
		}
		expect(lpPositionLabel(recovery, true, es)).toBe('Sesión de recuperación')
		expect(lpSetTargetLabel(recovery, 0, en)).toBe('5 reps')
		expect(lpSetTargetLabel(recovery, 2, en)).toBeNull()
		expect(lpNextLoadKg(recovery, 2.5)).toBe(70)
	})

	it('says each set target, the AMRAP included', () => {
		expect(lpSetTargetLabel(block(1), 0, en)).toBe('RIR 2–3')
		expect(lpSetTargetLabel(block(1), 2, en)).toBe('AMRAP · RIR 0')
		expect(lpSetTargetLabel(block(6), 2, es)).toBe('RIR 1–2')
	})

	it('sums the step up with its share, reference and load', () => {
		const options = { rotation: false, incrementKg: 2.5, unit: 'KG' as const }
		expect(lpSummary(block(1), { ...options, locale: 'en' }, en)).toBe(
			'Week 1 of 8 · 63% of 100 kg · 62.5 kg',
		)
		expect(lpSummary(block(4), { ...options, locale: 'es' }, es)).toBe(
			'Semana 4 de 8 · 72 % de 100 kg · 72,5 kg',
		)
	})
})
