import type {
	ProfileDiscoverySettings,
	ProfilePrivacySettings,
	ProfileVisibility,
} from '@sunsteel/contracts'

/** Shared by the privacy selectors and the overview so the names never drift. */
export const PRIVACY_SECTION_LABELS: Record<
	keyof ProfilePrivacySettings,
	string
> = {
	biography: 'Biography',
	location: 'Location',
	trainingIdentity: 'Training identity',
	workoutHistory: 'Workout history',
	records: 'Personal records',
	bodyMetrics: 'Body metrics',
	routines: 'Routines',
	achievements: 'Achievements',
}

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
]
const PENDING_SECTIONS: Array<keyof ProfilePrivacySettings> = [
	'routines',
	'achievements',
]

/** Shown on every profile view, signed in or not, regardless of settings. */
export const ALWAYS_VISIBLE_PROFILE_ITEMS = [
	'Name and avatar',
	'@username',
	'Join date',
	'Follower and following counts',
] as const

export interface PrivacyAudienceGroup {
	audience: ProfileVisibility
	title: string
	/** Where the sections in this group can be seen. */
	surfaces: string
	sections: string[]
}

export function getPrivacyAudienceGroups(
	privacy: ProfilePrivacySettings,
	username: string,
): PrivacyAudienceGroup[] {
	const sectionsFor = (audience: ProfileVisibility) =>
		LIVE_SECTIONS.filter(key => privacy[key] === audience).map(
			key => PRIVACY_SECTION_LABELS[key],
		)
	return [
		{
			audience: 'PUBLIC',
			title: 'Everyone',
			surfaces: `Your public link /members/${username}, including visitors who are not signed in, and your profile inside Sunnsteel.`,
			sections: sectionsFor('PUBLIC'),
		},
		{
			audience: 'FOLLOWERS',
			title: 'Followers',
			surfaces:
				'Your profile inside Sunnsteel, for signed-in members who follow you. Never on your public link.',
			sections: sectionsFor('FOLLOWERS'),
		},
		{
			audience: 'PRIVATE',
			title: 'Only me',
			surfaces: 'Visible only to you when you open your own profile.',
			sections: sectionsFor('PRIVATE'),
		},
	]
}

const AUDIENCE_LABELS: Record<ProfileVisibility, string> = {
	PUBLIC: 'Everyone',
	FOLLOWERS: 'Followers',
	PRIVATE: 'Only me',
}

/** Rules saved for sections that do not show anything on profiles yet. */
export function getPendingPrivacyRules(
	privacy: ProfilePrivacySettings,
): Array<{ label: string; audience: string }> {
	return PENDING_SECTIONS.map(key => ({
		label: PRIVACY_SECTION_LABELS[key],
		audience: AUDIENCE_LABELS[privacy[key]],
	}))
}

export function getDiscoverySummary(
	discovery: ProfileDiscoverySettings,
): Array<{ label: string; value: string }> {
	return [
		{
			label: 'Search by name',
			value: discovery.discoverableByName ? 'On' : 'Off',
		},
		{
			label: 'Search by @username',
			value: discovery.discoverableByUsername ? 'On' : 'Off',
		},
		{
			// Persisted, but no contact upload or matching exists yet.
			label: 'Contact matching',
			value: discovery.discoverableByContacts
				? 'Allowed, not available yet'
				: 'Off',
		},
	]
}
