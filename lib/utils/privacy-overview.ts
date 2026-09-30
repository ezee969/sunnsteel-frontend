import type {
	ProfileDiscoverySettings,
	ProfilePrivacySettings,
	ProfileVisibility,
} from '@sunsteel/contracts'

import type { MessageKey, Translator } from '@/i18n/translator'

type Namespace = 'settings.privacyOverview'

/** Shared by the privacy selectors and the overview so the names never drift. */
export const PRIVACY_SECTION_LABEL_KEYS = {
	biography: 'sectionLabel.biography',
	location: 'sectionLabel.location',
	trainingIdentity: 'sectionLabel.trainingIdentity',
	workoutHistory: 'sectionLabel.workoutHistory',
	records: 'sectionLabel.records',
	bodyMetrics: 'sectionLabel.bodyMetrics',
	bodyProgress: 'sectionLabel.bodyProgress',
	routines: 'sectionLabel.routines',
	achievements: 'sectionLabel.achievements',
} as const satisfies Record<keyof ProfilePrivacySettings, MessageKey<Namespace>>

export const PRIVACY_AUDIENCE_KEYS = {
	PUBLIC: 'audience.PUBLIC',
	FOLLOWERS: 'audience.FOLLOWERS',
	PRIVATE: 'audience.PRIVATE',
} as const satisfies Record<ProfileVisibility, MessageKey<Namespace>>

// Rendered on profiles today. Routines and achievements only store a rule
// until their surfaces ship (ROUT-04/PROF-08, ACH-03), so they are reported
// separately rather than as if something were already visible.
const LIVE_SECTIONS: Array<keyof ProfilePrivacySettings> = [
	'biography',
	'location',
	'trainingIdentity',
	'workoutHistory',
	'records',
	'bodyMetrics',
	'bodyProgress',
]
const PENDING_SECTIONS: Array<keyof ProfilePrivacySettings> = [
	'routines',
	'achievements',
]

/** Shown on every profile view, signed in or not, regardless of settings. */
export function alwaysVisibleProfileItems(t: Translator<Namespace>): string[] {
	return [
		t('alwaysVisible.name'),
		t('alwaysVisible.username'),
		t('alwaysVisible.joined'),
		t('alwaysVisible.counts'),
	]
}

export interface PrivacyAudienceGroup {
	audience: ProfileVisibility
	title: string
	/** Where the sections in this group can be seen. */
	surfaces: string
	sections: string[]
}

export function getPrivacyAudienceGroups(
	t: Translator<Namespace>,
	privacy: ProfilePrivacySettings,
	username: string,
): PrivacyAudienceGroup[] {
	const sectionsFor = (audience: ProfileVisibility) =>
		LIVE_SECTIONS.filter(key => privacy[key] === audience).map(key =>
			t(PRIVACY_SECTION_LABEL_KEYS[key]),
		)
	return [
		{
			audience: 'PUBLIC',
			title: t(PRIVACY_AUDIENCE_KEYS.PUBLIC),
			surfaces: t('surfaces.PUBLIC', { username }),
			sections: sectionsFor('PUBLIC'),
		},
		{
			audience: 'FOLLOWERS',
			title: t(PRIVACY_AUDIENCE_KEYS.FOLLOWERS),
			surfaces: t('surfaces.FOLLOWERS'),
			sections: sectionsFor('FOLLOWERS'),
		},
		{
			audience: 'PRIVATE',
			title: t(PRIVACY_AUDIENCE_KEYS.PRIVATE),
			surfaces: t('surfaces.PRIVATE'),
			sections: sectionsFor('PRIVATE'),
		},
	]
}

/** Rules saved for sections that do not show anything on profiles yet. */
export function getPendingPrivacyRules(
	t: Translator<Namespace>,
	privacy: ProfilePrivacySettings,
): Array<{ label: string; audience: string }> {
	return PENDING_SECTIONS.map(key => ({
		label: t(PRIVACY_SECTION_LABEL_KEYS[key]),
		audience: t(PRIVACY_AUDIENCE_KEYS[privacy[key]]),
	}))
}

export function getDiscoverySummary(
	t: Translator<Namespace>,
	discovery: ProfileDiscoverySettings,
): Array<{ label: string; value: string }> {
	return [
		{
			label: t('discovery.searchByName'),
			value: discovery.discoverableByName
				? t('discovery.on')
				: t('discovery.off'),
		},
		{
			label: t('discovery.searchByUsername'),
			value: discovery.discoverableByUsername
				? t('discovery.on')
				: t('discovery.off'),
		},
		{
			// Persisted, but no contact upload or matching exists yet.
			label: t('discovery.contacts'),
			value: discovery.discoverableByContacts
				? t('discovery.contactsAllowed')
				: t('discovery.off'),
		},
	]
}
