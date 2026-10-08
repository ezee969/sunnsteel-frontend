import { describe, expect, it } from 'vitest'

import { completesExercise, isExerciseDone } from './session-progress.utils'

const set = (
	setNumber: number,
	isCompleted: boolean,
	kind: 'WORKING' | 'WARMUP' | 'DROP' | 'OPTIONAL' = 'WORKING',
) => ({ setNumber, isCompleted, kind })

describe('isExerciseDone (LIVE-12)', () => {
	it('is done once every working and drop set is done', () => {
		expect(
			isExerciseDone([
				set(1, false, 'WARMUP'),
				set(2, true),
				set(3, true, 'DROP'),
				set(4, false, 'OPTIONAL'),
			]),
		).toBe(true)
	})

	it('is not done while a working set is open', () => {
		expect(isExerciseDone([set(1, true), set(2, false)])).toBe(false)
	})

	it('needs every set when none is required', () => {
		expect(
			isExerciseDone([set(1, true, 'WARMUP'), set(2, false, 'OPTIONAL')]),
		).toBe(false)
		expect(
			isExerciseDone([set(1, true, 'WARMUP'), set(2, true, 'OPTIONAL')]),
		).toBe(true)
	})

	it('is never done with nothing ticked', () => {
		expect(isExerciseDone([])).toBe(false)
		expect(isExerciseDone([set(1, false, 'WARMUP')])).toBe(false)
	})
})

describe('completesExercise (LIVE-21)', () => {
	it('is the tick on the last open working set', () => {
		expect(completesExercise([set(1, true), set(2, false)], 2)).toBe(true)
	})

	it('is not a tick that leaves a working set open', () => {
		expect(
			completesExercise([set(1, false), set(2, false), set(3, false)], 1),
		).toBe(false)
	})

	it('ignores a tick on an optional set once the work is done', () => {
		expect(
			completesExercise(
				[set(1, true), set(2, true), set(3, false, 'OPTIONAL')],
				3,
			),
		).toBe(false)
	})

	it('is the working tick even with a warm-up left unticked', () => {
		expect(completesExercise([set(1, false, 'WARMUP'), set(2, false)], 2)).toBe(
			true,
		)
	})

	it('counts an extra set like any other', () => {
		expect(
			completesExercise([set(1, true), set(2, true), set(3, false)], 3),
		).toBe(true)
	})
})
