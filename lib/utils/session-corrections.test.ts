import { describe, expect, it } from 'vitest'

import {
	buildCorrectionRequest,
	changedSets,
	CORRECTION_EFFECTS,
	describeClosedReason,
	describeCorrectionWindow,
	describeKeptProgression,
	describeSetCorrection,
	describeSetValues,
	draftFromLogs,
} from './session-corrections'

const log = {
	id: 'a',
	weight: 100,
	reps: 5,
	rpe: 8,
	isCompleted: true,
}

describe('the correction window is stated, or says why it closed', () => {
	it('names when it closes and that another workout closes it sooner', () => {
		const text = describeCorrectionWindow({
			correctableUntil: '2026-09-25T10:00:00.000Z',
			closedReason: null,
		})
		expect(text).toMatch(/^You can correct this workout until /)
		expect(text).toContain('or until you start another one')
	})

	it('explains the reasons the owner can act on, and is silent on the rest', () => {
		expect(describeClosedReason('WINDOW_PASSED')).toBe(
			'Corrections close 48 hours after a workout ends.',
		)
		expect(describeClosedReason('LATER_SESSION')).toContain('another workout')
		expect(describeClosedReason('LIMIT_REACHED')).toContain('as many times')
		expect(describeClosedReason('NOT_LATEST')).toBeNull()
		expect(describeClosedReason('NOT_COMPLETED')).toBeNull()
	})

	it('says what a correction recalculates, removes and keeps', () => {
		expect(CORRECTION_EFFECTS).toContain('records')
		expect(CORRECTION_EFFECTS).toContain('reactions and comments')
		expect(CORRECTION_EFFECTS).toContain('values before and after')
	})
})

describe('set values read the same in the dialog and the trail', () => {
	it('names load, reps, RPE and an unticked set in the viewer unit', () => {
		expect(describeSetValues({ ...log, rpe: null }, 'KG')).toBe('100 kg × 5')
		expect(describeSetValues(log, 'LB')).toBe('220.46 lb × 5 · RPE 8')
		expect(
			describeSetValues(
				{ weight: null, reps: null, rpe: null, isCompleted: false },
				'KG',
			),
		).toBe('Bodyweight × no reps · not done')
	})

	it('describes one change from before to after', () => {
		expect(
			describeSetCorrection(
				{
					setLogId: 'a',
					exerciseId: 'bench',
					exerciseName: 'Bench Press',
					setNumber: 2,
					before: { weight: 1000, reps: 5, rpe: null, isCompleted: true },
					after: { weight: 100, reps: 5, rpe: null, isCompleted: true },
				},
				'KG',
			),
		).toBe('Bench Press, set 2: 1000 kg × 5 → 100 kg × 5')
	})

	it('names every exercise whose load change was kept', () => {
		expect(describeKeptProgression([])).toBeNull()
		expect(describeKeptProgression(['Squat'])).toContain('for Squat was kept')
		expect(describeKeptProgression(['Squat', 'Bench', 'Row'])).toContain(
			'Squat, Bench and Row',
		)
	})
})

describe('the draft becomes a request', () => {
	it('sends an untouched pound weight back exactly as stored', () => {
		const logs = [{ ...log, weight: 102.5 }]
		const draft = draftFromLogs(logs, 'LB')
		expect(draft.a.weight).toBe('225.97')
		const { sets, problems } = buildCorrectionRequest(draft, logs, 'LB')
		expect(problems).toEqual([])
		expect(sets[0].weight).toBe(102.5)
		expect(changedSets(sets, logs)).toEqual([])
	})

	it('turns a typed correction into kilograms and finds it changed', () => {
		const draft = draftFromLogs([log], 'KG')
		draft.a = { ...draft.a, weight: '10', rpe: '' }
		const { sets } = buildCorrectionRequest(draft, [log], 'KG')
		expect(changedSets(sets, [log])).toEqual([
			{ setLogId: 'a', weight: 10, reps: 5, rpe: null, isCompleted: true },
		])
	})

	it('names each row that cannot be sent, and why', () => {
		const logs = [log, { ...log, id: 'b' }, { ...log, id: 'c' }]
		const draft = draftFromLogs(logs, 'KG')
		draft.a = { ...draft.a, reps: '2.5' }
		draft.b = { ...draft.b, rpe: '11' }
		draft.c = { ...draft.c, reps: '' }
		const { problems } = buildCorrectionRequest(draft, logs, 'KG')
		expect(problems).toEqual([
			{ setLogId: 'a', message: 'Reps must be a whole number.' },
			{ setLogId: 'b', message: 'RPE must be between 0 and 10.' },
			{ setLogId: 'c', message: 'A done set needs at least one rep.' },
		])
	})

	it('lets an unticked set keep no reps', () => {
		const draft = draftFromLogs([log], 'KG')
		draft.a = { ...draft.a, reps: '', isCompleted: false }
		const { sets, problems } = buildCorrectionRequest(draft, [log], 'KG')
		expect(problems).toEqual([])
		expect(sets[0]).toMatchObject({ reps: null, isCompleted: false })
	})
})
