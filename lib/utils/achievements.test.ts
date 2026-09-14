import type {
	EarnedAchievement,
	RenaissanceRankProgress,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	ACHIEVEMENT_CATEGORY_LABELS,
	formatAchievementDate,
	formatNextRankRequirements,
	formatRankEvidence,
	groupAchievements,
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
