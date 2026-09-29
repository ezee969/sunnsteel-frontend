import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import { formatDaysPerWeek, formatExerciseCount } from './routine-format'

const en = translatorFor('en', 'routines.format')
const es = translatorFor('es', 'routines.format')

describe('formatDaysPerWeek', () => {
	it.each([
		{ days: 0, expected: '0 days/week' },
		{ days: 1, expected: '1 day/week' },
		{ days: 4, expected: '4 days/week' },
	])('formats $days as $expected', ({ days, expected }) => {
		expect(formatDaysPerWeek(days, en)).toBe(expected)
	})

	it('says the same in Spanish (I18N-03)', () => {
		expect(formatDaysPerWeek(0, es)).toBe('0 días/semana')
		expect(formatDaysPerWeek(1, es)).toBe('1 día/semana')
		expect(formatDaysPerWeek(4, es)).toBe('4 días/semana')
	})
})

describe('formatExerciseCount', () => {
	it.each([
		{ count: 0, expected: '0 exercises' },
		{ count: 1, expected: '1 exercise' },
		{ count: 5, expected: '5 exercises' },
	])('formats $count as $expected', ({ count, expected }) => {
		expect(formatExerciseCount(count, en)).toBe(expected)
	})

	it('says the same in Spanish (I18N-03)', () => {
		expect(formatExerciseCount(0, es)).toBe('0 ejercicios')
		expect(formatExerciseCount(1, es)).toBe('1 ejercicio')
		expect(formatExerciseCount(5, es)).toBe('5 ejercicios')
	})
})
