import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	DELOAD_LENGTHS,
	deloadDateProblem,
	deloadDateProblemMessage,
	deloadEndDate,
	describeDeloadInForce,
	describeDeloadLength,
	describeDeloadOptions,
	describeDeloadRange,
	describeDeloadSource,
	firstFreeDate,
	planLabel,
} from './routine-deloads'

const en = translatorFor('en', 'routines.deloads')
const es = translatorFor('es', 'routines.deloads')

const TODAY = '2026-10-05'
const block = { id: 'block-1', startDate: '2026-10-01', endDate: '2026-10-14' }
const problem = (startDate: string, endDate: string, extra = {}) =>
	deloadDateProblem({
		startDate,
		endDate,
		today: TODAY,
		deloads: [],
		blocks: [block],
		...extra,
	})

describe('deload copy and date rules (ROUT-16)', () => {
	it('counts both ends of its length and offers one to two weeks', () => {
		expect(deloadEndDate('2026-10-05', 7)).toBe('2026-10-11')
		expect(deloadEndDate('2026-10-05', 1)).toBe('2026-10-05')
		expect(DELOAD_LENGTHS.at(0)).toBe(1)
		expect(DELOAD_LENGTHS.at(-1)).toBe(14)
		expect(describeDeloadLength(7, en)).toBe('1 week')
		expect(describeDeloadLength(1, en)).toBe('1 day')
		expect(describeDeloadLength(10, en)).toBe('10 days')
	})

	it('mirrors the server: today or later, no overlap, one plan', () => {
		expect(problem('2026-10-05', '2026-10-11')).toBeNull()
		expect(problem('2026-10-04', '2026-10-06')).toBe('PAST')
		expect(problem('2026-10-12', '2026-10-16')).toBe('CROSSES_BLOCK')
		expect(problem('2026-10-15', '2026-10-21')).toBeNull()
		expect(
			problem('2026-10-05', '2026-10-07', {
				deloads: [{ startDate: '2026-10-07', endDate: '2026-10-09' }],
			}),
		).toBe('OVERLAPS_DELOAD')
		// One ended on its first day holds no dates any more.
		expect(
			problem('2026-10-05', '2026-10-07', {
				deloads: [{ startDate: '2026-10-05', endDate: '2026-10-04' }],
			}),
		).toBeNull()
	})

	it('opens on the first date no deload holds', () => {
		expect(firstFreeDate(TODAY, [])).toBe(TODAY)
		expect(
			firstFreeDate(TODAY, [
				{ startDate: '2026-10-03', endDate: '2026-10-09' },
				{ startDate: '2026-10-10', endDate: '2026-10-12' },
			]),
		).toBe('2026-10-13')
		// An ended deload no longer holds its dates.
		expect(
			firstFreeDate(TODAY, [
				{ startDate: '2026-10-05', endDate: '2026-10-04' },
			]),
		).toBe(TODAY)
	})

	it('says what it changes and where it came from', () => {
		expect(
			describeDeloadOptions({ loadReductionPercent: 10, setMode: 'HALF' }, en),
		).toBe('10% lighter · first half of the sets')
		expect(
			describeDeloadOptions({ loadReductionPercent: 0, setMode: 'HALF' }, en),
		).toBe('Same loads · first half of the sets')
		expect(
			describeDeloadSource(
				{
					kind: 'TRAINING_BLOCK',
					trainingBlockId: 's',
					trainingBlockName: 'Strength',
				},
				en,
			),
		).toBe('Lightens the training block “Strength”')
		expect(
			describeDeloadSource(
				{ kind: 'BASELINE', trainingBlockId: null, trainingBlockName: null },
				en,
			),
		).toBe('Lightens the routine')
	})

	it('names a deload ended on its first day by that day', () => {
		expect(
			describeDeloadRange(
				{ startDate: '2026-10-05', endDate: '2026-10-04' },
				'en',
				en,
			),
		).toBe('Oct 5, 2026 · ended on its first day')
		expect(
			describeDeloadRange(
				{ startDate: '2026-10-05', endDate: '2026-10-11' },
				'en',
				en,
			),
		).toContain('Oct 11, 2026')
	})

	it('explains the days in force and when the plan returns', () => {
		const line = describeDeloadInForce(
			{ endDate: '2026-10-11' },
			null,
			'en',
			en,
		)
		expect(line).toContain('until Oct 11, 2026')
		expect(line).toContain("loads don't progress")
		expect(line).toContain('The routine returns on Oct 12, 2026')
		expect(
			describeDeloadInForce({ endDate: '2026-10-11' }, 'Strength', 'en', en),
		).toContain('The training block “Strength” returns')
	})

	it('labels the plan a date or workout trains', () => {
		expect(planLabel({}, en)).toBeNull()
		expect(planLabel({ deload: true }, en)).toBe('Deload')
		expect(planLabel({ trainingBlockName: 'Strength' }, en)).toBe(
			'Training block · Strength',
		)
		expect(planLabel({ trainingBlockName: 'Strength', deload: true }, en)).toBe(
			'Training block · Strength · Deload',
		)
	})

	it('names the date problems it mirrors from the server', () => {
		expect(deloadDateProblemMessage('PAST', en)).toMatch(/today or later/)
	})

	it('says the same in Spanish (I18N-03)', () => {
		expect(describeDeloadLength(7, es)).toBe('1 semana')
		expect(describeDeloadLength(14, es)).toBe('2 semanas')
		expect(describeDeloadLength(1, es)).toBe('1 día')
		expect(describeDeloadLength(2, es)).toBe('2 días')
		expect(
			describeDeloadOptions({ loadReductionPercent: 10, setMode: 'HALF' }, es),
		).toBe('10% más ligero · la primera mitad de las series')
		expect(planLabel({ deload: true }, es)).toBe('Descarga')
		expect(
			describeDeloadInForce({ endDate: '2026-10-11' }, 'Strength', 'es', es),
		).toContain('El bloque de entrenamiento “Strength” vuelve')
		expect(deloadDateProblemMessage('PAST', es)).toMatch(/hoy o después/)
	})
})
