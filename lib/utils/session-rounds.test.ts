import type { SetKind } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	describeRound,
	nextSetAfter,
	type RoundSlot,
	roundStatus,
	trainingSequence,
} from './session-rounds'

const slot = (
	id: string,
	kinds: SetKind[],
	linkedToNext = false,
	completed: number[] = [],
): RoundSlot => ({
	exerciseId: id,
	exerciseName: id.toUpperCase(),
	linkedToNext,
	sets: kinds.map((kind, i) => ({
		setNumber: i + 1,
		kind,
		isCompleted: completed.includes(i + 1),
	})),
})
const W: SetKind = 'WORKING'
const U: SetKind = 'WARMUP'
const order = (slots: RoundSlot[]) =>
	trainingSequence(slots).map(t => `${t.exerciseId}${t.setNumber}`)

describe('rounds in a workout (LIVE-14)', () => {
	it('runs a superset round by round, after the singles before it', () => {
		const day = [slot('x', [W, W]), slot('a', [W, W], true), slot('b', [W, W])]
		expect(order(day)).toEqual(['x1', 'x2', 'a1', 'b1', 'a2', 'b2'])
	})

	it('puts every member warm-up first, then the rounds', () => {
		const day = [slot('a', [U, W, W], true), slot('b', [U, W])]
		expect(order(day)).toEqual(['a1', 'b1', 'a2', 'b2', 'a3'])
	})

	it('drops a member with fewer sets out of the later rounds', () => {
		const day = [
			slot('a', [W], true),
			slot('b', [W, W, W], true),
			slot('c', [W, W]),
		]
		expect(order(day)).toEqual(['a1', 'b1', 'c1', 'b2', 'c2', 'b3'])
	})

	it('points to the partner after a set, and to the next round after the last', () => {
		const day = [slot('a', [W, W], true), slot('b', [W, W])]
		expect(nextSetAfter(day, { exerciseId: 'a', setNumber: 1 })).toMatchObject({
			exerciseId: 'b',
			setNumber: 1,
		})
		expect(nextSetAfter(day, { exerciseId: 'b', setNumber: 1 })).toMatchObject({
			exerciseId: 'a',
			setNumber: 2,
		})
	})

	it('goes back to a skipped set, and has nothing left at the end', () => {
		const day = [slot('a', [W, W], true, [2]), slot('b', [W, W], false, [1, 2])]
		expect(nextSetAfter(day, { exerciseId: 'a', setNumber: 2 })).toMatchObject({
			exerciseId: 'a',
			setNumber: 1,
		})
		expect(nextSetAfter(day, { exerciseId: 'a', setNumber: 1 })).toBeNull()
	})

	it('states the round in progress and when every round is done', () => {
		const day = [
			slot('a', [U, W, W], true, [1, 2]),
			slot('b', [W, W], false, [1]),
		]
		const status = roundStatus(day, 1)!
		expect(status.label).toBe('Superset A2')
		expect(describeRound(status)).toBe('Round 2 of 2')
		const done = [
			slot('a', [W, W], true, [1, 2]),
			slot('b', [W, W], false, [1, 2]),
		]
		expect(describeRound(roundStatus(done, 0)!)).toBe('All 2 rounds done')
		expect(roundStatus([slot('x', [W])], 0)).toBeNull()
	})
})
