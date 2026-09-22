import type {
	ActivityAudience,
	ActivityCommentSummary,
	ActivityEntry,
	ActivityEntrySharing,
	ActivityLink,
	ActivityPreviewAudience,
	ActivityReaction,
	ActivityReactionSummary,
	ActivitySection,
	ActivityType,
	OwnActivityResponse,
	ProfileVisibility,
	SetActivityEntryAudienceResponse,
	SetActivityReactionResponse,
	SharedRoutineOwner,
	WeightUnit,
} from '@sunsteel/contracts'
import { ACTIVITY_REACTIONS } from '@sunsteel/contracts'
import type { InfiniteData } from '@tanstack/react-query'

import type { ClassicalIconName } from '@/components/icons/ClassicalIcon'
import { formatComebackEvidence } from '@/lib/utils/achievements'
import { PRIVACY_SECTION_LABELS } from '@/lib/utils/privacy-overview'
import { profileRoutineHref } from '@/lib/utils/routine-sharing'
import { formatDuration } from '@/lib/utils/time-format.utils'
import {
	formatWeight,
	formatWeightAmount,
	getWeightUnitLabel,
} from '@/lib/utils/weight-unit'

// SOC-03/SOC-04 copy. Activity is generated from what members did, so every
// line here names a verified fact; nothing is phrased as something a member
// wrote.

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
	SESSION_COMPLETED: 'Completed workouts',
	PERSONAL_RECORD: 'Personal records',
	PROGRESSION_CHANGED: 'Load progressions',
	ACHIEVEMENT_UNLOCKED: 'Achievements',
	STREAK_MILESTONE: 'Streak milestones',
	COMEBACK: 'Comebacks',
	ROUTINE_SHARED: 'Shared routines',
}

export const ACTIVITY_TYPE_DESCRIPTIONS: Record<ActivityType, string> = {
	SESSION_COMPLETED:
		'The routine and day you finished, with its sets, volume and duration.',
	PERSONAL_RECORD: 'A new best set on an exercise, with its estimated 1RM.',
	PROGRESSION_CHANGED:
		'The next target load a finished session earned on an exercise.',
	ACHIEVEMENT_UNLOCKED:
		'A milestone you earned while training. Ones recognised from earlier history never appear.',
	STREAK_MILESTONE: 'A training streak milestone you reached.',
	COMEBACK:
		'A return to training after 14 or more days away, once you have trained on three days of it.',
	ROUTINE_SHARED:
		'A routine you made visible to others. Its own visibility still decides who can open it.',
}

export const AUDIENCE_LABELS: Record<ActivityAudience, string> = {
	PRIVATE: 'Only me',
	FOLLOWERS: 'Followers',
	PUBLIC: 'Everyone',
}

export const AUDIENCE_OPTIONS: ActivityAudience[] = [
	'PRIVATE',
	'FOLLOWERS',
	'PUBLIC',
]

export const PREVIEW_AUDIENCE_LABELS: Record<ActivityPreviewAudience, string> =
	{
		FOLLOWERS: 'A follower',
		PUBLIC: 'Any other member',
	}

/** What the feed is, said once above it. */
export const ACTIVITY_FEED_SCOPE_NOTE =
	'What the members you follow did, generated from their verified training. Nobody writes these; each member chooses who sees each kind.'

/** What "Everyone" reaches, because it is narrower than on a profile. */
export const ACTIVITY_EVERYONE_NOTE =
	'Everyone means any member signed in to Sunnsteel. Activity never appears on your public profile link.'

/** Why nothing is shared until the owner says so. */
export const ACTIVITY_DEFAULTS_NOTE =
	'Every kind starts at Only me. A default applies to your past activity of that kind as well as new activity, except entries you set on their own. Your profile privacy is the upper bound: a kind can never reach further than the section it comes from.'

const ACTIVITY_RANK: Record<ProfileVisibility, number> = {
	PRIVATE: 0,
	FOLLOWERS: 1,
	PUBLIC: 2,
}

const plural = (count: number, singular: string, many = `${singular}s`) =>
	`${count.toLocaleString()} ${count === 1 ? singular : many}`

/** Where an entry's link leads. The server already decided the viewer may open it. */
export function activityHref(link: ActivityLink): string {
	switch (link.kind) {
		case 'OWN_SESSION':
			return `/workouts/history/${encodeURIComponent(link.sessionId)}`
		case 'OWN_EXERCISE':
			return `/exercises/${encodeURIComponent(link.exerciseId)}`
		case 'OWN_ACHIEVEMENTS':
			return '/achievements'
		case 'OWN_ROUTINE':
			return `/routines/${encodeURIComponent(link.routineId)}`
		case 'MEMBER_RECORDS':
			return `/profile/${encodeURIComponent(link.username)}#personal-records`
		case 'MEMBER_ACHIEVEMENTS':
			return `/profile/${encodeURIComponent(link.username)}#achievements`
		case 'MEMBER_ROUTINE':
			return profileRoutineHref(link.username, link.routineId)
	}
}

function describeProgression(
	sets: { previousWeightKg: number; newWeightKg: number }[],
	unit: WeightUnit,
): string | null {
	if (sets.length === 0) return null
	const [first] = sets
	const uniform = sets.every(
		set =>
			set.previousWeightKg === first.previousWeightKg &&
			set.newWeightKg === first.newWeightKg,
	)
	if (uniform) {
		return `${formatWeight(first.previousWeightKg, unit)} → ${formatWeight(first.newWeightKg, unit)} on ${plural(sets.length, 'set')}`
	}
	const highest = Math.max(...sets.map(set => set.newWeightKg))
	return `${plural(sets.length, 'set')} progressed, up to ${formatWeight(highest, unit)}`
}

/** The record an entry came from, named in the viewer's unit. */
export function describeActivity(
	entry: ActivityEntry,
	unit: WeightUnit,
): { title: string; detail: string | null } {
	switch (entry.type) {
		case 'SESSION_COMPLETED': {
			const { session } = entry
			const parts = [plural(session.completedSets, 'set')]
			if (session.volumeKg > 0) {
				parts.push(
					`${formatWeightAmount(session.volumeKg, unit, 0)} ${getWeightUnitLabel(unit)} volume`,
				)
			}
			if (session.durationSec && session.durationSec > 0) {
				parts.push(formatDuration(session.durationSec))
			}
			return {
				title: `Completed ${session.routineName}${session.dayName ? ` · ${session.dayName}` : ''}`,
				detail: parts.join(' · '),
			}
		}
		case 'PERSONAL_RECORD':
			return {
				title: `New best on ${entry.record.exerciseName}`,
				detail: `${formatWeight(entry.record.weightKg, unit)} × ${entry.record.reps} · est. 1RM ${formatWeight(entry.record.estimated1rmKg, unit)}`,
			}
		case 'PROGRESSION_CHANGED':
			return {
				title: `Load progressed on ${entry.progression.exerciseName}`,
				detail: describeProgression(entry.progression.sets, unit),
			}
		case 'ACHIEVEMENT_UNLOCKED':
			return {
				title: `Earned ${entry.achievement.title}`,
				detail: entry.achievement.description,
			}
		case 'STREAK_MILESTONE':
			return {
				title: `Reached a ${entry.streak.streakDays}-day training streak`,
				detail: entry.streak.title,
			}
		case 'COMEBACK':
			return {
				title: 'Came back to training',
				detail: formatComebackEvidence(entry.comeback),
			}
		case 'ROUTINE_SHARED':
			return {
				title: `Shared ${entry.routine.name}`,
				detail: `${plural(entry.routine.dayCount, 'day')} · ${plural(entry.routine.exerciseCount, 'exercise')}`,
			}
	}
}

export const describeAuthor = (author: SharedRoutineOwner) =>
	[author.name, author.lastName].filter(Boolean).join(' ') || author.username

export interface ActivityGroup<Entry extends ActivityEntry = ActivityEntry> {
	key: string
	author: SharedRoutineOwner
	entries: Entry[]
}

/**
 * The facts of one workout, shown together. Entries of one author sharing a
 * `groupKey` join the group of the first (newest) of them, so a session and
 * the records it set read as one card even when another member's activity
 * falls between them in time. Everything else is its own group, in order.
 */
export function groupActivity<Entry extends ActivityEntry>(
	entries: Entry[],
): ActivityGroup<Entry>[] {
	const groups: ActivityGroup<Entry>[] = []
	const byKey = new Map<string, ActivityGroup<Entry>>()
	for (const entry of entries) {
		const key = entry.groupKey
			? `${entry.author.username}|${entry.groupKey}`
			: `entry|${entry.id}`
		const existing = byKey.get(key)
		if (existing) {
			existing.entries.push(entry)
			continue
		}
		const group = { key, author: entry.author, entries: [entry] }
		byKey.set(key, group)
		groups.push(group)
	}
	return groups
}

/** Who can see one of the owner's entries, in words. */
export function describeEffectiveAudience(audience: ActivityAudience): string {
	switch (audience) {
		case 'PRIVATE':
			return 'Only you can see this'
		case 'FOLLOWERS':
			return 'Your followers can see this'
		case 'PUBLIC':
			return 'Every member can see this'
	}
}

/**
 * Why an entry reaches fewer people than its owner chose, or null when the
 * choice is what took effect. Staying silent would let an owner believe a
 * wider choice was honoured.
 */
export function describeActivityCap(
	sharing: ActivityEntrySharing,
): string | null {
	if (!sharing.cappedBy) return null
	if (sharing.cappedBy === 'ROUTINE') {
		return sharing.effectiveAudience === 'PRIVATE'
			? 'The routine itself is private now, so nobody else can see this.'
			: 'The routine itself is visible to followers only, so this reaches followers only.'
	}
	return describeSectionCap(
		sharing.section,
		sharing.sectionRule,
		sharing.override ?? sharing.defaultAudience,
	)
}

/**
 * The sentence for a chosen audience a profile section narrows, or null when
 * the section allows it. Used for a type's default and for a single entry.
 */
export function describeSectionCap(
	section: ActivitySection,
	sectionRule: ProfileVisibility,
	chosen: ActivityAudience,
): string | null {
	if (ACTIVITY_RANK[sectionRule] >= ACTIVITY_RANK[chosen]) return null
	const reached =
		sectionRule === 'PRIVATE'
			? 'nobody else'
			: AUDIENCE_LABELS[sectionRule].toLowerCase()
	return `Your ${PRIVACY_SECTION_LABELS[section].toLowerCase()} privacy is ${AUDIENCE_LABELS[sectionRule]}, so this reaches ${reached}. Change it in Settings under privacy.`
}

/** The owner's list, with one entry's sharing replaced by what the server resolved. */
export function applyEntrySharing(
	data: InfiniteData<OwnActivityResponse>,
	response: SetActivityEntryAudienceResponse,
): InfiniteData<OwnActivityResponse> {
	return {
		...data,
		pages: data.pages.map(page => ({
			...page,
			entries: page.entries.map(entry =>
				entry.id === response.entryId
					? { ...entry, sharing: response.sharing }
					: entry,
			),
		})),
	}
}

// Themed reactions (SOC-05) --------------------------------------------------
//
// Four acknowledgements, each with one of the classical icons the app already
// ships. They say "this was work"; nothing counts, ranks or orders by them.

export const ACTIVITY_REACTION_LABELS: Record<ActivityReaction, string> = {
	STRENGTH: 'Strength',
	DISCIPLINE: 'Discipline',
	RESPECT: 'Respect',
	INSPIRING: 'Inspiring',
}

export const ACTIVITY_REACTION_ICONS: Record<
	ActivityReaction,
	ClassicalIconName
> = {
	STRENGTH: 'bicep-flexing',
	DISCIPLINE: 'hourglass',
	RESPECT: 'laurel-crown',
	INSPIRING: 'torch',
}

/** Only the reactions somebody actually gave, in catalog order. */
export function reactionsGiven(
	summary: ActivityReactionSummary,
): { reaction: ActivityReaction; count: number }[] {
	return ACTIVITY_REACTIONS.filter(
		reaction => summary.counts[reaction] > 0,
	).map(reaction => ({ reaction, count: summary.counts[reaction] }))
}

/** What a reaction control says, including what pressing it again would do. */
export function describeReactionAction(
	reaction: ActivityReaction,
	summary: ActivityReactionSummary,
): string {
	const label = ACTIVITY_REACTION_LABELS[reaction]
	const count = summary.counts[reaction]
	if (summary.viewerReaction === reaction) {
		return `${label}, ${count} in total. You chose this; choose it again to remove it.`
	}
	return count > 0 ? `${label}, ${count} in total` : label
}

/**
 * One entry's reactions replaced wherever it is loaded — the feed, a member's
 * profile, the owner's list, a preview — so the control shows what the server
 * resolved without refetching a page.
 */
export function applyEntryReactions<
	Page extends {
		entries: { id: string; reactions: ActivityReactionSummary }[]
	},
>(
	data: InfiniteData<Page>,
	response: SetActivityReactionResponse,
): InfiniteData<Page> {
	return {
		...data,
		pages: data.pages.map(page => ({
			...page,
			entries: page.entries.map(entry =>
				entry.id === response.entryId
					? { ...entry, reactions: response.reactions }
					: entry,
			),
		})),
	}
}

/**
 * SOC-06. The same patch for a comment count, and for the same reason: one
 * entry can be on screen in the feed, on a profile and in the owner's list at
 * once, so a count updated in one place must reach the others.
 */
export function applyEntryComments<
	Page extends {
		entries: { id: string; comments: ActivityCommentSummary }[]
	},
>(
	data: InfiniteData<Page>,
	update: { entryId: string; summary: ActivityCommentSummary },
): InfiniteData<Page> {
	return {
		...data,
		pages: data.pages.map(page => ({
			...page,
			entries: page.entries.map(entry =>
				entry.id === update.entryId
					? { ...entry, comments: update.summary }
					: entry,
			),
		})),
	}
}

/** SOC-06 copy: what a comment surface says, and what it must not. */
export const ACTIVITY_COMMENT_PLACEHOLDER = 'Say something about this.'

/** An empty comment list says so plainly rather than rendering nothing. */
export const ACTIVITY_COMMENTS_EMPTY = 'No comments yet.'

/**
 * The delete confirmation names whose comment it is, because the owner of the
 * activity may delete somebody else's and should be told that is what they are
 * doing.
 */
export const describeCommentDelete = (isOwnComment: boolean): string =>
	isOwnComment
		? 'Delete your comment? It is removed for everyone and cannot be undone.'
		: 'Delete this comment from your activity? It is removed for everyone and cannot be undone.'

/**
 * Why the composer is absent. A control that is present but refuses on click
 * reads as broken, so the reason replaces it.
 */
export const describeCommentBudgetSpent = (max: number): string =>
	`You have written ${max} comments today. Each one frees up a day after you wrote it.`

/** An empty feed says which of the two reasons it is. */
export function describeEmptyFeed(followedCount: number): {
	title: string
	description: string
} {
	return followedCount === 0
		? {
				title: 'You are not following anyone yet',
				description:
					'Follow members to see what they train here, once they choose to share it.',
			}
		: {
				title: 'Nothing shared with you yet',
				description:
					'The members you follow have not shared any activity with you. Everyone starts private.',
			}
}
