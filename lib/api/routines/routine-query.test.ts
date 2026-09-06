import { describe, expect, it } from 'vitest'

import {
	buildRoutineQueryString,
	routineQueryKeys,
	serializeRoutineFilters,
} from './routine-query'

// These helpers decide the TanStack Query cache keys. TD-01 was a prefetch that
// wrote to keys nobody read; pinning the serialisation is what stops a silent
// repeat of that.
describe('serializeRoutineFilters', () => {
	it('returns the no-filters sentinel for undefined and for an empty object', () => {
		expect(serializeRoutineFilters()).toBe('nofilters')
		expect(serializeRoutineFilters({})).toBe('nofilters')
	})

	it('ignores undefined values rather than serialising them', () => {
		expect(serializeRoutineFilters({ isFavorite: undefined })).toBe('nofilters')
	})

	it('is order-independent: the same filters always produce the same key', () => {
		const a = serializeRoutineFilters({ isFavorite: true, isCompleted: false })
		const b = serializeRoutineFilters({ isCompleted: false, isFavorite: true })
		expect(a).toBe(b)
		expect(a).toBe('isCompleted:false|isFavorite:true')
	})

	it('sorts array values so member order cannot fork the cache key', () => {
		expect(serializeRoutineFilters({ include: ['b', 'a'] })).toBe(
			serializeRoutineFilters({ include: ['a', 'b'] }),
		)
	})

	it('distinguishes false from absent', () => {
		expect(serializeRoutineFilters({ isFavorite: false })).not.toBe('nofilters')
	})
})

describe('buildRoutineQueryString', () => {
	it('returns an empty string when there is nothing to send', () => {
		expect(buildRoutineQueryString()).toBe('')
		expect(buildRoutineQueryString({})).toBe('')
	})

	it('serialises booleans explicitly, including false', () => {
		expect(buildRoutineQueryString({ isFavorite: false })).toBe(
			'?isFavorite=false',
		)
	})

	it('joins include[] with commas and omits it when empty', () => {
		expect(buildRoutineQueryString({ include: ['days', 'exercises'] })).toBe(
			'?include=days%2Cexercises',
		)
		expect(buildRoutineQueryString({ include: [] })).toBe('')
	})

	it('accepts week 0 (a falsy number that must still be sent)', () => {
		expect(buildRoutineQueryString({ week: 0 })).toBe('?week=0')
	})
})

describe('routineQueryKeys', () => {
	it('shares the ["routines"] prefix between list and detail', () => {
		expect(routineQueryKeys.list()[0]).toBe('routines')
		expect(routineQueryKeys.detail('abc')[0]).toBe('routines')
	})

	it('derives the list key from the filter serialisation', () => {
		expect(routineQueryKeys.list({ isFavorite: true })).toEqual([
			'routines',
			'isFavorite:true',
		])
	})
})
