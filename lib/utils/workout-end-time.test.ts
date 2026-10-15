import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	chosenEnd,
	describeEndTime,
	describeEndTimeProblem,
	finishTimeline,
	fromDateTimeLocal,
	toDateTimeLocal,
} from './workout-end-time'

const en = translatorFor('en', 'workout.endTime')
const es = translatorFor('es', 'workout.endTime')

// Local times, as the field reads them.
const at = (hour: number, minute: number, second = 0) =>
	new Date(2026, 9, 15, hour, minute, second)

describe('where a workout in progress stands (LIVE-24)', () => {
	const startedAt = at(10, 0).toISOString()
	const setLogs = [
		{ isCompleted: true, completedAt: at(11, 20, 40).toISOString() },
		{ isCompleted: true, completedAt: at(11, 5).toISOString() },
		{ isCompleted: false, completedAt: at(11, 59).toISOString() },
	]

	it('ends no earlier than the last completed set, and asks after a pause', () => {
		const timeline = finishTimeline(
			{ startedAt, lastActivityAt: at(11, 22).toISOString(), setLogs },
			at(19, 30),
		)
		expect(timeline.earliest).toEqual(at(11, 20, 40))
		expect(timeline.lastSet).toEqual(at(11, 20, 40))
		expect(timeline.lastActivity).toEqual(at(11, 22))
		expect(timeline.asks).toBe(true)
	})

	it('finishes at once when the last set was moments ago', () => {
		const timeline = finishTimeline({ startedAt, setLogs }, at(11, 35))
		expect(timeline.lastActivity).toEqual(at(11, 20, 40))
		expect(timeline.asks).toBe(false)
	})

	it('starts from the start when nothing was done', () => {
		const timeline = finishTimeline({ startedAt }, at(10, 10))
		expect(timeline.earliest).toEqual(at(10, 0))
		expect(timeline.lastSet).toBeNull()
		expect(timeline.asks).toBe(false)
	})
})

describe('the field holds a local date and time to the minute', () => {
	it('round-trips', () => {
		expect(toDateTimeLocal(at(9, 5, 59))).toBe('2026-10-15T09:05')
		expect(fromDateTimeLocal('2026-10-15T09:05')).toEqual(at(9, 5))
	})

	it('names nothing for an empty or impossible value', () => {
		expect(fromDateTimeLocal('')).toBeNull()
		expect(fromDateTimeLocal('2026-02-30T10:00')).toBeNull()
	})
})

describe('a chosen minute stands for an end between the bounds', () => {
	const earliest = at(11, 20, 40)
	const latest = at(19, 30, 15)

	it('takes a minute inside them as it is', () => {
		expect(chosenEnd('2026-10-15T11:45', earliest, latest)).toEqual({
			endedAt: at(11, 45),
		})
	})

	it('reads the minute of the earliest end as that end, and takes the last minute', () => {
		expect(chosenEnd('2026-10-15T11:20', earliest, latest)).toEqual({
			endedAt: earliest,
		})
		expect(chosenEnd('2026-10-15T19:30', earliest, latest)).toEqual({
			endedAt: at(19, 30),
		})
	})

	it('names what is wrong outside them', () => {
		expect(chosenEnd('2026-10-15T11:19', earliest, latest)).toEqual({
			problem: 'beforeEarliest',
		})
		expect(chosenEnd('2026-10-15T19:31', earliest, latest)).toEqual({
			problem: 'afterLatest',
		})
		expect(chosenEnd('', earliest, latest)).toEqual({ problem: 'invalid' })
	})
})

describe('the end time is said in both languages', () => {
	const input = {
		startedAt: at(10, 0).toISOString(),
		lastSet: at(11, 20, 40),
		value: '2026-10-15T11:30',
	}

	it('names the last set and the length the end makes', () => {
		const english = describeEndTime(input, 'en', en)
		expect(english).toContain('Last set at')
		expect(english).toContain('1h 30m')
		expect(describeEndTime(input, 'es', es)).toContain('Última serie a las')
		expect(describeEndTime({ ...input, value: '' }, 'en', en)).not.toContain(
			'·',
		)
		// Minutes only, as the field holds them.
		expect(
			describeEndTime(
				{ ...input, startedAt: at(10, 0, 40).toISOString() },
				'en',
				en,
			),
		).toContain('1h 29m')
		const started = describeEndTime({ ...input, lastSet: null }, 'en', en)
		expect(started).toMatch(/^Started at .* · 1h 30m$/)
		expect(describeEndTime({ ...input, lastSet: null }, 'es', es)).toMatch(
			/^Empezó a las /,
		)
	})

	it('says why an end cannot be used, finishing or correcting', () => {
		const bounds = { earliest: at(11, 20), latest: at(19, 30) }
		expect(
			describeEndTimeProblem(
				'afterLatest',
				{ ...bounds, finishing: true },
				'en',
				en,
			),
		).toBe('A workout can’t end in the future.')
		expect(
			describeEndTimeProblem(
				'afterLatest',
				{ ...bounds, finishing: false },
				'es',
				es,
			),
		).toMatch(/^Solo puede ser antes de las /)
		expect(
			describeEndTimeProblem(
				'beforeEarliest',
				{ ...bounds, finishing: true },
				'en',
				en,
			),
		).toMatch(/^A workout ends after its last set, at /)
		expect(
			describeEndTimeProblem(
				'invalid',
				{ ...bounds, finishing: true },
				'es',
				es,
			),
		).toBe('Ingresa una fecha y una hora.')
	})
})
