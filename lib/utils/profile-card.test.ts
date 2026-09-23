import type { FeaturedProfileItem } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	buildProfileCardModel,
	getProfileCardFilename,
} from '@/lib/utils/profile-card'

const featuredItems: FeaturedProfileItem[] = [
	{
		kind: 'RANK',
		referenceId: 'ARTISAN',
		position: 0,
		rank: {
			id: 'ARTISAN',
			title: 'Artisan',
			description: 'A practiced hand.',
			minimumSessions: 12,
			minimumActiveWeeks: 4,
		},
	},
	{
		kind: 'RECORD',
		referenceId: 'record-1',
		position: 1,
		record: {
			exerciseId: 'exercise-1',
			exerciseName: 'Bench Press',
			weight: 100,
			reps: 5,
			estimated1rm: 112.5,
			achievedAt: '2026-09-20T10:00:00.000Z',
		},
	},
	{
		kind: 'ACHIEVEMENT',
		referenceId: 'achievement-1',
		position: 2,
		achievement: {
			eventId: 'event-1',
			id: 'FIRST_WORKOUT',
			category: 'SESSIONS',
			threshold: 1,
			title: 'First inscription',
			description: 'Completed the first workout.',
			unlockedAt: '2026-09-20T10:00:00.000Z',
			sourceSessionId: 'session-1',
			backfilled: false,
		},
	},
]

describe('profile card', () => {
	it('uses the public identity, current rank and selected non-rank accomplishments', () => {
		const model = buildProfileCardModel({
			name: '  Ada ',
			lastName: ' Lovelace ',
			username: 'ada_lifts',
			profileUrl: 'https://sunnsteel.app/members/ada_lifts',
			featuredItems,
			achievements: {
				rank: {
					id: 'MAESTRO',
					title: 'Maestro',
					description: 'A master of the craft.',
					minimumSessions: 50,
					minimumActiveWeeks: 12,
				},
				achievements: [],
				comeback: null,
			},
			weightUnit: 'KG',
		})

		expect(model.displayName).toBe('Ada Lovelace')
		expect(model.rank).toEqual({ id: 'MAESTRO', title: 'Maestro' })
		expect(model.accomplishments).toEqual([
			{
				kind: 'Personal record',
				title: 'Bench Press',
				detail: '100 kg for 5 reps · est. 1RM 112.5 kg',
			},
			{
				kind: 'Achievement',
				title: 'First inscription',
				detail: 'Completed the first workout.',
			},
		])
	})

	it('falls back to a selected rank when the achievement ledger is unavailable', () => {
		const model = buildProfileCardModel({
			name: '',
			username: 'atlas',
			profileUrl: 'https://sunnsteel.app/members/atlas',
			featuredItems: featuredItems.slice(0, 1),
			weightUnit: 'LB',
		})

		expect(model.displayName).toBe('atlas')
		expect(model.rank).toEqual({ id: 'ARTISAN', title: 'Artisan' })
		expect(model.accomplishments).toEqual([])
	})

	it('creates a portable, predictable PNG filename', () => {
		expect(getProfileCardFilename('Ada Lifts!')).toBe(
			'sunnsteel-ada-lifts-profile-card.png',
		)
	})
})
