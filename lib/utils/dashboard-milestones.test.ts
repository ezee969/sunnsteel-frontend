import type {
	AchievementCategoryProgress,
	AchievementsResponse,
	RenaissanceRankProgress,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	buildUpcomingMilestones,
	getUpcomingMilestonesEmptyState,
	type MilestoneTranslators,
} from './dashboard-milestones'

const translators = (locale: 'en' | 'es'): MilestoneTranslators => ({
	categories: translatorFor(locale, 'achievements.categories'),
	progress: translatorFor(locale, 'achievements.progress'),
	catalogAchievements: translatorFor(locale, 'catalog.achievements'),
})
const en = translators('en')
const tEmpty = translatorFor('en', 'planning.dashboardMilestones')
const esEmpty = translatorFor('es', 'planning.dashboardMilestones')

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

const progress = (
	category: AchievementCategoryProgress['category'],
	currentValue: number,
	threshold: number | null,
	remaining: number,
): AchievementCategoryProgress => ({
	category,
	currentValue,
	nextMilestone: threshold
		? {
				id: `${category}_${threshold}`,
				category,
				threshold,
				title: `${category} ${threshold}`,
				description: 'A fixed catalog milestone.',
			}
		: null,
	remaining,
})

const response = (
	overrides: Partial<AchievementsResponse> = {},
): AchievementsResponse => ({
	analyticsReady: true,
	earnedCount: 3,
	availableCount: 25,
	achievements: [],
	rank,
	milestoneProgress: [
		progress('STREAK_DAYS', 9, 14, 5),
		progress('SESSIONS', 18, 25, 7),
		progress('VOLUME_KG', 40000, 50000, 10000),
	],
	comeback: null,
	...overrides,
})

describe('upcoming milestones (DASH-09)', () => {
	it('lists the categories in catalog order, leaving the rank to the masthead (DASH-11)', () => {
		const milestones = buildUpcomingMilestones('en', en, response())

		expect(milestones.map(item => item.key)).toEqual([
			'SESSIONS',
			'VOLUME_KG',
			'STREAK_DAYS',
		])
	})

	it('states exact current and target values, never a percentage', () => {
		const milestones = buildUpcomingMilestones('en', en, response())
		const sessions = milestones.find(item => item.key === 'SESSIONS')

		expect(sessions?.evidence).toBe('18 / 25 sessions')
		expect(sessions?.detail).toBe('7 more sessions, within your own schedule.')
		expect(
			milestones.some(item => `${item.evidence}${item.detail}`.includes('%')),
		).toBe(false)
	})

	it('leaves out a category whose fixed catalog is complete', () => {
		const milestones = buildUpcomingMilestones(
			'en',
			en,
			response({
				milestoneProgress: [
					progress('SESSIONS', 500, null, 0),
					progress('SETS', 400, 500, 100),
				],
			}),
		)

		expect(milestones.map(item => item.key)).toEqual(['SETS'])
	})

	it('shows nothing until the analytics projection is ready', () => {
		expect(buildUpcomingMilestones('en', en, undefined)).toEqual([])
		expect(
			buildUpcomingMilestones('en', en, response({ analyticsReady: false })),
		).toEqual([])
	})
})

describe('upcoming milestones empty state', () => {
	it('points at routines before anything is verified', () => {
		expect(getUpcomingMilestonesEmptyState(tEmpty, undefined)).toEqual({
			title: 'No milestones yet',
			description:
				'Finish a workout and the next milestone in each category appears here with its exact target.',
			action: { kind: 'link', label: 'Browse routines', href: '/routines' },
		})
	})

	it('says the catalog is complete, without restating the rank', () => {
		const finishedLadder = response({
			milestoneProgress: [],
			rank: { ...rank, nextRank: null },
		})

		expect(
			getUpcomingMilestonesEmptyState(tEmpty, finishedLadder).description,
		).toBe('The catalog in each category is complete.')
	})
})

describe('upcoming milestones in Spanish', () => {
	it('states exact values', () => {
		const milestones = buildUpcomingMilestones(
			'es',
			translators('es'),
			response(),
		)

		expect(milestones[0].evidence).toBe('18 / 25 sesiones')
		expect(
			milestones.some(item => `${item.evidence}${item.detail}`.includes('%')),
		).toBe(false)
	})

	it('points at routines before anything is verified', () => {
		expect(getUpcomingMilestonesEmptyState(esEmpty, undefined).action).toEqual({
			kind: 'link',
			label: 'Ver rutinas',
			href: '/routines',
		})
	})
})
