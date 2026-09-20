import type {
	ActivityEntry,
	ActivityEntrySharing,
	ActivityReaction,
	ActivityReactionSummary,
	OwnActivityEntry,
	OwnActivityResponse,
} from '@sunsteel/contracts'
import { ACTIVITY_REACTIONS, ACTIVITY_TYPES } from '@sunsteel/contracts'
import type { InfiniteData } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import { buildActivityParams } from '@/lib/api/services/activityService'

import {
	ACTIVITY_DEFAULTS_NOTE,
	ACTIVITY_EVERYONE_NOTE,
	ACTIVITY_REACTION_ICONS,
	ACTIVITY_REACTION_LABELS,
	ACTIVITY_TYPE_DESCRIPTIONS,
	ACTIVITY_TYPE_LABELS,
	activityHref,
	applyEntryReactions,
	applyEntrySharing,
	describeActivity,
	describeActivityCap,
	describeEmptyFeed,
	describeReactionAction,
	describeSectionCap,
	groupActivity,
	reactionsGiven,
} from './activity'

const author = {
	username: 'lee',
	name: 'Lee',
	lastName: 'Ray',
	avatarUrl: null,
}
const summary = (
	counts: Partial<Record<ActivityReaction, number>> = {},
	viewerReaction: ActivityReaction | null = null,
): ActivityReactionSummary => ({
	counts: { STRENGTH: 0, DISCIPLINE: 0, RESPECT: 0, INSPIRING: 0, ...counts },
	viewerReaction,
})

const base = {
	occurredAt: '2026-09-19T10:00:00.000Z',
	author,
	link: null,
	groupKey: null,
	reactions: summary(),
}

const session = (id: string, groupKey: string | null): ActivityEntry => ({
	...base,
	id,
	groupKey,
	type: 'SESSION_COMPLETED',
	session: {
		routineName: 'Upper / Lower',
		dayName: 'Monday',
		completedSets: 18,
		volumeKg: 4320,
		durationSec: 3900,
	},
})

const record = (
	id: string,
	groupKey: string | null,
	who = author,
): ActivityEntry => ({
	...base,
	author: who,
	id,
	groupKey,
	type: 'PERSONAL_RECORD',
	record: {
		exerciseId: 'bench',
		exerciseName: 'Bench Press',
		weightKg: 100,
		reps: 5,
		estimated1rmKg: 116.67,
	},
})

describe('activity copy names the record, in the viewer unit', () => {
	it('names a session by routine and day, with its evidence', () => {
		const view = describeActivity(session('s', null), 'KG')
		expect(view.title).toBe('Completed Upper / Lower · Monday')
		expect(view.detail).toBe('18 sets · 4,320 kg volume · 1h 5m')
	})

	it('converts a record to pounds rather than relabelling kilograms', () => {
		const view = describeActivity(record('r', null), 'LB')
		expect(view.title).toBe('New best on Bench Press')
		expect(view.detail).toContain('lb × 5')
		expect(view.detail).not.toContain('100 lb')
	})

	it('states a uniform load progression once, and a mixed one by its top load', () => {
		const progression = (
			sets: { previousWeightKg: number; newWeightKg: number }[],
		): ActivityEntry => ({
			...base,
			id: 'p',
			type: 'PROGRESSION_CHANGED',
			progression: {
				exerciseId: 'bench',
				exerciseName: 'Bench Press',
				sets: sets.map((set, index) => ({
					setNumber: index + 1,
					targetReps: 8,
					performedReps: 8,
					...set,
				})),
			},
		})
		expect(
			describeActivity(
				progression([
					{ previousWeightKg: 80, newWeightKg: 82.5 },
					{ previousWeightKg: 80, newWeightKg: 82.5 },
				]),
				'KG',
			).detail,
		).toBe('80 kg → 82.5 kg on 2 sets')
		expect(
			describeActivity(
				progression([
					{ previousWeightKg: 80, newWeightKg: 82.5 },
					{ previousWeightKg: 75, newWeightKg: 77.5 },
				]),
				'KG',
			).detail,
		).toBe('2 sets progressed, up to 82.5 kg')
	})

	it('states a comeback by its evidence, the way the achievements page does', () => {
		const view = describeActivity(
			{
				...base,
				id: 'c',
				type: 'COMEBACK',
				comeback: {
					inactiveDays: 21,
					activeDays: 3,
					windowDays: 9,
					returnedAt: base.occurredAt,
				},
			},
			'KG',
		)
		expect(view.detail).toBe('21 full days away · 3 active days in 9 days')
	})

	it('has a label and a description for every activity type', () => {
		for (const type of ACTIVITY_TYPES) {
			expect(ACTIVITY_TYPE_LABELS[type]).toBeTruthy()
			expect(ACTIVITY_TYPE_DESCRIPTIONS[type]).toBeTruthy()
		}
	})
})

describe('activity links go where the server allowed', () => {
	it('maps each link kind to its route', () => {
		expect(activityHref({ kind: 'OWN_SESSION', sessionId: 's1' })).toBe(
			'/workouts/history/s1',
		)
		expect(activityHref({ kind: 'OWN_EXERCISE', exerciseId: 'x' })).toBe(
			'/exercises/x',
		)
		expect(activityHref({ kind: 'OWN_ACHIEVEMENTS' })).toBe('/achievements')
		expect(activityHref({ kind: 'OWN_ROUTINE', routineId: 'r' })).toBe(
			'/routines/r',
		)
		expect(activityHref({ kind: 'MEMBER_RECORDS', username: 'lee' })).toBe(
			'/profile/lee#personal-records',
		)
		expect(activityHref({ kind: 'MEMBER_ACHIEVEMENTS', username: 'lee' })).toBe(
			'/profile/lee#achievements',
		)
		expect(
			activityHref({ kind: 'MEMBER_ROUTINE', username: 'lee', routineId: 'r' }),
		).toBe('/profile/lee/routines/r')
	})
})

describe('grouping the facts of one workout', () => {
	it('joins a session and its records even when another member falls between them', () => {
		const other = { ...author, username: 'sam', name: 'Sam' }
		const groups = groupActivity([
			session('lee-session', 'session:1'),
			record('sam-record', 'session:9', other),
			record('lee-record', 'session:1'),
			session('lee-ungrouped', null),
		])
		expect(groups.map(group => group.entries.map(entry => entry.id))).toEqual([
			['lee-session', 'lee-record'],
			['sam-record'],
			['lee-ungrouped'],
		])
	})

	it('never merges two members who happen to share a group key', () => {
		const other = { ...author, username: 'sam' }
		const groups = groupActivity([
			record('a', 'session:1'),
			record('b', 'session:1', other),
		])
		expect(groups).toHaveLength(2)
	})
})

describe('telling the owner what actually applies', () => {
	const sharing = (
		overrides: Partial<ActivityEntrySharing>,
	): ActivityEntrySharing => ({
		section: 'records',
		sectionRule: 'PUBLIC',
		defaultAudience: 'PUBLIC',
		override: null,
		effectiveAudience: 'PUBLIC',
		cappedBy: null,
		...overrides,
	})

	it('is silent when the choice took effect', () => {
		expect(describeActivityCap(sharing({}))).toBeNull()
		expect(describeSectionCap('records', 'FOLLOWERS', 'FOLLOWERS')).toBeNull()
		expect(describeSectionCap('records', 'PUBLIC', 'FOLLOWERS')).toBeNull()
	})

	it('names the section and where to change it when the section narrows it', () => {
		expect(
			describeActivityCap(
				sharing({
					sectionRule: 'FOLLOWERS',
					effectiveAudience: 'FOLLOWERS',
					cappedBy: 'SECTION',
				}),
			),
		).toBe(
			'Your personal records privacy is Followers, so this reaches followers. Change it in Settings under privacy.',
		)
		expect(describeSectionCap('workoutHistory', 'PRIVATE', 'PUBLIC')).toContain(
			'reaches nobody else',
		)
	})

	it('names the routine when its own visibility narrows it', () => {
		expect(
			describeActivityCap(
				sharing({
					section: 'routines',
					effectiveAudience: 'PRIVATE',
					cappedBy: 'ROUTINE',
				}),
			),
		).toBe('The routine itself is private now, so nobody else can see this.')
	})

	it('says a default reaches past entries, and that everything starts private', () => {
		expect(ACTIVITY_DEFAULTS_NOTE).toContain('Only me')
		expect(ACTIVITY_DEFAULTS_NOTE).toContain('past activity')
		expect(ACTIVITY_EVERYONE_NOTE).toContain('signed in')
	})

	it('patches one entry of the owner list with what the server resolved', () => {
		const entry = {
			...record('r', null),
			sharing: sharing({}),
		} as OwnActivityEntry
		const untouched = {
			...session('s', null),
			sharing: sharing({}),
		} as OwnActivityEntry
		const data: InfiniteData<OwnActivityResponse> = {
			pageParams: [undefined],
			pages: [{ entries: [entry, untouched] }],
		}
		const withdrawn = sharing({
			override: 'PRIVATE',
			effectiveAudience: 'PRIVATE',
		})
		const next = applyEntrySharing(data, { entryId: 'r', sharing: withdrawn })
		expect(next.pages[0].entries[0].sharing).toEqual(withdrawn)
		expect(next.pages[0].entries[1]).toBe(untouched)
	})
})

describe('themed reactions', () => {
	it('lists only the ones somebody gave, in catalog order', () => {
		expect(reactionsGiven(summary({ RESPECT: 2, STRENGTH: 1 }))).toEqual([
			{ reaction: 'STRENGTH', count: 1 },
			{ reaction: 'RESPECT', count: 2 },
		])
		expect(reactionsGiven(summary())).toEqual([])
	})

	it('names every reaction and gives it one of the classical icons', () => {
		for (const reaction of ACTIVITY_REACTIONS) {
			expect(ACTIVITY_REACTION_LABELS[reaction]).toBeTruthy()
			expect(ACTIVITY_REACTION_ICONS[reaction]).toBeTruthy()
		}
	})

	it('says what pressing the control does, including undoing your own', () => {
		expect(describeReactionAction('STRENGTH', summary())).toBe('Strength')
		expect(describeReactionAction('STRENGTH', summary({ STRENGTH: 3 }))).toBe(
			'Strength, 3 in total',
		)
		expect(
			describeReactionAction('STRENGTH', summary({ STRENGTH: 3 }, 'STRENGTH')),
		).toBe(
			'Strength, 3 in total. You chose this; choose it again to remove it.',
		)
	})

	it('replaces one entry wherever it is loaded, and leaves the others alone', () => {
		const data: InfiniteData<{ entries: ActivityEntry[] }> = {
			pageParams: [undefined],
			pages: [{ entries: [record('r', null), session('s', null)] }],
		}
		const reactions = summary({ RESPECT: 1 }, 'RESPECT')
		const next = applyEntryReactions(data, { entryId: 'r', reactions })
		expect(next.pages[0].entries[0].reactions).toEqual(reactions)
		expect(next.pages[0].entries[1]).toBe(data.pages[0].entries[1])
	})
})

describe('an empty feed says which empty it is', () => {
	it('distinguishes following nobody from nothing shared', () => {
		expect(describeEmptyFeed(0).title).toBe('You are not following anyone yet')
		expect(describeEmptyFeed(3).title).toBe('Nothing shared with you yet')
	})
})

describe('activity query serialization', () => {
	it('sends only what is set', () => {
		expect(buildActivityParams({})).toBe('')
		expect(buildActivityParams({ cursor: 'abc', limit: 10 })).toBe(
			'?limit=10&cursor=abc',
		)
		expect(buildActivityParams({ audience: 'FOLLOWERS' })).toBe(
			'?audience=FOLLOWERS',
		)
	})
})
