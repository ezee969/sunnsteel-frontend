import type { ExercisePlateau } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	describeClosestShare,
	describePlateauCount,
	describePlateauRule,
	formatPlateauSet,
	formatSpan,
	getPlateauEmptyState,
	getPlateauSessionLabel,
	PLATEAU_SESSION_OPTIONS,
} from './plateaus'

const en = translatorFor('en', 'planning.plateaus')
const es = translatorFor('es', 'planning.plateaus')

const thresholds = {
	windowDays: 56,
	minSessions: 4,
	minDaysSinceBest: 21,
	recentDays: 21,
}

const plateau = (
	overrides: Partial<ExercisePlateau> = {},
): ExercisePlateau => ({
	exerciseId: 'bench',
	exerciseName: 'Bench Press',
	best: {
		weightKg: 100,
		reps: 5,
		estimated1rmKg: 116.7,
		achievedAt: '2026-08-10T10:00:00.000Z',
	},
	countedSince: '2026-08-10T10:00:00.000Z',
	sessionsWithoutNewBest: 5,
	closest: {
		weightKg: 97.5,
		reps: 5,
		estimated1rmKg: 113.8,
		performedAt: '2026-09-12T10:00:00.000Z',
	},
	closestRatio: 0.975,
	lastPerformedAt: '2026-09-12T10:00:00.000Z',
	...overrides,
})

const date = (iso: string) => iso.slice(0, 10)

describe('plateau copy', () => {
	it('states every threshold and disclaims diagnosis', () => {
		expect(formatSpan(21, en)).toBe('3 weeks')
		expect(formatSpan(7, en)).toBe('1 week')
		expect(formatSpan(10, en)).toBe('10 days')
		expect(describePlateauRule(thresholds, en)).toBe(
			'Lifts trained at least 4 times since their current best, with that best at least 3 weeks old and the lift trained in the last 3 weeks, looking back 8 weeks. These are your numbers, not a diagnosis.',
		)
	})

	it('describes the count from the best or from the window start', () => {
		expect(describePlateauCount(plateau(), thresholds, date, en)).toEqual({
			headline: 'No new best in 5 sessions',
			since: 'since your best on 2026-08-10',
		})
		expect(
			describePlateauCount(
				plateau({
					sessionsWithoutNewBest: 1,
					countedSince: '2026-07-20T12:00:00.000Z',
					best: { ...plateau().best, achievedAt: '2026-02-01T10:00:00.000Z' },
				}),
				thresholds,
				date,
				en,
			),
		).toEqual({
			headline: 'No new best in 1 session',
			since: 'in the last 8 weeks; best set on 2026-02-01',
		})
	})

	it('formats sets in the account unit and never rounds a ratio up to 100%', () => {
		expect(formatPlateauSet(plateau().best, 'KG')).toBe('100 kg × 5')
		expect(formatPlateauSet(plateau().best, 'LB')).toBe('220.46 lb × 5')
		expect(describeClosestShare(0.975, en)).toBe('97% of that estimate')
		expect(describeClosestShare(0.999, en)).toBe('99% of that estimate')
		expect(describeClosestShare(1, en)).toBe('matched that estimate')
		expect(describeClosestShare(1, en, 'the best estimate')).toBe(
			'matched the best estimate',
		)
	})

	it('offers every allowed minimum and names the default', () => {
		expect(PLATEAU_SESSION_OPTIONS).toEqual([3, 4, 5, 6, 7, 8])
		expect(getPlateauSessionLabel(4, en)).toBe('4 sessions (default)')
		expect(getPlateauSessionLabel(6, en)).toBe('6 sessions')
		expect(describePlateauRule({ ...thresholds, minSessions: 6 }, en)).toMatch(
			/^Lifts trained at least 6 times since their current best/,
		)
	})

	it('explains an empty result with the checked count', () => {
		expect(getPlateauEmptyState(0, thresholds, en).title).toBe(
			'Nothing to check yet',
		)
		expect(getPlateauEmptyState(3, thresholds, en).description).toBe(
			'None of the 3 lifts you trained in the last 3 weeks has gone 4 sessions without a new best.',
		)
	})
})

describe('plateau copy in Spanish', () => {
	it('keeps the numbers and pluralises spans, sessions and lifts', () => {
		expect(formatSpan(21, es)).toBe('3 semanas')
		expect(formatSpan(7, es)).toBe('1 semana')
		expect(formatSpan(10, es)).toBe('10 días')
		expect(describePlateauCount(plateau(), thresholds, date, es)).toEqual({
			headline: 'Sin nueva mejor marca en 5 sesiones',
			since: 'desde tu mejor marca del 2026-08-10',
		})
		expect(
			describePlateauCount(
				plateau({ sessionsWithoutNewBest: 1, countedSince: '2026-09-01' }),
				thresholds,
				date,
				es,
			).headline,
		).toBe('Sin nueva mejor marca en 1 sesión')
		expect(describeClosestShare(0.999, es)).toBe('99% de esa estimación')
		expect(describeClosestShare(1, es)).toBe('igualó esa estimación')
		expect(getPlateauSessionLabel(4, es)).toBe('4 sesiones (predeterminado)')
		expect(getPlateauEmptyState(1, thresholds, es).description).toContain(
			'1 ejercicio',
		)
		expect(getPlateauEmptyState(3, thresholds, es).description).toContain(
			'3 ejercicios',
		)
	})

	it('disclaims diagnosis and names no cause or advice in either language', () => {
		const causeOrAdvice: Record<'en' | 'es', RegExp> = {
			en: /because|due to|caused|you should|try |need to/i,
			es: /porque|debido|causa|culpa|deber[ií]as|debes|intenta|prueba /i,
		}
		for (const [language, t] of [
			['en', en],
			['es', es],
		] as const) {
			const copy = [
				describePlateauRule(thresholds, t),
				describePlateauCount(plateau(), thresholds, date, t).headline,
				describePlateauCount(plateau(), thresholds, date, t).since,
				getPlateauEmptyState(0, thresholds, t).description,
				getPlateauEmptyState(2, thresholds, t).description,
			].join(' ')
			expect(copy).not.toMatch(causeOrAdvice[language])
		}
		expect(describePlateauRule(thresholds, es)).toMatch(/no un diagnóstico/)
	})
})
