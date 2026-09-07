import { describe, expect, it } from 'vitest'

import {
	formatRestTime,
	remainingSeconds,
	restProgress,
} from './rest-timer.utils'

describe('remainingSeconds', () => {
	it('counts down from an absolute deadline', () => {
		const now = 1_000_000
		expect(remainingSeconds(now + 90_000, now)).toBe(90)
		expect(remainingSeconds(now + 30_000, now)).toBe(30)
	})

	it('never reports 0 before the deadline is actually reached', () => {
		const now = 1_000_000
		expect(remainingSeconds(now + 1, now)).toBe(1)
		expect(remainingSeconds(now, now)).toBe(0)
	})

	it('clamps at 0 instead of going negative once rest is over', () => {
		const now = 1_000_000
		expect(remainingSeconds(now - 1, now)).toBe(0)
		expect(remainingSeconds(now - 600_000, now)).toBe(0)
	})

	it('is unaffected by how long the app spent backgrounded', () => {
		// The deadline is fixed, so a gap in ticks cannot make the timer drift:
		// reading it after a five-minute absence gives the same answer as a
		// reading taken continuously.
		const start = 1_000_000
		const deadline = start + 120_000
		expect(remainingSeconds(deadline, start + 300_000)).toBe(0)
		expect(remainingSeconds(deadline, start + 60_000)).toBe(60)
	})
})

describe('formatRestTime', () => {
	it('reads like a stopwatch', () => {
		expect(formatRestTime(90)).toBe('1:30')
		expect(formatRestTime(60)).toBe('1:00')
		expect(formatRestTime(9)).toBe('0:09')
		expect(formatRestTime(0)).toBe('0:00')
	})

	it('keeps counting past ten minutes without padding the minutes', () => {
		expect(formatRestTime(605)).toBe('10:05')
	})

	it('never renders NaN or a negative clock during a live session', () => {
		expect(formatRestTime(-5)).toBe('0:00')
		expect(formatRestTime(Number.NaN)).toBe('0:00')
		expect(formatRestTime(Number.POSITIVE_INFINITY)).toBe('0:00')
		expect(formatRestTime(12.7)).toBe('0:12')
	})
})

describe('restProgress', () => {
	it('runs from 0 at the start to 1 when rest is over', () => {
		expect(restProgress(120, 120)).toBe(0)
		expect(restProgress(60, 120)).toBe(0.5)
		expect(restProgress(0, 120)).toBe(1)
	})

	it('treats a missing rest duration as nothing to show', () => {
		expect(restProgress(0, 0)).toBe(0)
		expect(restProgress(10, -1)).toBe(0)
	})

	it('clamps a remaining value outside the total', () => {
		expect(restProgress(999, 120)).toBe(0)
		expect(restProgress(-10, 120)).toBe(1)
	})
})
