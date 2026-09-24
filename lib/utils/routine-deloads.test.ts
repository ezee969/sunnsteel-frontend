import { describe, expect, it } from 'vitest'

import {
	DELOAD_LENGTHS,
	deloadDateProblem,
	deloadEndDate,
	describeDeloadInForce,
	describeDeloadLength,
	describeDeloadOptions,
	describeDeloadRange,
	describeDeloadSource,
	firstFreeDate,
	planLabel,
} from './routine-deloads'

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
		expect(describeDeloadLength(7)).toBe('1 week')
		expect(describeDeloadLength(1)).toBe('1 day')
		expect(describeDeloadLength(10)).toBe('10 days')
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
			describeDeloadOptions({ loadReductionPercent: 10, setMode: 'HALF' }),
		).toBe('10% lighter · first half of the sets')
		expect(
			describeDeloadOptions({ loadReductionPercent: 0, setMode: 'HALF' }),
		).toBe('Same loads · first half of the sets')
		expect(
			describeDeloadSource({
				kind: 'TRAINING_BLOCK',
				trainingBlockId: 's',
				trainingBlockName: 'Strength',
			}),
		).toBe('Lightens the training block “Strength”')
		expect(
			describeDeloadSource({
				kind: 'BASELINE',
				trainingBlockId: null,
				trainingBlockName: null,
			}),
		).toBe('Lightens the routine')
	})

	it('names a deload ended on its first day by that day', () => {
		expect(
			describeDeloadRange({ startDate: '2026-10-05', endDate: '2026-10-04' }),
		).toBe('Oct 5, 2026 · ended on its first day')
		expect(
			describeDeloadRange({ startDate: '2026-10-05', endDate: '2026-10-11' }),
		).toContain('Oct 11, 2026')
	})

	it('explains the days in force and when the plan returns', () => {
		const line = describeDeloadInForce({ endDate: '2026-10-11' }, null)
		expect(line).toContain('until Oct 11, 2026')
		expect(line).toContain("loads don't progress")
		expect(line).toContain('The routine returns on Oct 12, 2026')
		expect(
			describeDeloadInForce({ endDate: '2026-10-11' }, 'Strength'),
		).toContain('The training block “Strength” returns')
	})

	it('labels the plan a date or workout trains', () => {
		expect(planLabel({})).toBeNull()
		expect(planLabel({ deload: true })).toBe('Deload')
		expect(planLabel({ trainingBlockName: 'Strength' })).toBe(
			'Training block · Strength',
		)
		expect(planLabel({ trainingBlockName: 'Strength', deload: true })).toBe(
			'Training block · Strength · Deload',
		)
	})
})
