import type {
	AchievementCategoryProgress,
	AchievementsResponse,
	RenaissanceRankProgress,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	buildUpcomingMilestones,
	getUpcomingMilestonesEmptyState,
} from './dashboard-milestones'

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
	it('places the next rank first, then the categories in catalog order', () => {
		const milestones = buildUpcomingMilestones(response())

		expect(milestones.map(item => item.key)).toEqual([
			'RANK',
			'SESSIONS',
			'VOLUME_KG',
			'STREAK_DAYS',
		])
	})

	it('states the rank with its current standing and exact requirements', () => {
		const [next] = buildUpcomingMilestones(response())

		expect(next).toEqual({
			key: 'RANK',
			group: 'Renaissance rank',
			title: 'Artisan',
			evidence: '18 sessions · 9 active weeks',
			detail: '7 more sessions · 5 more active weeks',
			rankId: 'ARTISAN',
		})
	})

	it('carries a crest only on the rank row (ACH-09)', () => {
		const milestones = buildUpcomingMilestones(response())

		expect(
			milestones.filter(item => item.rankId).map(item => item.key),
		).toEqual(['RANK'])
	})

	it('states exact current and target values, never a percentage', () => {
		const milestones = buildUpcomingMilestones(response())
		const sessions = milestones.find(item => item.key === 'SESSIONS')

		expect(sessions?.evidence).toBe('18 / 25 sessions')
		expect(sessions?.detail).toBe('7 more sessions, within your own schedule.')
		expect(
			milestones.some(item => `${item.evidence}${item.detail}`.includes('%')),
		).toBe(false)
	})

	it('leaves out a category whose fixed catalog is complete', () => {
		const milestones = buildUpcomingMilestones(
			response({
				milestoneProgress: [
					progress('SESSIONS', 500, null, 0),
					progress('SETS', 400, 500, 100),
				],
			}),
		)

		expect(milestones.map(item => item.key)).toEqual(['RANK', 'SETS'])
	})

	it('omits the rank once the ladder is finished', () => {
		const milestones = buildUpcomingMilestones(
			response({
				rank: {
					...rank,
					nextRank: null,
					sessionsRemaining: 0,
					activeWeeksRemaining: 0,
				},
			}),
		)

		expect(milestones.some(item => item.key === 'RANK')).toBe(false)
	})

	it('shows nothing until the analytics projection is ready', () => {
		expect(buildUpcomingMilestones(undefined)).toEqual([])
		expect(
			buildUpcomingMilestones(response({ analyticsReady: false })),
		).toEqual([])
	})
})

describe('upcoming milestones empty state', () => {
	it('points at routines before anything is verified', () => {
		expect(getUpcomingMilestonesEmptyState(undefined)).toEqual({
			title: 'No milestones yet',
			description:
				'Finish a workout and the next milestone in each category appears here with its exact target.',
			action: { kind: 'link', label: 'Browse routines', href: '/routines' },
		})
	})

	it('claims the finished rank path only when the rank says so', () => {
		const completed = response({ milestoneProgress: [] })

		expect(getUpcomingMilestonesEmptyState(completed).description).toBe(
			'The catalog in each category is complete.',
		)
		expect(
			getUpcomingMilestonesEmptyState(
				response({ milestoneProgress: [], rank: { ...rank, nextRank: null } }),
			).description,
		).toBe(
			'The catalog in each category is complete and the Renaissance rank path is finished.',
		)
	})
})
