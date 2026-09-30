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
import type { Locale } from '@/i18n/config'
import type { MessageKey, Translator } from '@/i18n/translator'
import { formatComebackEvidence } from '@/lib/utils/achievements'
import { PRIVACY_SECTION_LABEL_KEYS } from '@/lib/utils/privacy-overview'
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

type Key = MessageKey<'social.activity'>
type T = Translator<'social.activity'>

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, Key> = {
	SESSION_COMPLETED: 'typeSessionCompleted',
	PERSONAL_RECORD: 'typePersonalRecord',
	PROGRESSION_CHANGED: 'typeProgressionChanged',
	ACHIEVEMENT_UNLOCKED: 'typeAchievementUnlocked',
	STREAK_MILESTONE: 'typeStreakMilestone',
	COMEBACK: 'typeComeback',
	ROUTINE_SHARED: 'typeRoutineShared',
}

export const ACTIVITY_TYPE_DESCRIPTIONS: Record<ActivityType, Key> = {
	SESSION_COMPLETED: 'descSessionCompleted',
	PERSONAL_RECORD: 'descPersonalRecord',
	PROGRESSION_CHANGED: 'descProgressionChanged',
	ACHIEVEMENT_UNLOCKED: 'descAchievementUnlocked',
	STREAK_MILESTONE: 'descStreakMilestone',
	COMEBACK: 'descComeback',
	ROUTINE_SHARED: 'descRoutineShared',
}

export const AUDIENCE_LABELS: Record<ActivityAudience, Key> = {
	PRIVATE: 'audiencePrivate',
	FOLLOWERS: 'audienceFollowers',
	PUBLIC: 'audiencePublic',
}

export const AUDIENCE_OPTIONS: ActivityAudience[] = [
	'PRIVATE',
	'FOLLOWERS',
	'PUBLIC',
]

export const PREVIEW_AUDIENCE_LABELS: Record<ActivityPreviewAudience, Key> = {
	FOLLOWERS: 'previewFollowers',
	PUBLIC: 'previewPublic',
}

// `feedScopeNote` says what the feed is, once above it; `everyoneNote` what
// "Everyone" reaches, because it is narrower than on a profile; and
// `defaultsNote` why nothing is shared until the owner says so.

const ACTIVITY_RANK: Record<ProfileVisibility, number> = {
	PRIVATE: 0,
	FOLLOWERS: 1,
	PUBLIC: 2,
}

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
	locale: Locale,
	t: T,
): string | null {
	if (sets.length === 0) return null
	const [first] = sets
	const uniform = sets.every(
		set =>
			set.previousWeightKg === first.previousWeightKg &&
			set.newWeightKg === first.newWeightKg,
	)
	if (uniform) {
		return t('progressionUniform', {
			from: formatWeight(first.previousWeightKg, unit, locale),
			to: formatWeight(first.newWeightKg, unit, locale),
			sets: t('sets', { count: sets.length }),
		})
	}
	const highest = Math.max(...sets.map(set => set.newWeightKg))
	return t('progressionMixed', {
		sets: t('sets', { count: sets.length }),
		top: formatWeight(highest, unit, locale),
	})
}

/** The record an entry came from, named in the viewer's unit. */
export function describeActivity(
	entry: ActivityEntry,
	unit: WeightUnit,
	locale: Locale,
	t: T,
	tComeback: Translator<'achievements.comeback'>,
): { title: string; detail: string | null } {
	switch (entry.type) {
		case 'SESSION_COMPLETED': {
			const { session } = entry
			const parts = [t('sets', { count: session.completedSets })]
			if (session.volumeKg > 0) {
				parts.push(
					t('volume', {
						value: formatWeightAmount(session.volumeKg, unit, locale, 0),
						unit: getWeightUnitLabel(unit),
					}),
				)
			}
			if (session.durationSec && session.durationSec > 0) {
				parts.push(formatDuration(session.durationSec))
			}
			return {
				title: session.dayName
					? t('sessionTitleDay', {
							routine: session.routineName,
							day: session.dayName,
						})
					: t('sessionTitle', { routine: session.routineName }),
				detail: parts.join(' · '),
			}
		}
		case 'PERSONAL_RECORD':
			return {
				title: t('recordTitle', { exercise: entry.record.exerciseName }),
				detail: t('recordDetail', {
					weight: formatWeight(entry.record.weightKg, unit, locale),
					reps: entry.record.reps,
					e1rm: formatWeight(entry.record.estimated1rmKg, unit, locale),
				}),
			}
		case 'PROGRESSION_CHANGED':
			return {
				title: t('progressionTitle', {
					exercise: entry.progression.exerciseName,
				}),
				detail: describeProgression(entry.progression.sets, unit, locale, t),
			}
		case 'ACHIEVEMENT_UNLOCKED':
			return {
				title: t('achievementTitle', { title: entry.achievement.title }),
				detail: entry.achievement.description,
			}
		case 'STREAK_MILESTONE':
			return {
				title: t('streakTitle', { days: entry.streak.streakDays }),
				detail: entry.streak.title,
			}
		case 'COMEBACK':
			return {
				title: t('comebackTitle'),
				detail: formatComebackEvidence(entry.comeback, tComeback),
			}
		case 'ROUTINE_SHARED':
			return {
				title: t('routineTitle', { name: entry.routine.name }),
				detail: `${t('days', { count: entry.routine.dayCount })} · ${t('exercises', { count: entry.routine.exerciseCount })}`,
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
export function describeEffectiveAudience(
	audience: ActivityAudience,
	t: T,
): string {
	switch (audience) {
		case 'PRIVATE':
			return t('effectivePrivate')
		case 'FOLLOWERS':
			return t('effectiveFollowers')
		case 'PUBLIC':
			return t('effectivePublic')
	}
}

type TPrivacy = Translator<'settings.privacyOverview'>

/**
 * Why an entry reaches fewer people than its owner chose, or null when the
 * choice is what took effect. Staying silent would let an owner believe a
 * wider choice was honoured.
 */
export function describeActivityCap(
	sharing: ActivityEntrySharing,
	t: T,
	tPrivacy: TPrivacy,
): string | null {
	if (!sharing.cappedBy) return null
	if (sharing.cappedBy === 'ROUTINE') {
		return sharing.effectiveAudience === 'PRIVATE'
			? t('routineCapPrivate')
			: t('routineCapFollowers')
	}
	return describeSectionCap(
		sharing.section,
		sharing.sectionRule,
		sharing.override ?? sharing.defaultAudience,
		t,
		tPrivacy,
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
	t: T,
	tPrivacy: TPrivacy,
): string | null {
	if (ACTIVITY_RANK[sectionRule] >= ACTIVITY_RANK[chosen]) return null
	const rule = t(AUDIENCE_LABELS[sectionRule])
	const reached =
		sectionRule === 'PRIVATE' ? t('nobodyElse') : rule.toLowerCase()
	return t('sectionCap', {
		section: tPrivacy(PRIVACY_SECTION_LABEL_KEYS[section]).toLowerCase(),
		rule,
		reached,
	})
}

/**
 * The profile section whose privacy capped an entry, so the row can link to
 * the one setting that changes it (UX-08); null for a routine's own cap,
 * which is changed on the routine.
 */
export function activityCapSection(
	sharing: ActivityEntrySharing,
): ActivitySection | null {
	return sharing.cappedBy === 'SECTION' ? sharing.section : null
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

export const ACTIVITY_REACTION_LABELS: Record<ActivityReaction, Key> = {
	STRENGTH: 'reactionStrength',
	DISCIPLINE: 'reactionDiscipline',
	RESPECT: 'reactionRespect',
	INSPIRING: 'reactionInspiring',
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
	t: T,
): string {
	const label = t(ACTIVITY_REACTION_LABELS[reaction])
	const count = summary.counts[reaction]
	if (summary.viewerReaction === reaction) {
		return t('reactionChosen', { label, count })
	}
	return count > 0 ? t('reactionCount', { label, count }) : label
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

// SOC-06 copy: what a comment surface says, and what it must not.
// `commentPlaceholder`, and `commentsEmpty`: an empty comment list says so
// plainly rather than rendering nothing.

/**
 * The delete confirmation names whose comment it is, because the owner of the
 * activity may delete somebody else's and should be told that is what they are
 * doing.
 */
export const describeCommentDelete = (isOwnComment: boolean, t: T): string =>
	isOwnComment ? t('deleteOwnComment') : t('deleteOtherComment')

/**
 * Why the composer is absent. A control that is present but refuses on click
 * reads as broken, so the reason replaces it.
 */
export const describeCommentBudgetSpent = (max: number, t: T): string =>
	t('commentBudgetSpent', { max })

/** An empty feed says which of the two reasons it is. */
export function describeEmptyFeed(
	followedCount: number,
	t: T,
): {
	title: string
	description: string
} {
	return followedCount === 0
		? {
				title: t('emptyNoFollowsTitle'),
				description: t('emptyNoFollowsBody'),
			}
		: {
				title: t('emptyNothingTitle'),
				description: t('emptyNothingBody'),
			}
}
