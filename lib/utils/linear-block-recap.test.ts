import type {
	LinearBlockChange,
	LinearPeriodizationState,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import { describeLinearBlockChanges } from './linear-block-recap'

const en = translatorFor('en', 'workout.linearBlock')
const es = translatorFor('es', 'workout.linearBlock')
const enBlock = translatorFor('en', 'routines.linearBlock')
const esBlock = translatorFor('es', 'routines.linearBlock')

const state = (
	overrides: Partial<LinearPeriodizationState> = {},
): LinearPeriodizationState => ({
	referenceMaxKg: 100,
	phase: 'BLOCK',
	step: 3,
	cycle: 1,
	samples: [],
	...overrides,
})

const change = (
	before: LinearPeriodizationState,
	after: LinearPeriodizationState,
): LinearBlockChange => ({
	routineExerciseId: 'slot-bench',
	exerciseId: 'bench',
	exerciseName: 'Bench Press',
	minWeightIncrementKg: 2.5,
	before,
	after,
})

const samples = [1, 2, 3].flatMap(set => [
	{ sessionId: 's7', step: 7, set, loadKg: 80, reps: 6 },
	{ sessionId: 's8', step: 8, set, loadKg: 85, reps: 5 },
])

const kg = { rotation: false, unit: 'KG', locale: 'en' } as const

describe('8-week blocks in the recap (ROUT-17/ROUT-18)', () => {
	it('says a step was done and what the next workout loads', () => {
		expect(
			describeLinearBlockChanges(
				[change(state(), state({ step: 4 }))],
				kg,
				en,
				enBlock,
			),
		).toEqual([
			{
				routineExerciseId: 'slot-bench',
				exerciseName: 'Bench Press',
				kind: 'step',
				done: 'Week 3 of 8 done',
				next: 'Next: Week 4 of 8, 72% · 72.5 kg',
			},
		])
		const [spanish] = describeLinearBlockChanges(
			[change(state(), state({ step: 4 }))],
			{ rotation: true, unit: 'KG', locale: 'es' },
			es,
			esBlock,
		)
		expect(spanish).toMatchObject({
			done: 'Sesión 3 de 8 completada',
			next: 'Siguiente: Sesión 4 de 8, 72\u00a0% · 72,5 kg',
		})
	})

	it('says the recovery step was done and where the new block starts', () => {
		const [item] = describeLinearBlockChanges(
			[
				change(
					state({ phase: 'RECOVERY', step: 8 }),
					state({ referenceMaxKg: 105, step: 1, cycle: 2 }),
				),
			],
			kg,
			en,
			enBlock,
		)
		expect(item).toMatchObject({
			kind: 'recovery',
			done: 'Recovery step done · new block from 105 kg',
			next: 'Next: Week 1 of 8, 63% · 65 kg',
		})
		const [spanish] = describeLinearBlockChanges(
			[
				change(
					state({ phase: 'RECOVERY', step: 8 }),
					state({ referenceMaxKg: 105, step: 1, cycle: 2 }),
				),
			],
			{ rotation: false, unit: 'KG', locale: 'es' },
			es,
			esBlock,
		)
		expect(spanish).toMatchObject({
			done: 'Sesión de recuperación completada · nuevo bloque desde 105 kg',
		})
	})

	it('shows a finished block’s reference, estimate and the sets it came from', () => {
		const finished = change(
			state({ step: 8, samples: samples.filter(s => s.step === 7) }),
			state({
				phase: 'FINISHED',
				step: 8,
				samples,
				estimatedMaxKg: 100,
				finishedAt: '2026-10-05T10:00:00.000Z',
			}),
		)
		const [item] = describeLinearBlockChanges([finished], kg, en, enBlock)
		expect(item).toMatchObject({
			kind: 'finished',
			reference: 'Reference max used: 100 kg',
			estimate: 'Estimated 1RM (an estimate, not a tested max): 100 kg',
		})
		expect(item.kind === 'finished' && item.sets).toEqual([
			{ label: 'Week 7, set 1: 80 kg × 6, RIR 1.5', estimate: '100 kg' },
			{ label: 'Week 7, set 2: 80 kg × 6, RIR 1.5', estimate: '100 kg' },
			{ label: 'Week 7, set 3: 80 kg × 6, RIR 1.5', estimate: '100 kg' },
			{ label: 'Week 8, set 1: 85 kg × 5, RIR 1.5', estimate: '103.4 kg' },
			{ label: 'Week 8, set 2: 85 kg × 5, RIR 1.5', estimate: '103.4 kg' },
			{ label: 'Week 8, set 3: 85 kg × 5, RIR 1.5', estimate: '103.4 kg' },
		])
		const [spanish] = describeLinearBlockChanges(
			[finished],
			{ rotation: true, unit: 'KG', locale: 'es' },
			es,
			esBlock,
		)
		expect(spanish).toMatchObject({
			reference: 'Máximo de referencia usado: 100 kg',
			estimate: '1RM estimado (una estimación, no un máximo probado): 100 kg',
		})
		expect(spanish.kind === 'finished' && spanish.sets[3]).toEqual({
			label: 'Sesión 8, serie 1: 85 kg × 5, RIR 1,5',
			estimate: '103,4 kg',
		})
	})

	it('says plainly when the sets did not allow an estimate', () => {
		const finished = change(
			state({ step: 8 }),
			state({
				phase: 'FINISHED',
				step: 8,
				samples: samples.slice(0, 2),
				estimatedMaxKg: null,
			}),
		)
		const [item] = describeLinearBlockChanges([finished], kg, en, enBlock)
		expect(item).toMatchObject({
			estimate: 'Not enough sets at weeks 7 and 8 to estimate a new 1RM',
		})
		const [spanish] = describeLinearBlockChanges(
			[finished],
			{ rotation: false, unit: 'KG', locale: 'es' },
			es,
			esBlock,
		)
		expect(spanish).toMatchObject({
			estimate:
				'No hay suficientes series de las semanas 7 y 8 para estimar un nuevo 1RM',
		})
	})

	it('reads loads in pounds and leaves out anything that did not move a block', () => {
		const [item] = describeLinearBlockChanges(
			[change(state(), state({ step: 4 }))],
			{ rotation: false, unit: 'LB', locale: 'en' },
			en,
			enBlock,
		)
		expect(item).toMatchObject({ next: 'Next: Week 4 of 8, 72% · 159.84 lb' })
		expect(
			describeLinearBlockChanges(
				[
					change(
						state({ phase: 'FINISHED', step: 8 }),
						state({ phase: 'FINISHED', step: 8 }),
					),
				],
				kg,
				en,
				enBlock,
			),
		).toEqual([])
		expect(describeLinearBlockChanges(undefined, kg, en, enBlock)).toEqual([])
	})
})
