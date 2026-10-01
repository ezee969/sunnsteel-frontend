import type {
	AchievementsResponse,
	RenaissanceRankProgress,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	buildDashboardRank,
	type DashboardRankTranslators,
} from './dashboard-rank'

const translators = (locale: 'en' | 'es'): DashboardRankTranslators => ({
	rank: translatorFor(locale, 'achievements.rank'),
	catalogRanks: translatorFor(locale, 'catalog.ranks'),
})

const rank: RenaissanceRankProgress = {
	currentRank: {
		id: 'APPRENTICE',
		title: 'Apprentice',
		description: 'Learning the craft.',
		minimumSessions: 10,
		minimumActiveWeeks: 6,
	},
	nextRank: {
		id: 'ARTISAN',
		title: 'Artisan',
		description: 'A steady hand.',
		minimumSessions: 25,
		minimumActiveWeeks: 14,
	},
	completedSessions: 18,
	activeWeeks: 9,
	sessionsRemaining: 7,
	activeWeeksRemaining: 5,
}

const response = (
	overrides: Partial<AchievementsResponse> = {},
): AchievementsResponse => ({
	analyticsReady: true,
	earnedCount: 3,
	availableCount: 25,
	achievements: [],
	rank,
	milestoneProgress: [],
	comeback: null,
	...overrides,
})

describe('dashboard rank (DASH-11)', () => {
	it('states the current rank, its evidence and the next rank exactly', () => {
		expect(buildDashboardRank(translators('en'), response())).toEqual({
			rankId: 'APPRENTICE',
			title: 'Apprentice',
			evidence: '18 sessions · 9 active weeks',
			next: {
				rankId: 'ARTISAN',
				title: 'Artisan',
				requirements: '7 more sessions · 5 more active weeks',
			},
		})
	})

	it('says a requirement is met rather than counting down to zero', () => {
		const next = buildDashboardRank(
			translators('en'),
			response({ rank: { ...rank, sessionsRemaining: 0 } }),
		)?.next

		expect(next?.requirements).toBe(
			'Session requirement met · 5 more active weeks',
		)
	})

	it('has no next rank once the ladder is finished', () => {
		const finished = buildDashboardRank(
			translators('en'),
			response({
				rank: {
					...rank,
					currentRank: { ...rank.currentRank, id: 'LAUREATE' },
					nextRank: null,
					sessionsRemaining: 0,
					activeWeeksRemaining: 0,
				},
			}),
		)

		expect(finished?.rankId).toBe('LAUREATE')
		expect(finished?.next).toBeNull()
	})

	it('shows nothing until the analytics projection is ready', () => {
		expect(buildDashboardRank(translators('en'), undefined)).toBeNull()
		expect(
			buildDashboardRank(
				translators('en'),
				response({ analyticsReady: false }),
			),
		).toBeNull()
		expect(
			buildDashboardRank(translators('en'), response({ rank: null })),
		).toBeNull()
	})

	it('never states a percentage', () => {
		const built = buildDashboardRank(translators('en'), response())
		expect(JSON.stringify(built)).not.toContain('%')
	})

	it('names ranks and requirements in Spanish', () => {
		const built = buildDashboardRank(translators('es'), response())

		expect(built?.evidence).toBe('18 sesiones · 9 semanas activas')
		expect(built?.next?.requirements).toBe(
			'7 sesiones más · 5 semanas activas más',
		)
		expect(built?.title).not.toBe('')
	})
})
