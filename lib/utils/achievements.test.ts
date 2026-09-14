import type {
	AchievementCategoryProgress,
	EarnedAchievement,
	RenaissanceRankProgress,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	ACHIEVEMENT_CATEGORY_LABELS,
	formatAchievementDate,
	formatMilestoneProgressDetail,
	formatMilestoneProgressEvidence,
	formatNextRankRequirements,
	formatRankEvidence,
	groupAchievements,
	orderMilestoneProgress,
} from './achievements'

const earned = (
	id: string,
	category: EarnedAchievement['category'],
): EarnedAchievement => ({
	eventId: `event-${id}`,
	id,
	category,
	threshold: 1,
	title: id,
	description: `${id} description`,
	unlockedAt: '2026-09-14T10:00:00.000Z',
	sourceSessionId: null,
	backfilled: false,
})

describe('achievement presentation', () => {
	it('groups only earned categories in the canonical order', () => {
		const groups = groupAchievements([
			earned('streak', 'STREAK_DAYS'),
			earned('session', 'SESSIONS'),
			earned('record', 'RECORDS'),
		])
		expect(groups.map(group => group.category)).toEqual([
			'SESSIONS',
			'RECORDS',
			'STREAK_DAYS',
		])
	})

	it('orders the strongest earned threshold first within a category', () => {
		const first = earned('first', 'SESSIONS')
		const tenth = { ...earned('tenth', 'SESSIONS'), threshold: 10 }
		const twentyFifth = { ...earned('twenty-fifth', 'SESSIONS'), threshold: 25 }

		expect(
			groupAchievements([tenth, first, twentyFifth])[0].items.map(
				achievement => achievement.threshold,
			),
		).toEqual([25, 10, 1])
	})

	it('keeps readable labels for every category', () => {
		expect(Object.values(ACHIEVEMENT_CATEGORY_LABELS)).toEqual([
			'Sessions',
			'Completed sets',
			'Training volume',
			'Personal records',
			'Training streaks',
		])
	})

	it('formats an earned date without exposing a time', () => {
		expect(formatAchievementDate('2026-09-14T10:00:00.000Z')).not.toContain(':')
	})

	it('keeps milestone categories in catalog order instead of proximity order', () => {
		const progress = [
			{
				category: 'STREAK_DAYS',
				currentValue: 4,
				nextMilestone: null,
				remaining: 0,
			},
			{
				category: 'SETS',
				currentValue: 99,
				nextMilestone: null,
				remaining: 0,
			},
			{
				category: 'SESSIONS',
				currentValue: 9,
				nextMilestone: null,
				remaining: 0,
			},
		] satisfies AchievementCategoryProgress[]

		expect(orderMilestoneProgress(progress).map(item => item.category)).toEqual(
			['SESSIONS', 'SETS', 'STREAK_DAYS'],
		)
	})

	it('states exact next-milestone evidence without using a percentage', () => {
		const progress = {
			category: 'SESSIONS',
			currentValue: 10,
			nextMilestone: {
				id: 'sessions:25',
				category: 'SESSIONS',
				threshold: 25,
				title: '25 Sessions',
				description: 'Complete 25 training sessions.',
			},
			remaining: 15,
		} satisfies AchievementCategoryProgress

		expect(formatMilestoneProgressEvidence(progress)).toBe('10 / 25 sessions')
		expect(formatMilestoneProgressDetail(progress)).toBe(
			'15 more sessions, within your own schedule.',
		)
	})

	it('keeps volume and streak guidance explicit about safe pacing', () => {
		const volume = {
			category: 'VOLUME_KG',
			currentValue: 49_250.5,
			nextMilestone: {
				id: 'volume_kg:50000',
				category: 'VOLUME_KG',
				threshold: 50_000,
				title: '50,000 kg Moved',
				description: 'Accumulate 50,000 kg of external-load volume.',
			},
			remaining: 749.5,
		} satisfies AchievementCategoryProgress
		const streak = {
			category: 'STREAK_DAYS',
			currentValue: 3,
			nextMilestone: {
				id: 'streak_days:5',
				category: 'STREAK_DAYS',
				threshold: 5,
				title: '5-Day Streak',
				description: 'Build a 5-day training streak.',
			},
			remaining: 2,
		} satisfies AchievementCategoryProgress

		expect(formatMilestoneProgressEvidence(volume)).toBe('49,250.5 / 50,000 kg')
		expect(formatMilestoneProgressDetail(volume)).toContain(
			'load should follow your plan',
		)
		expect(formatMilestoneProgressEvidence(streak)).toBe(
			'Best 3 / next 5 training days',
		)
		expect(formatMilestoneProgressDetail(streak)).toContain(
			'recovery days between sessions are compatible',
		)
	})

	it('explains when a finite category catalog is complete', () => {
		const progress = {
			category: 'RECORDS',
			currentValue: 56,
			nextMilestone: null,
			remaining: 0,
		} satisfies AchievementCategoryProgress

		expect(formatMilestoneProgressEvidence(progress)).toBe('56 exercises total')
		expect(formatMilestoneProgressDetail(progress)).toBe(
			'The five fixed milestones in this category are complete.',
		)
	})

	it('explains rank evidence and both remaining attendance requirements', () => {
		const rank = {
			currentRank: {
				id: 'APPRENTICE',
				title: 'Apprentice',
				description: 'Learning the craft through regular practice.',
				minimumSessions: 5,
				minimumActiveWeeks: 3,
			},
			nextRank: {
				id: 'ARTISAN',
				title: 'Artisan',
				description: 'Building a dependable training practice.',
				minimumSessions: 15,
				minimumActiveWeeks: 8,
			},
			completedSessions: 10,
			activeWeeks: 7,
			sessionsRemaining: 5,
			activeWeeksRemaining: 1,
		} satisfies RenaissanceRankProgress

		expect(formatRankEvidence(rank)).toBe('10 sessions · 7 active weeks')
		expect(formatNextRankRequirements(rank)).toBe(
			'5 more sessions · 1 more active week',
		)
	})

	it('states a met requirement and omits a next step at Laureate', () => {
		const rank = {
			currentRank: {
				id: 'LAUREATE',
				title: 'Laureate',
				description: 'A lasting training practice recorded in the ledger.',
				minimumSessions: 100,
				minimumActiveWeeks: 52,
			},
			nextRank: null,
			completedSessions: 120,
			activeWeeks: 60,
			sessionsRemaining: 0,
			activeWeeksRemaining: 0,
		} satisfies RenaissanceRankProgress

		expect(formatNextRankRequirements(rank)).toBeNull()
	})
})
