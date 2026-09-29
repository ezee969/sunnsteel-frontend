import type {
	DeloadSuggestion,
	DeloadSuggestionEvidence,
	TrainingSignalsResponse,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	deloadSuggestionAction,
	deloadSuggestionHref,
	deloadSuggestionTitle,
	describeSuggestionEvidence,
	describeSuggestionPlan,
	hasDeloadSuggestion,
	parseSuggestedDeload,
} from './deload-suggestion'

const en = translatorFor('en', 'progress.deloadSuggestion')
const es = translatorFor('es', 'progress.deloadSuggestion')

const suggestion: DeloadSuggestion = {
	routineId: 'upper-lower',
	routineName: 'Upper / Lower',
	startDate: '2026-09-25',
	endDate: '2026-10-01',
	lengthDays: 7,
	loadReductionPercent: 10,
	setMode: 'HALF',
	trainingBlockName: null,
}

const evidence = (
	effort: [boolean, boolean],
	repTargets: [boolean, boolean],
	declines: [boolean, boolean] = [false, false],
): DeloadSuggestionEvidence[] => [
	{ signal: 'EFFORT', markedNow: effort[0], markedEarlier: effort[1] },
	{
		signal: 'REP_TARGETS',
		markedNow: repTargets[0],
		markedEarlier: repTargets[1],
	},
	{ signal: 'DECLINES', markedNow: declines[0], markedEarlier: declines[1] },
]

const signals = {
	effort: {
		comparison: {
			recent: { averageRpe: 8.4, sets: 22 },
			previous: { averageRpe: 7.8, sets: 25 },
			difference: 0.6,
			lifts: 3,
		},
	},
	repTargets: {
		recent: { shortSets: 11, targetedSets: 40, shortPercent: 27 },
		previous: { shortSets: 4, targetedSets: 38, shortPercent: 11 },
	},
	declines: { lifts: [{}, {}] },
} as unknown as TrainingSignalsResponse

describe('deload suggestion copy', () => {
	it('restates what was marked today and a week ago, with the numbers', () => {
		expect(
			describeSuggestionEvidence(
				evidence([true, true], [true, false]),
				en,
				'en',
				signals,
			),
		).toBe(
			'Marked today and a week ago: effort (average RPE up 0.6). Marked today: rep targets (27% of sets short, against 11% before).',
		)
		expect(
			describeSuggestionEvidence(
				evidence([true, false], [false, false], [true, false]),
				en,
				'en',
				signals,
			),
		).toBe(
			'Marked today: effort (average RPE up 0.6) and declining lifts (2 lifts).',
		)
	})

	it('names the signals without numbers until they load', () => {
		expect(
			describeSuggestionEvidence(
				evidence([true, true], [false, false]),
				en,
				'en',
			),
		).toBe('Marked today and a week ago: effort.')
	})

	it('describes the deload it would open and that nothing changes until it is saved', () => {
		expect(describeSuggestionPlan(suggestion, en, 'en')).toMatch(
			/^Sunnsteel can plan a deload for Upper \/ Lower from .+ to .+ \(7 days\), with loads 10% lighter and half the sets\. You can change it before saving; nothing changes unless you save it\.$/,
		)
		expect(
			describeSuggestionPlan(
				{
					...suggestion,
					trainingBlockName: 'Autumn',
					lengthDays: 1,
					setMode: 'ALL',
					loadReductionPercent: 0,
				},
				en,
				'en',
			),
		).toContain('Upper / Lower (Autumn)')
		expect(
			describeSuggestionPlan(
				{
					...suggestion,
					lengthDays: 1,
					setMode: 'ALL',
					loadReductionPercent: 0,
				},
				en,
				'en',
			),
		).toContain('(1 day), with loads unchanged and every set.')
	})

	it('links to the routine with the dates and reads them back', () => {
		const href = deloadSuggestionHref(suggestion)
		expect(href).toBe(
			'/routines/upper-lower?deload=suggested&start=2026-09-25&days=7',
		)
		expect(
			parseSuggestedDeload(new URL(href, 'https://x').searchParams),
		).toEqual({ startDate: '2026-09-25', length: 7 })
	})

	it('ignores a link that is not a suggestion or carries bad dates', () => {
		const read = (query: string) =>
			parseSuggestedDeload(new URLSearchParams(query))
		expect(read('')).toBeNull()
		expect(read('deload=other&start=2026-09-25&days=7')).toBeNull()
		expect(read('deload=suggested&start=25-09-2026&days=7')).toBeNull()
		expect(read('deload=suggested&start=2026-09-25&days=0')).toBeNull()
		expect(read('deload=suggested&start=2026-09-25&days=15')).toBeNull()
		expect(read('deload=suggested&start=2026-09-25&days=2.5')).toBeNull()
		expect(parseSuggestedDeload(null)).toBeNull()
	})

	it('only shows when the server made a suggestion', () => {
		expect(hasDeloadSuggestion(undefined)).toBe(false)
		expect(hasDeloadSuggestion({ suggestion: null } as never)).toBe(false)
		expect(hasDeloadSuggestion({ suggestion } as never)).toBe(true)
	})

	it('never names a cause or tells the member what they need', () => {
		const copy = [
			deloadSuggestionTitle(en),
			deloadSuggestionAction(en),
			describeSuggestionEvidence(
				evidence([true, true], [true, true], [true, true]),
				en,
				'en',
				signals,
			),
			describeSuggestionPlan(suggestion, en, 'en'),
		].join(' ')
		expect(copy).not.toMatch(
			/fatigue|tired|recover|overtrain|overreach|sleep|stress|injur|\bshould\b|\bneed\b|\bmust\b|because/i,
		)
	})
})

describe('the suggestion in Spanish (I18N-04)', () => {
	it('restates the evidence and the plan without naming a cause', () => {
		const evidenceCopy = describeSuggestionEvidence(
			evidence([true, true], [true, false]),
			es,
			'es',
			signals,
		)
		expect(evidenceCopy).toContain('Marcado hoy y hace una semana')
		expect(describeSuggestionPlan(suggestion, es, 'es')).toContain(
			'nada cambia si no la guardas',
		)
		const copy = [
			deloadSuggestionTitle(es),
			deloadSuggestionAction(es),
			evidenceCopy,
			describeSuggestionPlan(suggestion, es, 'es'),
		].join(' ')
		expect(copy).not.toMatch(
			/fatiga|cansad|recuper|sobreentren|sue[ñn]o|estr[ée]s|lesi[óo]n|deber[ií]as|necesitas|porque/i,
		)
	})
})
