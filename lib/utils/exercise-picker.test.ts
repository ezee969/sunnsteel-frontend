import type { Exercise } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	applyStarChange,
	groupPickerExercises,
	RECENT_EXERCISES_LIMIT,
} from './exercise-picker'

const exercise = (id: string): Exercise =>
	({ id, name: id }) as unknown as Exercise

const catalog = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(exercise)
const ids = (list: Exercise[]) => list.map(item => item.id)
const trained = (exerciseId: string, day: number) => ({
	exerciseId,
	lastPerformedAt: `2026-09-${String(day).padStart(2, '0')}T10:00:00.000Z`,
})

describe('groupPickerExercises', () => {
	it('keeps catalog order under one label without stars or history', () => {
		const groups = groupPickerExercises(catalog, {})
		expect(groups).toHaveLength(1)
		expect(groups[0].label).toBe('All exercises')
		expect(ids(groups[0].exercises)).toEqual(ids(catalog))
	})

	it('puts stars first, then unstarred recent exercises, each once', () => {
		const groups = groupPickerExercises(catalog, {
			starred: ['c', 'a'],
			recent: [trained('a', 3), trained('d', 9), trained('b', 5)],
		})
		expect(groups.map(group => [group.key, ids(group.exercises)])).toEqual([
			['starred', ['c', 'a']],
			['recent', ['d', 'b']],
			['other', ['e', 'f', 'g', 'h']],
		])
		expect(groups[2].label).toBe('Other exercises')
	})

	it('caps recent exercises and returns the overflow to the rest', () => {
		const recent = ['a', 'b', 'c', 'd', 'e', 'f'].map((id, index) =>
			trained(id, 20 - index),
		)
		const groups = groupPickerExercises(catalog, { recent })
		expect(ids(groups[0].exercises)).toHaveLength(RECENT_EXERCISES_LIMIT)
		expect(ids(groups[1].exercises)).toEqual(['f', 'g', 'h'])
	})

	it('keeps a pending recent group while history loads', () => {
		const groups = groupPickerExercises(catalog, {
			starred: ['b'],
			recentPending: true,
		})
		expect(
			groups.map(group => [
				group.key,
				group.pending ?? false,
				ids(group.exercises),
			]),
		).toEqual([
			['starred', false, ['b']],
			['recent', true, []],
			['other', false, ['a', 'c', 'd', 'e', 'f', 'g', 'h']],
		])
		expect(groups[2].label).toBe('Other exercises')
	})

	it('skips excluded and unknown exercises', () => {
		const groups = groupPickerExercises(catalog, {
			starred: ['missing', 'b'],
			recent: [trained('c', 1)],
			exclude: new Set(['b', 'h']),
		})
		expect(groups.map(group => [group.key, ids(group.exercises)])).toEqual([
			['recent', ['c']],
			['other', ['a', 'd', 'e', 'f', 'g']],
		])
	})
})

describe('applyStarChange', () => {
	it('adds a star to the front and removes it without duplicates', () => {
		const current = {
			items: [{ exerciseId: 'a', starredAt: '2026-09-01T00:00:00.000Z' }],
		}
		const now = '2026-09-14T00:00:00.000Z'
		expect(applyStarChange(current, 'b', true, now).items).toEqual([
			{ exerciseId: 'b', starredAt: now },
			current.items[0],
		])
		expect(applyStarChange(current, 'a', true, now).items).toEqual([
			{ exerciseId: 'a', starredAt: now },
		])
		expect(applyStarChange(current, 'a', false, now).items).toEqual([])
		expect(applyStarChange(undefined, 'a', false, now).items).toEqual([])
	})
})
